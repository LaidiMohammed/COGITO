import { useEffect, useState, useRef } from "react";
import "./ChatListe.css";
import AddUser from "./AddUser/addUser";
import GroupList from "../../Groups/GroupList";
import { useUserStore } from "../../../lib/userStore";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { VolumeX, Pin, Bell, BellOff, Trash2 } from "lucide-react";
import { resolveAvatar } from "../../../lib/media";

const EMPTY_USER = {
  username: "Utilisateur",
  avatar: "",
  blocked: [],
};

const ChatListe = () => {
  const [chatItems, setChatItems] = useState([]);
  const [chatUsers, setChatUsers] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chat: null,
  });
  const [viewMode, setViewMode] = useState("general");

  const { currentUser } = useUserStore();
  const { changeChat, mutedChats, muteChat, chatId, isGroupChat } = useChatStore();
  const menuRef = useRef(null);

  useEffect(() => {
    if (isGroupChat) {
      setViewMode("groups");
    } else if (chatId) {
      setViewMode("general");
    }
  }, [isGroupChat, chatId]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const unSub = onSnapshot(doc(db, "userschats", currentUser.id), (res) => {
      setChatItems(res.data()?.chats || []);
    });

    return () => unSub();
  }, [currentUser?.id]);

  useEffect(() => {
    const receiverIds = [
      ...new Set(chatItems.map((item) => item.receiverId).filter(Boolean)),
    ];

    if (receiverIds.length === 0) {
      setChatUsers({});
      return undefined;
    }

    const unSubs = receiverIds.map((receiverId) =>
      onSnapshot(doc(db, "users", receiverId), (snap) => {
        const nextUser = snap.exists()
          ? {
              ...snap.data(),
              blocked: Array.isArray(snap.data()?.blocked)
                ? snap.data().blocked
                : [],
            }
          : { ...EMPTY_USER, id: receiverId };

        setChatUsers((prev) => ({ ...prev, [receiverId]: nextUser }));
      }),
    );

    return () => {
      unSubs.forEach((unSub) => unSub());
    };
  }, [chatItems]);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const chats = [...chatItems]
    .map((item) => ({
      ...item,
      user: chatUsers[item.receiverId] || {
        ...EMPTY_USER,
        id: item.receiverId,
      },
    }))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const handleSelect = async (chat) => {
    const userChats = chatItems.map((item) => ({ ...item }));
    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId,
    );

    if (chatIndex === -1 || !currentUser?.id) return;

    userChats[chatIndex].isSeen = true;
    const userChatsRef = doc(db, "userschats", currentUser.id);

    try {
      await updateDoc(userChatsRef, { chats: userChats });
      const userWithPseudo = { ...chat.user, customPseudo: chat.pseudo };
      changeChat(chat.chatId, userWithPseudo, chat.lastMessage);
    } catch (err) {}
  };

  const handleRightClick = (e, chat) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, chat });
  };

  const handlePin = async () => {
    const userChats = chatItems.map((item) => ({ ...item }));
    const idx = userChats.findIndex(
      (item) => item.chatId === contextMenu.chat?.chatId,
    );

    if (idx === -1 || !currentUser?.id) return;

    userChats[idx].pinned = !userChats[idx].pinned;
    const userChatsRef = doc(db, "userschats", currentUser.id);

    try {
      await updateDoc(userChatsRef, { chats: userChats });
    } catch (err) {}

    setContextMenu({ visible: false, x: 0, y: 0, chat: null });
  };

  const handleDelete = async () => {
    if (!currentUser?.id) return;

    const userChats = chatItems.filter(
      (item) => item.chatId !== contextMenu.chat?.chatId,
    );
    const userChatsRef = doc(db, "userschats", currentUser.id);

    try {
      await updateDoc(userChatsRef, { chats: userChats });
    } catch (err) {}

    setContextMenu({ visible: false, x: 0, y: 0, chat: null });
  };

  const handleMuteContext = () => {
    const id = contextMenu.chat?.chatId;
    if (id && muteChat) muteChat(id, !mutedChats?.[id]);
    setContextMenu({ visible: false, x: 0, y: 0, chat: null });
  };

  const filteredChats = chats.filter((chat) =>
    (chat.user?.username || "").toLowerCase().includes(input.toLowerCase()),
  );

  return (
    <div className="Chatliste">
        <div className="Recherche">
          <div className="BarreRecherche">
            <img src="./search.png" alt="" />
            <input
              type="text"
              placeholder="Recherche"
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <img
            src={addMode ? "./minus.png" : "./plus.png"}
            alt=""
            className={`add plus-animate${addMode ? " rotated" : ""}`}
            onClick={() => setAddMode((prev) => !prev)}
          />
        </div>

        {/* Toggle Buttons */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "general" ? "active" : ""}`}
            onClick={() => setViewMode("general")}
            style={{ position: "relative" }}
          >
            Messages
            {filteredChats.some((c) => !c.isSeen) && (
              <span className="toggle-notif-dot"></span>
            )}
          </button>
          <button
            className={`toggle-btn ${viewMode === "groups" ? "active" : ""}`}
            onClick={() => setViewMode("groups")}
          >
            Groupes
          </button>
        </div>

      {/* Section: Messages Privés */}
      {viewMode === "general" && filteredChats.length > 0 && (
        <div className="chat-section-header">Messages</div>
      )}
      {viewMode === "general" &&
        filteredChats.map((chat) => {
          const isBlocked = chat.user?.blocked?.includes(currentUser?.id);
          const isActive = chatId === chat.chatId;

          return (
            <div
              className={`Item${chat.pinned ? " pinned" : ""}${isActive ? " active" : ""}`}
              key={chat.chatId}
              onClick={() => handleSelect(chat)}
              onContextMenu={(e) => handleRightClick(e, chat)}
              style={
                isActive
                  ? {
                      backgroundColor: "rgba(26, 42, 74, 0.08)",
                      borderLeft: "3px solid #C5A059",
                    }
                  : chat?.isSeen
                    ? { backgroundColor: "transparent" }
                    : { backgroundColor: "#e8f0fe" }
              }
            >
              <div className="avatar-wrapper">
                <img
                  src={
                    isBlocked
                      ? "./Avatar.png"
                      : resolveAvatar(chat.user?.avatar)
                  }
                  alt=""
                />
                {!chat?.isSeen && (
                  <span className="notif-badge badge-animated"></span>
                )}
              </div>

              <div className="texts">
                <div className="texts-top">
                  <span>
                    {isBlocked ? "User" : chat.pseudo || chat.user?.username}
                  </span>
                  {chat.pinned && (
                    <Pin size={12} color="#C5A059" style={{ marginLeft: 4 }} />
                  )}
                  {mutedChats?.[chat.chatId] && (
                    <span className="mute-icon" title="En sourdine">
                      <VolumeX size={12} color="#6366f1" />
                    </span>
                  )}
                </div>
                <p>{chat.lastMessage}</p>
              </div>
            </div>
          );
        })}

      {/* Group List - only show when in groups view */}
      {viewMode === "groups" && (
        <>
          <div className="chat-section-header">Groupes</div>
          <GroupList search={input} />
        </>
      )}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          ref={menuRef}
        >
          <div className="context-item" onClick={handlePin}>
            <Pin size={14} />
            <span>{contextMenu.chat?.pinned ? "Désépingler" : "Épingler"}</span>
          </div>
          <div className="context-item" onClick={handleMuteContext}>
            {mutedChats?.[contextMenu.chat?.chatId] ? (
              <>
                <Bell size={14} />
                <span>Activer</span>
              </>
            ) : (
              <>
                <BellOff size={14} />
                <span>Sourdine</span>
              </>
            )}
          </div>
          <div className="context-item delete" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>Supprimer</span>
          </div>
        </div>
      )}

      {addMode && (
        <div
          className="modal-overlay adduser-float"
          onClick={() => setAddMode(false)}
        >
          <div className="adduser-modal" onClick={(e) => e.stopPropagation()}>
            <AddUser />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatListe;
