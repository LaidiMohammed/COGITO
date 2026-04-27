/**
 * ChatDemo.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Composant Chat STANDALONE — fonctionne SANS Firebase.
 * Tous les messages et fichiers sont stockés dans le state React local.
 *
 * Points d'intégration Firebase marqués : // @FIXME: Link to Firebase
 *
 * Pour passer en mode Firebase réel :
 *   1. Remplacez `useDemoMessages` par les appels Firestore (onSnapshot, updateDoc…)
 *   2. Remplacez `uploadDemo` par `upload` de ../lib/upload.js
 *   3. Décommentez les imports Firebase en bas du fichier
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";
import { uploadDemo } from "../../lib/uploadDemo";
import {
  REACTION_OPTIONS,
  buildReplyPreview,
  cloneMessageForForward,
  createMessageId,
  downloadFile,
  getAttachmentUrl,
  getDocumentName,
  getDownloadName,
  getMessagePreview,
  toggleReaction,
} from "../../lib/chatMessage";

/* ─────────────────────────────────────────────────────────────
   DEMO CONFIG — utilisateur courant simulé
   // @FIXME: Link to Firebase — à remplacer par useUserStore()
───────────────────────────────────────────────────────────── */
const DEMO_CURRENT_USER = {
  id: "demo-user-1",
  username: "Moi",
  avatar: null,
};

const DEMO_OTHER_USER = {
  id: "demo-user-2",
  username: "COGITO Bot",
  avatar: null,
};

/* ─────────────────────────────────────────────────────────────
   MESSAGES DE DÉMONSTRATION
───────────────────────────────────────────────────────────── */
const INITIAL_MESSAGES = [
  {
    id: createMessageId(),
    senderId: DEMO_OTHER_USER.id,
    senderName: DEMO_OTHER_USER.username,
    text: "👋 Bienvenue dans COGITO ! Ce chat fonctionne en mode démo — aucune connexion Firebase n'est nécessaire.",
    createdAt: new Date(Date.now() - 120_000),
    reactions: {},
  },
  {
    id: createMessageId(),
    senderId: DEMO_OTHER_USER.id,
    senderName: DEMO_OTHER_USER.username,
    text: "Essayez d'envoyer un texte, une photo, ou un document. Les fichiers sont stockés localement (Data URL).",
    createdAt: new Date(Date.now() - 60_000),
    reactions: { "👍": [DEMO_CURRENT_USER.id] },
  },
];

/* ─────────────────────────────────────────────────────────────
   STICKERS
───────────────────────────────────────────────────────────── */
const STICKERS = [
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/TdfyKrN7HGTIY/giphy.gif",
  "https://media.giphy.com/media/11sBLVxIRvnAwt/giphy.gif",
  "https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif",
  "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblWQ/giphy.gif",
];

/* ─────────────────────────────────────────────────────────────
   ICÔNES SVG INLINE
───────────────────────────────────────────────────────────── */
const IconPhone = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.39 19a19.45 19.45 0 0 1-6-6
      19.79 19.79 0 0 1-2.93-8.39A2 2 0 0 1 4.43 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81
      a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
      c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
    />
  </svg>
);

const IconVideo = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const IconInfo = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconImage = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconMic = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconFileText = ({ size = 20, color = "currentColor" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    strokeWidth="1.8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconMapPin = ({ color = "currentColor" }) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    stroke={color}
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconBarChart = ({ color = "currentColor" }) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    stroke={color}
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconGift = ({ color = "currentColor" }) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    stroke={color}
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const EmojiSVG = ({ active }) => {
  const color = active ? "#C5A059" : "#5a5a7a";
  return (
    <svg
      className="emoji-face-svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="9.5" r="1.4" fill={color} stroke="none" />
      <circle cx="15" cy="9.5" r="1.4" fill={color} stroke="none" />
      <path
        d={
          active
            ? "M8 14.5s1.5 2.5 4 2.5 4-2.5 4-2.5"
            : "M8 14s1.5 2 4 2 4-2 4-2"
        }
      />
      {active && (
        <>
          <ellipse
            cx="7.5"
            cy="13.5"
            rx="1.5"
            ry="0.8"
            fill="#ffb8b8"
            stroke="none"
            opacity="0.7"
          />
          <ellipse
            cx="16.5"
            cy="13.5"
            rx="1.5"
            ry="0.8"
            fill="#ffb8b8"
            stroke="none"
            opacity="0.7"
          />
        </>
      )}
    </svg>
  );
};

const PlusSVG = ({ rotated }) => (
  <svg
    className={`plus-svg ${rotated ? "rotated" : ""}`}
    viewBox="0 0 24 24"
    width="22"
    height="22"
    stroke={rotated ? "#C5A059" : "#5a5a7a"}
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    style={{ display: "block", flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SendSVG = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="#fff"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" />
  </svg>
);

const MoreSVG = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────────── */
const formatReplyTitle = (replyTo, currentUser) => {
  if (!replyTo) return "";
  return replyTo.senderId === currentUser?.id
    ? "Vous"
    : replyTo.senderName || "Utilisateur";
};

const formatMessageTime = (date) => {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/* ─────────────────────────────────────────────────────────────
   BADGE DEMO
───────────────────────────────────────────────────────────── */
const DemoBadge = () => (
  <div
    style={{
      position: "fixed",
      bottom: 16,
      right: 16,
      zIndex: 9999,
      background: "linear-gradient(135deg, #C5A059, #a07830)",
      color: "#fff",
      borderRadius: 20,
      padding: "6px 14px",
      fontSize: 12,
      fontWeight: 600,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      letterSpacing: "0.5px",
      pointerEvents: "none",
    }}
  >
    🔌 Mode Démo — pas de Firebase
  </div>
);

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — ChatDemo
   Props (optionnels, pour compatibilité avec ChatPage) :
     user        : objet user courant (sinon DEMO_CURRENT_USER)
     chatTitle   : titre de la conversation
     darkMode    : boolean
══════════════════════════════════════════════════════════════ */
const ChatDemo = ({
  user = DEMO_OTHER_USER,
  chatTitle = "COGITO — Mode Démo",
  darkMode = false,
}) => {
  /* ── State local (remplace Firestore) ── */
  // @FIXME: Link to Firebase — remplacer `messages` par onSnapshot(doc(db, "chats", chatId))
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  /* ── UI state ── */
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false); // emoji picker
  const [attachOpen, setAttachOpen] = useState(false); // attach menu
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [activeMessageIndex, setActiveMessageIndex] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [callSession, setCallSession] = useState(null);

  /* ── Poll state ── */
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);

  /* ── Context menu state ── */
  const [msgMenu, setMsgMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });
  const [reactionMenu, setReactionMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    emoji: null,
    users: [],
  });
  const [showReactUsers, setShowReactUsers] = useState({
    visible: false,
    emoji: null,
    users: [],
  });

  /* ── File state — on utilise un ref pour éviter le bug async ── */
  // FIX DATA TRANSFER: utiliser fileRef pour accéder à la valeur courante
  // dans handleSend sans dépendre du cycle de rendu React.
  const [filePreview, setFilePreview] = useState(null); // { url, name, type }
  const fileRef = useRef(null); // ref synchrone

  const endRef = useRef(null);
  const attachRef = useRef(null);

  /* Utilisateur courant (démo) */
  // @FIXME: Link to Firebase — remplacer par : const { currentUser } = useUserStore();
  const currentUser = DEMO_CURRENT_USER;

  /* ── Auto-scroll ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Fermer menus contextuels ── */
  useEffect(() => {
    if (!msgMenu.visible) return;
    const close = () => setMsgMenu((m) => ({ ...m, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [msgMenu.visible]);

  useEffect(() => {
    if (!reactionMenu.visible) return;
    const close = () => setReactionMenu((m) => ({ ...m, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [reactionMenu.visible]);

  /* ── Fermer tous les panneaux ── */
  const closeAll = () => {
    setOpen(false);
    setAttachOpen(false);
    setShowStickerPicker(false);
    setActiveMessageIndex(null);
    setShowPollModal(false);
  };

  /* ─────────────────────────────────────────────────────────
     PERSISTANCE DES MESSAGES — LOCAL STATE
     // @FIXME: Link to Firebase — remplacer par :
     //   await updateDoc(doc(db, "chats", chatId), {
     //     messages: arrayUnion(messagePayload)
     //   });
  ───────────────────────────────────────────────────────── */
  const persistMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /* ─────────────────────────────────────────────────────────
     ★ FIX DATA TRANSFER ★
     handleFile stocke le fichier dans fileRef (synchrone)
     ET appelle handleSendWithFile(fileData) directement,
     évitant ainsi le bug setTimeout + setState asynchrone.
  ───────────────────────────────────────────────────────── */
  const handleFile = (e, type) => {
    const raw = e.target.files?.[0];
    if (!raw) return;

    const fileData = {
      data: raw,
      url: URL.createObjectURL(raw),
      name: raw.name,
      type,
    };

    // Stocker dans le ref (synchrone) ET dans le state (pour preview)
    fileRef.current = fileData;
    setFilePreview(fileData);
    setAttachOpen(false);
    setActiveMessageIndex(null);

    // Appel direct avec la valeur fraîche — pas de setTimeout ni de state async
    handleSendWithFile(fileData);
  };

  /* ─────────────────────────────────────────────────────────
     ENVOI D'UN MESSAGE (texte + fichier optionnel)
     // @FIXME: Link to Firebase — voir persistMessage ci-dessus
  ───────────────────────────────────────────────────────── */
  const handleSendWithFile = async (fileOverride = null) => {
    const currentFile = fileOverride ?? fileRef.current;
    const trimmedText = text.trim();

    if (!trimmedText && !currentFile?.data) return;

    setIsSending(true);
    // @FIXME: Link to Firebase — cette notification de début d'upload
    //         peut être liée à une barre de progression Firebase Storage.

    try {
      let fileUrl = "";

      if (currentFile?.data) {
        const isImage = currentFile.data.type?.startsWith("image/");

        // @FIXME: Link to Firebase — remplacer uploadDemo par upload() de upload.js
        //         pour persister le fichier dans Firebase Storage.
        fileUrl = await uploadDemo(currentFile.data, "images", {
          maxWidth: isImage ? 800 : 0,
          maxHeight: isImage ? 800 : 0,
          quality: 0.75,
          maxLength: isImage ? 300_000 : 2_000_000,
        });
      }

      const payload = {
        id: createMessageId(),
        senderId: currentUser.id,
        senderName: currentUser.username,
        text: trimmedText,
        createdAt: new Date(),
        reactions: {},
        ...(replyTo ? { replyTo } : {}),
        ...(fileUrl &&
          currentFile.type === "image" && {
            img: fileUrl,
            imgName: currentFile.name || `image-${Date.now()}.jpg`,
          }),
        ...(fileUrl &&
          currentFile.type === "document" && {
            document: fileUrl,
            documentName: currentFile.name || "document",
            documentMimeType:
              currentFile.data?.type || "application/octet-stream",
          }),
        ...(fileUrl &&
          currentFile.type === "audio" && {
            audio: fileUrl,
            audioName: currentFile.name || "audio",
            audioMimeType: currentFile.data?.type || "audio/mpeg",
          }),
      };

      // @FIXME: Link to Firebase — persistMessage appelle ici setMessages (local).
      //         En production, appeler updateDoc Firestore.
      persistMessage(payload);

      // Reset
      fileRef.current = null;
      setFilePreview(null);
      setText("");
      setReplyTo(null);
      setActiveMessageIndex(null);
    } catch (err) {
      alert(err?.message || "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  /* ── Envoi texte seul ── */
  const handleSend = () => handleSendWithFile(null);

  /* ── Emoji ── */
  const handleEmoji = (e) => setText((prev) => prev + e.emoji);

  /* ── Réactions ── */
  const handleToggleReaction = (msgIndex, emoji) => {
    // @FIXME: Link to Firebase — remplacer par updateDoc Firestore
    setMessages((prev) => {
      const next = [...prev];
      next[msgIndex] = {
        ...next[msgIndex],
        reactions: toggleReaction(next[msgIndex], emoji, currentUser.id),
      };
      return next;
    });
  };

  /* ── Suppression ── */
  const handleDeleteMessage = (message) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    // @FIXME: Link to Firebase — remplacer par updateDoc avec messages filtrés
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  };

  /* ── Copie ── */
  const handleCopyMessage = async (message) => {
    const toCopy =
      message.text?.trim() ||
      getAttachmentUrl(message) ||
      getMessagePreview(message);
    try {
      await navigator.clipboard.writeText(toCopy);
    } catch {
      alert("Impossible de copier");
    }
    setActiveMessageIndex(null);
  };

  /* ── Ouvrir pièce jointe ── */
  const handleOpenAttachment = (message) => {
    const url = message.img || message.document || message.audio;
    if (!url) return;
    if (url.startsWith("data:")) {
      const [header, b64] = url.split(",");
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(b64);
      const arr = new Uint8Array(binary.length).map((_, i) =>
        binary.charCodeAt(i),
      );
      const blob = new Blob([arr], { type: mime });
      window.open(URL.createObjectURL(blob), "_blank");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setActiveMessageIndex(null);
  };

  /* ── Sauvegarder pièce jointe ── */
  const handleSaveAttachment = (message) => {
    const url = getAttachmentUrl(message);
    if (!url) return;
    downloadFile(url, getDownloadName(message));
    setActiveMessageIndex(null);
  };

  /* ── Reply ── */
  const handleReplyAction = (message) => {
    setReplyTo(buildReplyPreview(message));
    setActiveMessageIndex(null);
  };

  /* ── Forward ── */
  const handleForwardAction = (message) => {
    setForwardingMessage(message);
    setActiveMessageIndex(null);
  };

  const handleForwardInDemo = (targetMsgId) => {
    // @FIXME: Link to Firebase — en production, écrire dans un autre chatId Firestore
    if (!forwardingMessage) return;
    const cloned = cloneMessageForForward(forwardingMessage, currentUser);
    persistMessage(cloned);
    setForwardingMessage(null);
    alert("Message transféré dans la conversation actuelle (mode démo).");
  };

  /* ── Sticker ── */
  const handleStickerSend = (url) => {
    setShowStickerPicker(false);
    // @FIXME: Link to Firebase — remplacer par updateDoc Firestore
    persistMessage({
      id: createMessageId(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      sticker: url,
      createdAt: new Date(),
      reactions: {},
    });
  };

  /* ── Sondage ── */
  const handlePollSend = () => {
    if (
      !pollQuestion.trim() ||
      pollOptions.filter((o) => o.text.trim()).length < 2
    ) {
      alert("Question et au moins deux options sont requises.");
      return;
    }
    const finalOptions = pollOptions
      .filter((o) => o.text.trim())
      .map((o) => ({ ...o, votes: [] }));

    // @FIXME: Link to Firebase — remplacer par updateDoc Firestore
    persistMessage({
      id: createMessageId(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      poll: { question: pollQuestion, options: finalOptions },
      createdAt: new Date(),
      reactions: {},
    });
    setPollQuestion("");
    setPollOptions([
      { id: 1, text: "" },
      { id: 2, text: "" },
    ]);
    setShowPollModal(false);
  };

  const handleVote = (msgIndex, optionId) => {
    // @FIXME: Link to Firebase — remplacer par updateDoc Firestore
    setMessages((prev) => {
      const next = [...prev];
      const msg = { ...next[msgIndex] };
      const poll = {
        ...msg.poll,
        options: msg.poll.options.map((o) => ({ ...o, votes: [...o.votes] })),
      };

      poll.options.forEach((opt) => {
        if (opt.votes.includes(currentUser.id) && opt.id !== optionId) {
          opt.votes = opt.votes.filter((v) => v !== currentUser.id);
        }
      });
      const target = poll.options.find((o) => o.id === optionId);
      if (target && !target.votes.includes(currentUser.id))
        target.votes.push(currentUser.id);

      msg.poll = poll;
      next[msgIndex] = msg;
      return next;
    });
  };

  /* ── Localisation ── */
  const handleLocationSend = () => {
    setAttachOpen(false);
    if (!navigator.geolocation) return alert("Géolocalisation non supportée");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        // @FIXME: Link to Firebase — remplacer par updateDoc Firestore
        persistMessage({
          id: createMessageId(),
          senderId: currentUser.id,
          senderName: currentUser.username,
          location: { lat: latitude, lng: longitude },
          createdAt: new Date(),
          reactions: {},
        });
      },
      () => alert("Impossible d'obtenir la position"),
    );
  };

  /* ── Réaction context menu ── */
  const handleRemoveReaction = (emoji, users) => {
    if (!users.includes(currentUser.id)) return;
    const msgIdx = messages.findIndex((m) =>
      m.reactions?.[emoji]?.includes(currentUser.id),
    );
    if (msgIdx !== -1) handleToggleReaction(msgIdx, emoji);
    setReactionMenu((r) => ({ ...r, visible: false }));
  };

  /* ══════════════════════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════════════════════ */
  return (
    <div
      className="Chat"
      style={{
        backgroundImage: darkMode
          ? "url('/darke.png')"
          : "url('/backround.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <DemoBadge />

      {/* Dismiss overlay */}
      {(open ||
        attachOpen ||
        showStickerPicker ||
        activeMessageIndex !== null) && (
        <div className="dismiss-overlay" onClick={closeAll} />
      )}

      {/* ─── FORWARD MODAL ─────────────────────────────── */}
      {forwardingMessage && (
        <div
          className="forward-modal-overlay"
          onClick={() => setForwardingMessage(null)}
        >
          <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h3>Transférer le message</h3>
              <button type="button" onClick={() => setForwardingMessage(null)}>
                ✕
              </button>
            </div>
            <div className="forward-modal-list">
              {/* @FIXME: Link to Firebase — en prod, lister les chats depuis Firestore */}
              <button
                type="button"
                className="forward-target"
                onClick={handleForwardInDemo}
              >
                <div>
                  <strong>Conversation actuelle (démo)</strong>
                  <span>Transférer ici</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CALL OVERLAY ─────────────────────────────── */}
      {callSession && (
        <div className="call-overlay">
          <div className="call-overlay-header">
            <span>Appel Cogito Sécurisé</span>
            <button
              onClick={() => setCallSession(null)}
              className="btn-call-end"
            >
              Quitter l'appel
            </button>
          </div>
          <iframe
            src={`https://meet.jit.si/${callSession}#config.prejoinPageEnabled=false`}
            allow="camera; microphone; fullscreen; display-capture"
            className="call-iframe"
          />
        </div>
      )}

      {/* ─── POLL MODAL ───────────────────────────────── */}
      {showPollModal && (
        <div className="poll-modal-overlay">
          <div className="poll-modal">
            <div className="poll-header">
              <h3>Créer un Sondage</h3>
              <button onClick={() => setShowPollModal(false)}>✕</button>
            </div>
            <div className="poll-body">
              <input
                className="poll-input main"
                placeholder="Posez une question…"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              {pollOptions.map((opt, idx) => (
                <div key={opt.id} className="poll-opt-row">
                  <input
                    className="poll-input"
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[idx].text = e.target.value;
                      setPollOptions(next);
                    }}
                  />
                  {idx > 1 && (
                    <button
                      className="remove-opt"
                      onClick={() =>
                        setPollOptions(
                          pollOptions.filter((o) => o.id !== opt.id),
                        )
                      }
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
              <button
                className="add-opt"
                onClick={() =>
                  setPollOptions([...pollOptions, { id: Date.now(), text: "" }])
                }
              >
                + Ajouter une option
              </button>
            </div>
            <button className="poll-submit" onClick={handlePollSend}>
              Envoyer le Sondage
            </button>
          </div>
        </div>
      )}

      {/* ─── TOP BAR ──────────────────────────────────── */}
      <div className="chat-top">
        <div className="chat-top-user">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "U")}&background=C5A059&color=fff`
            }
            alt=""
            className="chat-avatar"
          />
          <div className="chat-top-texts">
            <span className="chat-username">{chatTitle}</span>
            <span className="chat-status">Mode Démo — local uniquement</span>
          </div>
        </div>
        <div className="chat-top-icons">
          {/* @FIXME: Link to Firebase — handleCall devrait écrire dans Firestore */}
          <button
            className="icon-btn"
            title="Appel audio"
            onClick={() => setCallSession(`cogito-demo-${Date.now()}`)}
          >
            <IconPhone />
          </button>
          <button
            className="icon-btn"
            title="Appel vidéo"
            onClick={() => setCallSession(`cogito-demo-vid-${Date.now()}`)}
          >
            <IconVideo />
          </button>
          <button className="icon-btn" title="Informations">
            <IconInfo />
          </button>
        </div>
      </div>

      {/* ─── MESSAGES ─────────────────────────────────── */}
      <div className="chat-centre">
        {messages.map((message, i) => {
          const reactionEntries = Object.entries(
            message.reactions || {},
          ).filter(([, u]) => u?.length);
          const isOwnMessage = message.senderId === currentUser?.id;
          const isMenuOpen = activeMessageIndex === i;

          return (
            <div
              key={message.id || i}
              className={`chat-message ${isOwnMessage ? "own" : ""} ${message.sticker ? "sticker-msg" : ""}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setMsgMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  message,
                });
              }}
            >
              <div className="chat-bubble-shell">
                <div className="chat-bubble">
                  <button
                    type="button"
                    className="chat-bubble-more"
                    onClick={() => setActiveMessageIndex(isMenuOpen ? null : i)}
                  >
                    <MoreSVG />
                  </button>

                  {/* Reply card */}
                  {message.replyTo && (
                    <div className="chat-reply-card">
                      <strong>
                        {formatReplyTitle(message.replyTo, currentUser)}
                      </strong>
                      <span>{message.replyTo.text}</span>
                    </div>
                  )}

                  {/* Forward banner */}
                  {message.forwardedFrom && (
                    <div className="chat-forwarded-banner">
                      Transféré depuis{" "}
                      {message.forwardedFrom.senderName || "Utilisateur"}
                    </div>
                  )}

                  {/* Image */}
                  {message.img && (
                    <div
                      className="chat-img-container"
                      onClick={() => handleOpenAttachment(message)}
                      style={{ cursor: "zoom-in" }}
                    >
                      <img
                        src={message.img}
                        alt=""
                        className="chat-img messenger-style"
                      />
                      <div className="chat-reactions-overlay">
                        {REACTION_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            className="reaction-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(i, emoji);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document */}
                  {message.document && (
                    <div
                      className="chat-file-link"
                      onClick={() => handleOpenAttachment(message)}
                      style={{ cursor: "pointer" }}
                    >
                      <IconFileText size={40} />
                      <span>{getDocumentName(message)}</span>
                    </div>
                  )}

                  {/* Audio */}
                  {message.audio && (
                    <audio controls className="chat-audio">
                      <source
                        src={message.audio}
                        type={message.audioMimeType || "audio/mpeg"}
                      />
                    </audio>
                  )}

                  {/* Call block */}
                  {message.callRoom && (
                    <div className="chat-call-block">
                      <div className="chat-call-header">
                        {message.callType === "video" ? (
                          <IconVideo />
                        ) : (
                          <IconPhone />
                        )}
                        <span>
                          Appel{" "}
                          {message.callType === "video" ? "Vidéo" : "Audio"}
                        </span>
                      </div>
                      <button
                        className="chat-call-join"
                        onClick={() => setCallSession(message.callRoom)}
                      >
                        Rejoindre l'appel
                      </button>
                    </div>
                  )}

                  {/* Localisation */}
                  {message.location && (
                    <div className="chat-location-wrap">
                      <iframe
                        width="100%"
                        height="200"
                        style={{
                          border: 0,
                          borderRadius: "10px",
                          marginTop: "5px",
                        }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${message.location.lat},${message.location.lng}&z=15&output=embed`}
                      />
                      <a
                        href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-file-link"
                        style={{ marginTop: "8px" }}
                      >
                        <IconMapPin /> <span>Ouvrir dans Maps</span>
                      </a>
                    </div>
                  )}

                  {/* Sticker */}
                  {message.sticker && (
                    <img
                      src={message.sticker}
                      alt="Sticker"
                      className="chat-sticker"
                    />
                  )}

                  {/* Poll */}
                  {message.poll && (
                    <div className="chat-poll">
                      <strong>{message.poll.question}</strong>
                      <div className="poll-options">
                        {message.poll.options.map((opt) => {
                          const total = message.poll.options.reduce(
                            (acc, o) => acc + (o.votes?.length || 0),
                            0,
                          );
                          const pct =
                            total === 0
                              ? 0
                              : Math.round(
                                  ((opt.votes?.length || 0) / total) * 100,
                                );
                          const didVote = opt.votes?.includes(currentUser.id);
                          return (
                            <div
                              key={opt.id}
                              className={`poll-opt ${didVote ? "voted" : ""}`}
                              onClick={() => handleVote(i, opt.id)}
                            >
                              <div
                                className="poll-opt-bg"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="poll-opt-text">{opt.text}</span>
                              <span className="poll-opt-pct">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="poll-total">
                        {message.poll.options.reduce(
                          (a, o) => a + (o.votes?.length || 0),
                          0,
                        )}{" "}
                        votes
                      </div>
                    </div>
                  )}

                  {/* Texte */}
                  {message.text && <p>{message.text}</p>}

                  <span className="chat-msg-time">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>

                {/* Réactions */}
                {reactionEntries.length > 0 && (
                  <div className="chat-reactions-bar">
                    {reactionEntries.map(([emoji, users]) => (
                      <span
                        key={emoji}
                        className={`chat-reaction-chip ${users.includes(currentUser.id) ? "own" : ""}`}
                        onClick={() => handleToggleReaction(i, emoji)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setReactionMenu({
                            visible: true,
                            x: e.clientX,
                            y: e.clientY,
                            emoji,
                            users,
                          });
                        }}
                        style={{ userSelect: "none" }}
                      >
                        <span>{emoji}</span>
                        <span>{users.length}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions message */}
                {isMenuOpen && (
                  <div className="chat-message-actions">
                    <div className="chat-message-reactions">
                      {REACTION_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(i, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="chat-message-action-list">
                      <button
                        type="button"
                        onClick={() => handleReplyAction(message)}
                      >
                        Répondre
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(message)}
                      >
                        Copier
                      </button>
                      {(message.img || message.document || message.audio) && (
                        <button
                          type="button"
                          onClick={() => handleOpenAttachment(message)}
                        >
                          Voir
                        </button>
                      )}
                      {(message.img || message.document || message.audio) && (
                        <button
                          type="button"
                          onClick={() => handleSaveAttachment(message)}
                        >
                          Enregistrer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleForwardAction(message)}
                      >
                        Transférer
                      </button>
                      <button
                        type="button"
                        style={{ color: "#c00" }}
                        onClick={() => handleDeleteMessage(message)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Context menu message */}
        {msgMenu.visible && msgMenu.message && (
          <ul
            className="chat-msg-context-menu"
            style={{
              position: "fixed",
              top: msgMenu.y,
              left: msgMenu.x,
              zIndex: 9999,
              background: "#fff",
              color: "#222",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 0,
              margin: 0,
              listStyle: "none",
              minWidth: 180,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(msgMenu.message.img || msgMenu.message.document) && (
              <li
                className="chat-msg-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() => {
                  handleOpenAttachment(msgMenu.message);
                  setMsgMenu((m) => ({ ...m, visible: false }));
                }}
              >
                {msgMenu.message.img
                  ? "Visionner l'image"
                  : "Ouvrir le document"}
              </li>
            )}
            {(msgMenu.message.img || msgMenu.message.document) && (
              <li
                className="chat-msg-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() => {
                  downloadFile(
                    msgMenu.message.img || msgMenu.message.document,
                    msgMenu.message.imgName ||
                      msgMenu.message.documentName ||
                      "fichier",
                  );
                  setMsgMenu((m) => ({ ...m, visible: false }));
                }}
              >
                Enregistrer
              </li>
            )}
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() => {
                handleForwardAction(msgMenu.message);
                setMsgMenu((m) => ({ ...m, visible: false }));
              }}
            >
              Transférer
            </li>
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    msgMenu.message.text || "",
                  );
                } catch {}
                setMsgMenu((m) => ({ ...m, visible: false }));
              }}
            >
              Copier
            </li>
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#c00" }}
              onClick={() => {
                handleDeleteMessage(msgMenu.message);
                setMsgMenu((m) => ({ ...m, visible: false }));
              }}
            >
              Supprimer
            </li>
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#888" }}
              onClick={() => setMsgMenu((m) => ({ ...m, visible: false }))}
            >
              Annuler
            </li>
          </ul>
        )}

        {/* Context menu réaction */}
        {reactionMenu.visible && (
          <ul
            style={{
              position: "fixed",
              top: reactionMenu.y,
              left: reactionMenu.x,
              zIndex: 9999,
              background: "#fff",
              color: "#222",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 0,
              margin: 0,
              listStyle: "none",
              minWidth: 180,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reactionMenu.users.includes(currentUser.id) && (
              <li
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() =>
                  handleRemoveReaction(reactionMenu.emoji, reactionMenu.users)
                }
              >
                Supprimer ma réaction
              </li>
            )}
            <li
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() => {
                setShowReactUsers({
                  visible: true,
                  emoji: reactionMenu.emoji,
                  users: reactionMenu.users,
                });
                setReactionMenu((r) => ({ ...r, visible: false }));
              }}
            >
              Voir qui a réagi
            </li>
            <li
              style={{ padding: "10px 16px", cursor: "pointer", color: "#888" }}
              onClick={() => setReactionMenu((r) => ({ ...r, visible: false }))}
            >
              Annuler
            </li>
          </ul>
        )}

        {/* Modal — qui a réagi */}
        {showReactUsers.visible && (
          <div
            style={{
              position: "fixed",
              top: 80,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10000,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 16,
              minWidth: 220,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Réactions {showReactUsers.emoji}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {showReactUsers.users.length === 0 ? (
                <li style={{ color: "#888" }}>Aucun utilisateur</li>
              ) : (
                showReactUsers.users.map((uid) => (
                  <li key={uid} style={{ padding: "4px 0" }}>
                    {uid}
                  </li>
                ))
              )}
            </ul>
            <button
              style={{
                marginTop: 12,
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#eee",
                padding: "4px 12px",
                cursor: "pointer",
              }}
              onClick={() =>
                setShowReactUsers({ visible: false, emoji: null, users: [] })
              }
            >
              Fermer
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ═══ INPUT BAR ════════════════════════════════════════ */}
      <div className="chat-bottom">
        {/* Reply preview */}
        {replyTo && (
          <div className="chat-composer-reply">
            <div>
              <strong>
                Réponse à {formatReplyTitle(replyTo, currentUser)}
              </strong>
              <span>{replyTo.text}</span>
            </div>
            <button type="button" onClick={() => setReplyTo(null)}>
              ✕
            </button>
          </div>
        )}

        {/* File preview */}
        {filePreview && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: "rgba(197,160,89,0.12)",
              borderRadius: 8,
              margin: "4px 8px",
            }}
          >
            {filePreview.type === "image" ? (
              <img
                src={filePreview.url}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            ) : (
              <IconFileText size={28} />
            )}
            <span
              style={{
                fontSize: 13,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {filePreview.name}
            </span>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
              onClick={() => {
                fileRef.current = null;
                setFilePreview(null);
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="chat-input-wrap">
          {/* Left actions */}
          <div className="chat-inner-actions">
            {/* Image */}
            <label
              className="icon-btn"
              htmlFor="demo-img-input"
              title="Photo / Vidéo"
            >
              <IconImage />
            </label>
            <input
              id="demo-img-input"
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e, "image")}
            />

            {/* Audio */}
            <label
              className="icon-btn"
              htmlFor="demo-audio-input"
              title="Message vocal"
            >
              <IconMic />
            </label>
            <input
              id="demo-audio-input"
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e, "audio")}
            />

            {/* Plus / Attach */}
            <div className="attach-wrap" ref={attachRef}>
              <button
                className={`icon-btn plus-btn ${attachOpen ? "gold" : ""}`}
                onClick={() => {
                  setAttachOpen((p) => !p);
                  setOpen(false);
                }}
                title="Plus d'options"
              >
                <PlusSVG rotated={attachOpen} />
              </button>

              {attachOpen && (
                <div className="attach-menu">
                  {/* Document */}
                  <label className="attach-item" htmlFor="demo-doc-input">
                    <span
                      className="attach-icon-circle"
                      style={{ background: "#f97316" }}
                    >
                      <IconFileText size={17} color="#fff" />
                    </span>
                    <span>Document</span>
                  </label>
                  <input
                    id="demo-doc-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e, "document")}
                  />

                  {/* Localisation */}
                  {/* @FIXME: Link to Firebase — en prod, persister dans Firestore */}
                  <button className="attach-item" onClick={handleLocationSend}>
                    <span
                      className="attach-icon-circle"
                      style={{ background: "#10b981" }}
                    >
                      <IconMapPin color="#fff" />
                    </span>
                    <span>Localisation</span>
                  </button>

                  {/* Poll */}
                  <button
                    className="attach-item"
                    onClick={() => {
                      setShowPollModal(true);
                      setAttachOpen(false);
                    }}
                  >
                    <span
                      className="attach-icon-circle"
                      style={{ background: "#C5A059" }}
                    >
                      <IconBarChart color="#fff" />
                    </span>
                    <span>Sondage</span>
                  </button>

                  {/* Sticker */}
                  <button
                    className="attach-item"
                    onClick={() => {
                      setShowStickerPicker(true);
                      setAttachOpen(false);
                    }}
                  >
                    <span
                      className="attach-icon-circle"
                      style={{ background: "#8b5cf6" }}
                    >
                      <IconGift color="#fff" />
                    </span>
                    <span>Sticker</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <input
            type="text"
            placeholder="Écrire un message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Right actions */}
          <div className="chat-inner-actions">
            {/* Emoji */}
            <div className="emoji-wrap">
              <button
                className={`icon-btn emoji-btn ${open ? "active" : ""}`}
                onClick={() => {
                  setOpen((p) => !p);
                  setAttachOpen(false);
                }}
                disabled={isSending}
                title="Emoji"
                type="button"
              >
                <EmojiSVG active={open} />
              </button>
              {open && (
                <div className="emoji-picker-pos">
                  <EmojiPicker
                    onEmojiClick={(e) => {
                      handleEmoji(e);
                      setOpen(false);
                    }}
                    lazyLoadEmojis
                    searchPlaceholder="Rechercher un emoji…"
                    skinTonesDisabled
                  />
                </div>
              )}

              {/* Sticker picker */}
              {showStickerPicker && (
                <div className="emoji-picker-pos sticker-picker-pos">
                  <div className="sticker-grid">
                    {STICKERS.map((s, idx) => (
                      <img
                        key={idx}
                        src={s}
                        alt={`Sticker ${idx}`}
                        onClick={() => handleStickerSend(s)}
                        className="sticker-thumb"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Send */}
            <button
              className={`send-btn ${isSending ? "sending" : ""}`}
              onClick={handleSend}
              disabled={(text.trim() === "" && !filePreview) || isSending}
              title="Envoyer"
              type="button"
            >
              <div className={`send-icon-container ${isSending ? "fly" : ""}`}>
                <SendSVG />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
