import { useEffect, useMemo, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Image,
  FileText,
  UserPlus,
  LogOut,
  Trash2,
  Users,
  Bell,
  VolumeX,
  Settings2,
  Shield,
  Link,
  Crown,
  Pencil,
} from "lucide-react";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import {
  getAvatarInitial,
  hasMediaAvatar,
  resolveAvatar,
} from "../../lib/media";
import { downloadFile, getDocumentName } from "../../lib/chatMessage";

const GroupSettings = () => {
  const {
    chatId,
    groupInfo,
    mutedChats = {},
    muteChat,
    darkMode,
  } = useChatStore();
  const { currentUser } = useUserStore();
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [directContacts, setDirectContacts] = useState([]);
  const [section, setSection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [groupTypeInput, setGroupTypeInput] = useState("Private");
  const [settingsInput, setSettingsInput] = useState({
    onlyAdminCanPost: false,
    allowMedia: true,
    allowPolls: true,
    membersCanInvite: true,
  });

  const isMuted = mutedChats?.[chatId] || false;
  const hasGroupImage = hasMediaAvatar(
    groupData?.groupImg || groupInfo?.avatar,
  );

  useEffect(() => {
    if (!chatId) return undefined;
    const unSub = onSnapshot(doc(db, "groups", chatId), (snap) => {
      if (!snap.exists()) {
        setGroupData(null);
        return;
      }
      const next = { id: snap.id, ...snap.data() };
      setGroupData(next);
      setGroupNameInput(next.groupName || groupInfo?.name || "");
      setDescriptionInput(next.description || "");
      setGroupTypeInput(
        next.groupType || next.settings?.groupType || "Private",
      );
      setSettingsInput({
        onlyAdminCanPost: Boolean(next.settings?.onlyAdminCanPost),
        allowMedia: next.settings?.allowMedia !== false,
        allowPolls: next.settings?.allowPolls !== false,
        membersCanInvite: next.settings?.membersCanInvite !== false,
      });
    });
    return () => unSub();
  }, [chatId, groupInfo?.name]);

  useEffect(() => {
    if (!groupData?.members?.length) {
      setMembers([]);
      return undefined;
    }

    let isCancelled = false;
    const loadMembers = async () => {
      try {
        const docs = await Promise.all(
          groupData.members.map(async (memberId) => {
            const memberSnap = await getDoc(doc(db, "users", memberId));
            if (!memberSnap.exists()) return null;
            return memberSnap.data();
          }),
        );
        if (!isCancelled) {
          setMembers(docs.filter(Boolean));
        }
      } catch {
        if (!isCancelled) setMembers([]);
      }
    };
    loadMembers();

    return () => {
      isCancelled = true;
    };
  }, [groupData?.members]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;
    const unSub = onSnapshot(doc(db, "userschats", currentUser.id), (snap) => {
      const chats = snap.data()?.chats || [];
      setDirectContacts(chats.map((item) => item.receiverId).filter(Boolean));
    });
    return () => unSub();
  }, [currentUser?.id]);

  const messages = groupData?.messages || [];
  const mediaItems = useMemo(() => messages.filter((m) => m.img), [messages]);
  const fileItems = useMemo(
    () => messages.filter((m) => m.document),
    [messages],
  );
  const isOwner =
    groupData?.adminId === currentUser?.id ||
    groupData?.ownerID === currentUser?.id;
  const groupType =
    groupData?.groupType || groupData?.settings?.groupType || "Private";
  const adminsCount =
    [groupData?.adminId, groupData?.ownerID].filter(Boolean).length || 1;

  const addToContacts = async (memberId) => {
    if (!currentUser?.id || !memberId || memberId === currentUser.id) return;
    if (directContacts.includes(memberId)) return;

    try {
      const existingQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.id),
      );
      const snap = await getDocs(existingQuery);
      let existingChat = null;

      snap.docs.forEach((chatDoc) => {
        const data = chatDoc.data();
        if (
          Array.isArray(data.participants) &&
          data.participants.includes(memberId)
        ) {
          existingChat = chatDoc;
        }
      });

      let chatId = existingChat?.id;
      if (!chatId) {
        const chatRef = doc(collection(db, "chats"));
        chatId = chatRef.id;
        await setDoc(chatRef, {
          createdAt: new Date(),
          messages: [],
          participants: [currentUser.id, memberId],
        });
      }

      const ensureUserChats = async (uid, receiverId) => {
        const targetRef = doc(db, "userschats", uid);
        const targetSnap = await getDoc(targetRef);
        if (!targetSnap.exists()) {
          await setDoc(targetRef, { chats: [] });
        }

        const currentChats = targetSnap.exists()
          ? targetSnap.data().chats || []
          : [];
        const alreadyThere = currentChats.some(
          (item) => item.chatId === chatId,
        );
        if (!alreadyThere) {
          await updateDoc(targetRef, {
            chats: arrayUnion({
              chatId,
              lastMessage: "",
              receiverId,
              updatedAt: Date.now(),
              isSeen: uid === currentUser.id,
            }),
          });
        }
      };

      await ensureUserChats(currentUser.id, memberId);
      await ensureUserChats(memberId, currentUser.id);
      toast.success("Contact added");
    } catch (error) {
      toast.error("Failed to add contact");
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupData?.id || !currentUser?.id) return;
    if (!window.confirm("Leave this group?")) return;

    try {
      await updateDoc(doc(db, "groups", groupData.id), {
        members: arrayRemove(currentUser.id),
      });
      toast.success("You left the group");
    } catch (error) {
      toast.error("Unable to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupData?.id || !isOwner) return;
    if (!window.confirm("Delete this group permanently?")) return;

    try {
      await deleteDoc(doc(db, "groups", groupData.id));
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Unable to delete group");
    }
  };

  const handleClearHistory = async () => {
    if (!groupData?.id) return;
    if (!window.confirm("Vider l'historique de ce groupe ?")) return;

    try {
      await updateDoc(doc(db, "groups", groupData.id), { messages: [] });
      toast.success("Historique vidé");
    } catch (error) {
      toast.error("Impossible de vider l'historique");
    }
  };

  const handleToggleMute = () => {
    if (muteChat) muteChat(chatId, !isMuted);
  };

  const handleSaveGroup = async () => {
    if (!groupData?.id || !isOwner) return;

    try {
      await updateDoc(doc(db, "groups", groupData.id), {
        groupName: groupNameInput.trim() || groupData.groupName || "Group",
        description: descriptionInput.trim(),
        groupType: groupTypeInput,
        settings: {
          ...(groupData.settings || {}),
          ...settingsInput,
          groupType: groupTypeInput,
        },
      });
      setEditMode(false);
      toast.success("Groupe mis à jour");
    } catch (error) {
      toast.error("Impossible de modifier le groupe");
    }
  };

  const SectionHeader = ({ title }) => (
    <div className="det-section-header">
      <button className="det-back-btn" onClick={() => setSection(null)}>
        <ChevronLeft size={20} />
      </button>
      <h3>{title}</h3>
      <div style={{ width: 32 }} />
    </div>
  );

  const handleToggleSetting = async (key) => {
    if (!groupData?.id || !isOwner) return;
    const nextValue = !settingsInput[key];
    const nextSettings = {
      ...settingsInput,
      [key]: nextValue,
    };

    setSettingsInput(nextSettings);

    try {
      await updateDoc(doc(db, "groups", groupData.id), {
        settings: {
          ...(groupData.settings || {}),
          ...nextSettings,
          groupType: groupTypeInput,
        },
      });
      toast.success("Paramètre mis à jour");
    } catch (error) {
      setSettingsInput((prev) => ({ ...prev, [key]: !nextValue }));
      toast.error("Impossible de modifier le paramètre");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!groupData?.id || !isOwner) return;
    if (!memberId || memberId === currentUser?.id) return;
    if (!window.confirm("Retirer ce membre du groupe ?")) return;

    try {
      await updateDoc(doc(db, "groups", groupData.id), {
        members: arrayRemove(memberId),
      });
      toast.success("Membre retiré");
    } catch (error) {
      toast.error("Impossible de retirer le membre");
    }
  };

  const handleAddMembers = async () => {
    if (!groupData?.id) return;

    const canInvite = isOwner || groupData?.settings?.membersCanInvite !== false;
    if (!canInvite) {
      toast.error("Seul l'administrateur peut ajouter des membres.");
      return;
    }

    const input = window.prompt(
      "Noms d'utilisateurs des membres à ajouter (séparés par des virgules)",
      "",
    );
    if (!input) return;
    const usernames = input
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!usernames.length) return;

    try {
      // Find IDs by usernames
      const usersRef = collection(db, "users");
      const foundIds = [];
      for (const uname of usernames) {
        const q = query(usersRef, where("username", "==", uname));
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundIds.push(snap.docs[0].id);
        } else {
          toast.warn(`Utilisateur '${uname}' non trouvé.`);
        }
      }

      if (!foundIds.length) return;

      // Filter out already existing members
      const newMemberIds = foundIds.filter(
        (id) => !groupData.members?.includes(id),
      );
      if (!newMemberIds.length) {
        toast.warning("Tous les membres valides sont déjà dans le groupe");
        return;
      }

      const msg = {
        id: "sys_" + Date.now() + Math.random().toString(36).substr(2, 9),
        senderId: currentUser.id,
        senderName: currentUser.username,
        text: `A ajouté ${newMemberIds.length} membre(s) au groupe.`,
        createdAt: new Date(),
        isSystem: true,
      };

      await updateDoc(doc(db, "groups", groupData.id), {
        members: arrayUnion(...newMemberIds),
        messages: arrayUnion(msg),
      });
      toast.success(`${newMemberIds.length} membre(s) ajouté(s)`);
    } catch (error) {
      toast.error("Impossible d'ajouter les membres");
    }
  };

  if (section === "manage" && isOwner) {
    return (
      <div className={`Details ${darkMode ? "dark" : ""}`}>
        <SectionHeader title="Gérer le groupe" />

        <div className="det-info-block-main group-det-members">
          <div className="group-det-members-header">
            <strong>Informations</strong>
          </div>
          <div className="det-info-row">
            <span className="det-info-label">Nom du groupe</span>
            <input
              className="group-det-inline-input"
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
            />
          </div>
          <div className="det-info-row">
            <span className="det-info-label">Description</span>
            <textarea
              className="group-det-inline-input group-det-inline-textarea"
              rows="3"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
            />
          </div>
          <div className="det-info-row">
            <span className="det-info-label">Type de groupe</span>
            <select
              className="group-det-inline-input"
              value={groupTypeInput}
              onChange={(e) => setGroupTypeInput(e.target.value)}
            >
              <option value="Private">Private</option>
              <option value="Public">Public</option>
              <option value="Study">Study</option>
            </select>
          </div>
          <div className="group-det-manage-save">
            <button type="button" onClick={handleSaveGroup}>
              Enregistrer
            </button>
          </div>
        </div>

        <div className="det-section-spacer" />

        <div className="det-list">
          <div
            className="det-item"
            onClick={() => handleToggleSetting("onlyAdminCanPost")}
          >
            <Shield size={20} className="det-item-icon-left" />
            <div className="det-item-col">
              <span className="det-item-text">Seul l'admin peut écrire</span>
              <span className="det-item-subtext">
                {settingsInput.onlyAdminCanPost ? "Activé" : "Désactivé"}
              </span>
            </div>
            <div
              className={`det-toggle ${settingsInput.onlyAdminCanPost ? "on" : ""}`}
            >
              <div className="det-toggle-thumb" />
            </div>
          </div>
          <div
            className="det-item"
            onClick={() => handleToggleSetting("allowMedia")}
          >
            <Image size={20} className="det-item-icon-left" />
            <div className="det-item-col">
              <span className="det-item-text">Autoriser les médias</span>
              <span className="det-item-subtext">
                {settingsInput.allowMedia ? "Activé" : "Désactivé"}
              </span>
            </div>
            <div
              className={`det-toggle ${settingsInput.allowMedia ? "on" : ""}`}
            >
              <div className="det-toggle-thumb" />
            </div>
          </div>
          <div
            className="det-item"
            onClick={() => handleToggleSetting("allowPolls")}
          >
            <FileText size={20} className="det-item-icon-left" />
            <div className="det-item-col">
              <span className="det-item-text">Autoriser les sondages</span>
              <span className="det-item-subtext">
                {settingsInput.allowPolls ? "Activé" : "Désactivé"}
              </span>
            </div>
            <div
              className={`det-toggle ${settingsInput.allowPolls ? "on" : ""}`}
            >
              <div className="det-toggle-thumb" />
            </div>
          </div>
          <div
            className="det-item"
            onClick={() => handleToggleSetting("membersCanInvite")}
          >
            <UserPlus size={20} className="det-item-icon-left" />
            <div className="det-item-col">
              <span className="det-item-text">Les membres peuvent inviter</span>
              <span className="det-item-subtext">
                {settingsInput.membersCanInvite ? "Oui" : "Non"}
              </span>
            </div>
            <div
              className={`det-toggle ${settingsInput.membersCanInvite ? "on" : ""}`}
            >
              <div className="det-toggle-thumb" />
            </div>
          </div>
        </div>

        <div className="det-section-spacer" />

        <div className="det-info-block-main group-det-members">
          <div className="group-det-members-header">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <strong>Gestion des membres</strong>
              <button
                type="button"
                onClick={handleAddMembers}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#C5A059",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <UserPlus size={14} /> Ajouter
              </button>
            </div>
          </div>
          {members.map((member) => {
            const isCurrentMemberOwner =
              member.id === groupData?.adminId ||
              member.id === groupData?.ownerID;

            return (
              <div className="group-det-member-row" key={member.id}>
                <div className="group-det-member-main">
                  <img
                    src={resolveAvatar(member.avatar)}
                    alt={member.username || "User"}
                  />
                  <div>
                    <span>{member.username || "User"}</span>
                    <small>{isCurrentMemberOwner ? "Admin" : "Membre"}</small>
                  </div>
                </div>
                <div className="group-det-member-actions">
                  {member.id !== currentUser?.id && !isCurrentMemberOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === "media") {
    return (
      <div className={`Details ${darkMode ? "dark" : ""}`}>
        <SectionHeader title="Médias du groupe" />
        {mediaItems.length === 0 ? (
          <div className="det-empty">
            <Image size={40} opacity={0.3} />
            <p>Aucun média trouvé</p>
          </div>
        ) : (
          <div className="det-media-grid">
            {mediaItems.map((item, index) => (
              <div
                key={item.id || index}
                className="det-media-thumb"
                onClick={() =>
                  window.open(item.img, "_blank", "noopener,noreferrer")
                }
              >
                <img src={item.img} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (section === "files") {
    return (
      <div className={`Details ${darkMode ? "dark" : ""}`}>
        <SectionHeader title="Fichiers du groupe" />
        {fileItems.length === 0 ? (
          <div className="det-empty">
            <FileText size={40} opacity={0.3} />
            <p>Aucun fichier trouvé</p>
          </div>
        ) : (
          <div className="det-file-list">
            {fileItems.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                className="det-file-item group-det-file-btn"
                onClick={() =>
                  downloadFile(item.document, getDocumentName(item))
                }
              >
                <div className="det-file-icon">
                  <FileText size={20} color="#fff" />
                </div>
                <div className="det-file-info">
                  <span className="det-file-name">{getDocumentName(item)}</span>
                  <span className="det-file-date">Télécharger</span>
                </div>
                <ChevronRight size={16} className="det-chevron" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`Details ${darkMode ? "dark" : ""}`}>
      <div className="det-hero group-det-hero">
        <div className="det-avatar-ring">
          {hasGroupImage ? (
            <img
              src={groupData?.groupImg || groupInfo?.avatar}
              alt=""
              className="det-avatar"
            />
          ) : (
            <div className="det-avatar group-det-avatar-fallback">
              {getAvatarInitial(groupData?.groupName || groupInfo?.name, "G")}
            </div>
          )}
          {isMuted && (
            <div className="det-mute-badge" title="En sourdine">
              <VolumeX size={12} color="#fff" />
            </div>
          )}
        </div>

        {editMode && isOwner ? (
          <div className="group-det-edit-box">
            <div className="group-det-edit-head">
              <Pencil size={16} />
              <strong>Edit group</strong>
            </div>
            <input
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              placeholder="Nom du groupe"
            />
            <textarea
              rows="3"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Description"
            />
            <div className="group-det-edit-actions">
              <button type="button" onClick={() => setEditMode(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveGroup}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="det-name-wrapper">
              <div className="det-name-row">
                <h2 className="det-name">
                  {groupData?.groupName || groupInfo?.name || "Group"}
                </h2>
              </div>
            </div>
            <p className="det-sub">
              {members.length || groupData?.members?.length || 0} membres
            </p>

            <div className="det-quick-actions">
              <button className="det-action-circle" onClick={handleToggleMute}>
                <div className="det-circle-icon">
                  {isMuted ? <Bell size={20} /> : <VolumeX size={20} />}
                </div>
                <span>{isMuted ? "Son" : "Muet"}</span>
              </button>
              {isOwner && (
                <button
                  className="det-action-circle"
                  onClick={() => setSection("manage")}
                >
                  <div className="det-circle-icon">
                    <Settings2 size={20} />
                  </div>
                  <span>Gérer</span>
                </button>
              )}
              <button className="det-action-circle" onClick={handleLeaveGroup}>
                <div className="det-circle-icon">
                  <LogOut size={20} />
                </div>
                <span>Quitter</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        <div className="det-item" onClick={() => setSection("media")}>
          <Image size={20} className="det-item-icon-left" />
          <span className="det-item-text">Médias partagés</span>
          <span className="det-badge">{mediaItems.length}</span>
        </div>
        <div className="det-item" onClick={() => setSection("files")}>
          <FileText size={20} className="det-item-icon-left" />
          <span className="det-item-text">Fichiers et liens</span>
          <span className="det-badge">{fileItems.length}</span>
        </div>
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        <div className="det-item">
          <Shield size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Type de groupe</span>
            <span className="det-item-subtext">{groupType}</span>
          </div>
        </div>
        <div className="det-item">
          <Link size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Description</span>
            <span className="det-item-subtext">
              {groupData?.description || "Aucune description"}
            </span>
          </div>
        </div>
        <div className="det-item">
          <Crown size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Administrateurs</span>
            <span className="det-item-subtext">{adminsCount}</span>
          </div>
        </div>
        <div className="det-item">
          <Users size={20} className="det-item-icon-left" />
          <div className="det-item-col" style={{ flex: 1 }}>
            <span className="det-item-text">Membres</span>
            <span className="det-item-subtext">{members.length}</span>
          </div>
          {(isOwner || groupData?.settings?.membersCanInvite !== false) && (
            <button
              className="det-action-circle"
              style={{
                width: 32,
                height: 32,
                background: "rgba(197, 160, 89, 0.1)",
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAddMembers();
              }}
              title="Ajouter un membre"
            >
              <UserPlus size={16} color="#C5A059" />
            </button>
          )}
        </div>
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        <div className="det-item">
          <Shield size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Seul l'admin peut écrire</span>
            <span className="det-item-subtext">
              {groupData?.settings?.onlyAdminCanPost ? "Activé" : "Désactivé"}
            </span>
          </div>
        </div>
        <div className="det-item">
          <Image size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Autoriser les médias</span>
            <span className="det-item-subtext">
              {groupData?.settings?.allowMedia !== false
                ? "Activé"
                : "Désactivé"}
            </span>
          </div>
        </div>
        <div className="det-item">
          <FileText size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Autoriser les sondages</span>
            <span className="det-item-subtext">
              {groupData?.settings?.allowPolls !== false
                ? "Activé"
                : "Désactivé"}
            </span>
          </div>
        </div>
        <div className="det-item">
          <UserPlus size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Les membres peuvent inviter</span>
            <span className="det-item-subtext">
              {groupData?.settings?.membersCanInvite !== false ? "Oui" : "Non"}
            </span>
          </div>
        </div>
      </div>

      <div className="det-section-spacer" />

      <div className="det-info-block-main group-det-members">
        <div className="group-det-members-header">
          <strong>Liste des membres</strong>
        </div>
        {members.map((member) => {
          const alreadyContact = directContacts.includes(member.id);
          const isCurrentMemberOwner =
            member.id === groupData?.adminId ||
            member.id === groupData?.ownerID;

          return (
            <div className="group-det-member-row" key={member.id}>
              <div className="group-det-member-main">
                <img
                  src={resolveAvatar(member.avatar)}
                  alt={member.username || "User"}
                />
                <div>
                  <span>{member.username || "User"}</span>
                  <small>
                    {member.id === currentUser?.id ? "Vous" : "Membre"}
                  </small>
                </div>
              </div>
              <div className="group-det-member-actions">
                {isCurrentMemberOwner && (
                  <span className="group-det-owner-badge">owner</span>
                )}
                {!alreadyContact && member.id !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => addToContacts(member.id)}
                  >
                    <UserPlus size={14} />
                    Ajouter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        <div className="det-item" onClick={handleToggleMute}>
          <Bell size={20} className="det-item-icon-left" />
          <div className="det-item-col">
            <span className="det-item-text">Notifications</span>
            <span className="det-item-subtext">
              {isMuted ? "Désactivées" : "Activées"}
            </span>
          </div>
          <div className={`det-toggle ${isMuted ? "" : "on"}`}>
            <div className="det-toggle-thumb" />
          </div>
        </div>
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        <div className="det-item danger" onClick={handleClearHistory}>
          <Trash2 size={20} className="det-item-icon-left" />
          <span className="det-item-text">Vider l'historique</span>
        </div>
        <div className="det-item danger" onClick={handleLeaveGroup}>
          <LogOut size={20} className="det-item-icon-left" />
          <span className="det-item-text">Quitter le groupe</span>
        </div>
        {isOwner && (
          <div className="det-item danger" onClick={handleDeleteGroup}>
            <Trash2 size={20} className="det-item-icon-left" />
            <span className="det-item-text">Supprimer le groupe</span>
          </div>
        )}
      </div>

      <div className="det-section-spacer" style={{ height: "40px" }} />
    </div>
  );
};

export default GroupSettings;
