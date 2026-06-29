import { useState, useEffect } from "react";
import "./Details.css";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import {
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  BellOff,
  Bell,
  ShieldOff,
  Shield,
  LogOut,
  Image,
  FileText,
  Phone,
  Mail,
  Info,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { resolveAvatar } from "../../lib/media";
import { downloadFile, getDocumentName } from "../../lib/chatMessage";
import GroupSettings from "../Groups/GroupSettings";

/* ─── Helpers ─────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ══════════════════════════════════════════════════════
   DETAILS COMPONENT
══════════════════════════════════════════════════════ */
const Details = () => {
  // Recherche médias/fichiers
  const [mediaSearch, setMediaSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [textSearch, setTextSearch] = useState("");
  // Suppression de l'historique
  const handleClearHistory = async () => {
    if (!chatId) return;
    if (!window.confirm("Voulez-vous vraiment vider l'historique de ce chat ?"))
      return;
    try {
      const col = isGroupChat ? "groups" : "chats";
      const ref = doc(db, col, chatId);
      await updateDoc(ref, { messages: [] });
      setMessages([]);
    } catch (err) {
      alert("Erreur lors de la suppression de l'historique.");
    }
  };
  const {
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
    chatId,
    isGroupChat,
    groupInfo,
    mutedChats = {},
    muteChat,
    updateCustomPseudo,
    darkMode,
  } = useChatStore();
  const { currentUser } = useUserStore();

  const [section, setSection] = useState(null); // null | "media" | "files"
  const [messages, setMessages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [liveUser, setLiveUser] = useState(user || null);
  // Menu contextuel image
  const [imgMenu, setImgMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    img: null,
  });

  /* ─── Local Chat Relation Data ─── */
  const [localChatData, setLocalChatData] = useState(null);
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState("");

  const isMuted = mutedChats?.[chatId] || false;
  const isPinned = localChatData?.pinned || false;
  const customPseudo = localChatData?.pseudo || "";
  const activeUser = isGroupChat ? null : liveUser || user;

  /* ─── Subscribe to chat relation (for pinned & pseudo) ─── */
  useEffect(() => {
    if (!chatId || isGroupChat || !currentUser?.id) return;
    const unSub = onSnapshot(doc(db, "userschats", currentUser.id), (res) => {
      const allChats = res.data()?.chats || [];
      const current = allChats.find((c) => c.chatId === chatId);
      setLocalChatData(current);
      setPseudoInput(current?.pseudo || "");
    });
    return () => unSub();
  }, [chatId, isGroupChat, currentUser]);

  /* ─── Subscribe to messages for media/files ─── */
  useEffect(() => {
    if (!chatId) return;
    const col = isGroupChat ? "groups" : "chats";
    const unSub = onSnapshot(doc(db, col, chatId), (snap) => {
      if (snap.exists()) setMessages(snap.data().messages || []);
    });
    return () => unSub();
  }, [chatId, isGroupChat]);

  useEffect(() => {
    if (isGroupChat || !user?.id) {
      setLiveUser(user || null);
      return undefined;
    }

    const unSub = onSnapshot(doc(db, "users", user.id), (snap) => {
      if (!snap.exists()) {
        setLiveUser(user);
        return;
      }

      const data = snap.data();
      setLiveUser({
        ...data,
        id: data.id || user.id,
        customPseudo: user.customPseudo,
      });
    });

    return () => unSub();
  }, [isGroupChat, user]);

  const sharedImages = messages.filter((m) => m.img);
  const sharedDocs = messages.filter((m) => m.document);
  const filteredImages = mediaSearch.trim()
    ? sharedImages.filter(
        (m) =>
          (m.imgName || "").toLowerCase().includes(mediaSearch.toLowerCase()) ||
          (m.text || "").toLowerCase().includes(mediaSearch.toLowerCase()),
      )
    : sharedImages;
  const filteredDocs = fileSearch.trim()
    ? sharedDocs.filter(
        (m) =>
          (m.documentName || "").toLowerCase().includes(fileSearch.toLowerCase()) ||
          (m.text || "").toLowerCase().includes(fileSearch.toLowerCase()),
      )
    : sharedDocs;

  /* ─── Block handler ─── */
  const handleBlock = async () => {
    if (!user) return;
    const ref = doc(db, "users", currentUser.id);
    try {
      await updateDoc(ref, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {}
  };

  /* ─── Mute handler ─── */
  const handleMute = () => {
    if (muteChat) muteChat(chatId, !isMuted);
  };

  /* ─── Pin handler ─── */
  const handlePin = async () => {
    if (!localChatData || !currentUser?.id) return;
    try {
      const userChatsRef = doc(db, "userschats", currentUser.id);
      const snap = await getDoc(userChatsRef);
      if (snap.exists()) {
        const chats = snap.data().chats;
        const idx = chats.findIndex((c) => c.chatId === chatId);
        if (idx !== -1) {
          chats[idx].pinned = !chats[idx].pinned;
          await updateDoc(userChatsRef, { chats });
        }
      }
    } catch (err) {}
  };

  /* ─── Pseudo handler ─── */
  const handleSavePseudo = async () => {
    if (!currentUser?.id || !chatId) return;
    try {
      const userChatsRef = doc(db, "userschats", currentUser.id);
      const snap = await getDoc(userChatsRef);
      if (snap.exists()) {
        const chats = snap.data().chats;
        const idx = chats.findIndex((c) => c.chatId === chatId);
        if (idx !== -1) {
          chats[idx].pseudo = pseudoInput.trim();
          await updateDoc(userChatsRef, { chats });
          if (updateCustomPseudo) updateCustomPseudo(pseudoInput.trim());
        }
      }
      setIsEditingPseudo(false);
    } catch (err) {}
  };

  /* ─── Sub-section renderers ─── */
  const SectionHeader = ({ title }) => (
    <div className="det-section-header">
      <button className="det-back-btn" onClick={() => setSection(null)}>
        <ChevronLeft size={20} />
      </button>
      <h3>{title}</h3>
      <div style={{ width: 32 }} />
    </div>
  );

  const baseName = isGroupChat ? groupInfo?.name : activeUser?.username;
  const displayName = customPseudo || baseName;
  const displayAvatar = isGroupChat
    ? "./Groups.png"
    : resolveAvatar(activeUser?.avatar);
  const displaySub = isGroupChat
    ? `${groupInfo?.memberCount || ""} membres`
    : "En ligne";

  return (
    <div className={`Details ${darkMode ? "dark" : ""}`}>
      {/* ─── MEDIA GRID ─── */}
      {section === "media" && (
        <>
        <SectionHeader title="Médias partagés" />
        <input
          type="text"
          placeholder="Rechercher une image..."
          value={mediaSearch}
          onChange={(e) => setMediaSearch(e.target.value)}
          style={{
            width: "100%",
            margin: "8px 0 16px 0",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        {filteredImages.length === 0 ? (
          <div className="det-empty">
            <Image size={40} opacity={0.3} />
            <p>Aucun média trouvé</p>
          </div>
        ) : (
          <div className="det-media-grid">
            {filteredImages.map((m, i) => (
              <div
                key={i}
                className="det-media-thumb"
                onClick={() => setLightbox(m.img)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setImgMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    img: m.img,
                  });
                }}
              >
                <img src={m.img} alt="" />
                <span className="det-media-date">
                  {formatDate(m.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Menu contextuel image */}
        {imgMenu.visible && (
          <ul
            className="det-img-context-menu"
            style={{
              position: "fixed",
              top: imgMenu.y,
              left: imgMenu.x,
              zIndex: 9999,
              background: darkMode ? "#222" : "#fff",
              color: darkMode ? "#fff" : "#222",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 0,
              margin: 0,
              listStyle: "none",
              minWidth: 160,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <li
              className="det-img-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() => {
                setLightbox(imgMenu.img);
                setImgMenu({ ...imgMenu, visible: false });
              }}
            >
              Visionner
            </li>
            <li
              className="det-img-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() => {
                downloadFile(imgMenu.img, `image-${Date.now()}.jpg`);
                setImgMenu({ ...imgMenu, visible: false });
              }}
            >
              Enregistrer
            </li>
            <li
              className="det-img-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(imgMenu.img);
                } catch {}
                setImgMenu({ ...imgMenu, visible: false });
              }}
            >
              Copier le lien
            </li>
            {/* Option ouvrir dossier si local */}
            {imgMenu.img.startsWith("file://") && (
              <li
                className="det-img-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() => {
                  window.open(imgMenu.img.replace("file://", ""));
                  setImgMenu({ ...imgMenu, visible: false });
                }}
              >
                Ouvrir dossier
              </li>
            )}
            <li
              className="det-img-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#C00" }}
              onClick={() => setImgMenu({ ...imgMenu, visible: false })}
            >
              Annuler
            </li>
          </ul>
        )}
        {lightbox && (
          <div className="det-lightbox" onClick={() => setLightbox(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <img src={lightbox} alt="" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(lightbox, `image-${Date.now()}.jpg`)
                  }
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "10px 16px",
                    background: "#C5A059",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Fermer le menu contextuel si clic ailleurs */}
        {imgMenu.visible && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setImgMenu({ ...imgMenu, visible: false })}
          />
        )}
        </>
      )}

      {/* ─── FILES LIST ─── */}
      {section === "files" && (
        <>
        <SectionHeader title="Fichiers partagés" />
        <input
          type="text"
          placeholder="Rechercher un fichier..."
          value={fileSearch}
          onChange={(e) => setFileSearch(e.target.value)}
          style={{
            width: "100%",
            margin: "8px 0 16px 0",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        {filteredDocs.length === 0 ? (
          <div className="det-empty">
            <FileText size={40} opacity={0.3} />
            <p>Aucun fichier trouvé</p>
          </div>
        ) : (
          <div className="det-file-list">
            {filteredDocs.map((m, i) => {
              const name = getDocumentName(m);
              return (
                <a
                  key={i}
                  href={m.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="det-file-item"
                >
                  <div className="det-file-icon">
                    <FileText size={20} color="#fff" />
                  </div>
                  <div className="det-file-info">
                    <span className="det-file-name">{name || "Document"}</span>
                    <span className="det-file-date">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <ChevronRight size={16} className="det-chevron" />
                </a>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* ─── SEARCH VIEW ─── */}
      {section === "search" && (
        <>
          <SectionHeader title="Recherche de messages" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher dans la discussion..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            style={{ width: "100%", margin: "8px 0 16px 0", padding: 8, borderRadius: 8, border: "1px solid #ccc", fontSize: 15 }}
          />
          <div className="det-file-list">
            {textSearch.trim() ? (
              messages
                .filter(m => m.text?.toLowerCase().includes(textSearch.toLowerCase()))
                .map((m, i) => (
                  <div key={i} className="det-file-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, cursor: "default" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 12, opacity: 0.7 }}>
                      <strong>{m.senderName}</strong>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{m.text}</p>
                  </div>
                ))
            ) : (
              <p style={{ textAlign: "center", opacity: 0.5, marginTop: 20 }}>Tapez un mot-clé...</p>
            )}
          </div>
        </>
      )}

      {/* ─── MAIN VIEW ─── */}
      {!section && (
        <>
          {isGroupChat ? (
            <GroupSettings />
          ) : (
            <>
              {/* ── Profile Header ── */}
              <div className="det-hero">
        <div className="det-avatar-ring">
          <img src={displayAvatar} alt="" className="det-avatar" />
          {isMuted && (
            <div className="det-mute-badge" title="En sourdine">
              <VolumeX size={12} color="#fff" />
            </div>
          )}
        </div>

        {isEditingPseudo ? (
          <div className="det-pseudo-edit">
            <input
              autoFocus
              type="text"
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value)}
              placeholder={baseName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePseudo();
                else if (e.key === "Escape") setIsEditingPseudo(false);
              }}
            />
            <button onClick={handleSavePseudo} className="save-btn">
              ✓
            </button>
            <button
              onClick={() => setIsEditingPseudo(false)}
              className="cancel-btn"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="det-name-wrapper">
            <div
              className="det-name-row"
              onClick={() => !isGroupChat && setIsEditingPseudo(true)}
            >
              <h2 className="det-name">{displayName || "—"}</h2>
              {!isGroupChat && <span className="det-edit-hint">✎</span>}
            </div>
          </div>
        )}

        <p className="det-sub">{displaySub}</p>

        {/* Telegram-style Quick Action Buttons */}
        {!isGroupChat && activeUser && (
          <div className="det-quick-actions">
            <button className="det-action-circle" onClick={handleMute}>
              <div className="det-circle-icon">
                {isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <span>{isMuted ? "Son" : "Muet"}</span>
            </button>
            <button
              className="det-action-circle"
              onClick={() => {
                /* Future call feature */
              }}
            >
              <div className="det-circle-icon">
                <Phone size={20} />
              </div>
              <span>Appel</span>
            </button>
            <button
              className="det-action-circle"
              onClick={() => {
                setSection("search");
              }}
            >
              <div
                className="det-circle-icon"
                style={{ transform: "rotate(90deg)" }}
              >
                <Info size={20} />
              </div>
              <span>Recherche</span>
            </button>
          </div>
        )}
      </div>

      <div className="det-section-spacer" />

      {/* ── User Info Block ── */}
      {!isGroupChat && activeUser && (
        <>
          <div className="det-info-block-main">
            {activeUser?.phone ? (
              <div className="det-info-row">
                <span className="det-info-label">Téléphone</span>
                <span className="det-info-value">{activeUser.phone}</span>
              </div>
            ) : null}
            <div className="det-info-row">
              <span className="det-info-label">Email</span>
              <span className="det-info-value">
                {activeUser?.email || "Non renseigné"}
              </span>
            </div>
            <div className="det-info-row">
              <span className="det-info-label">Nom d'utilisateur</span>
              <span className="det-info-value">
                @
                {activeUser?.username?.toLowerCase().replace(/\s+/g, "") ||
                  "pseudo"}
              </span>
            </div>
          </div>
          <div className="det-section-spacer" />
        </>
      )}

      {/* ── Options list ── */}
      <div className="det-list">
        {/* Shared Media */}
        <div className="det-item" onClick={() => setSection("media")}>
          <Image size={20} className="det-item-icon-left" />
          <span className="det-item-text">Médias partagés</span>
          <span className="det-badge">{sharedImages.length}</span>
        </div>

        {/* Shared Files */}
        <div className="det-item" onClick={() => setSection("files")}>
          <FileText size={20} className="det-item-icon-left" />
          <span className="det-item-text">Fichiers et liens</span>
          <span className="det-badge">{sharedDocs.length}</span>
        </div>
      </div>

      <div className="det-section-spacer" />

      <div className="det-list">
        {/* Notifications (Mute) */}
        <div className="det-item" onClick={handleMute}>
          <Bell
            size={20}
            className={`det-item-icon-left ${isMuted ? "muted" : ""}`}
          />
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

        {/* Pin */}
        <div className="det-item" onClick={handlePin}>
          <span
            style={{
              fontSize: 18,
              filter: isPinned ? "" : "grayscale(100%)",
              opacity: isPinned ? 1 : 0.6,
            }}
            className="det-item-icon-left"
          >
            📌
          </span>
          <span className="det-item-text">
            {isPinned ? "Désépingler la discussion" : "Épingler la discussion"}
          </span>
          <div
            className={`det-toggle ${isPinned ? "on" : ""}`}
            style={{ background: isPinned ? "#C5A059" : "" }}
          >
            <div className="det-toggle-thumb" />
          </div>
        </div>
      </div>

      <div className="det-section-spacer" />

      {/* ── Danger Zone ── */}
      <div className="det-list">
        {/* Clear History */}
        <div className="det-item danger" onClick={handleClearHistory}>
          <Trash2 size={20} className="det-item-icon-left" />
          <span className="det-item-text">Vider l'historique</span>
        </div>

        {/* Block */}
        {!isGroupChat && (
          <div className="det-item danger" onClick={handleBlock}>
            <ShieldOff size={20} className="det-item-icon-left" />
            <span className="det-item-text">
              {isCurrentUserBlocked
                ? "Vous êtes bloqué"
                : isReceiverBlocked
                  ? "Débloquer l'utilisateur"
                  : "Bloquer l'utilisateur"}
            </span>
          </div>
        )}
      </div>

      <div className="det-section-spacer" style={{ height: "40px" }} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Details;
