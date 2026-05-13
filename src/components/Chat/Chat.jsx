import { useState, useEffect, useRef, useCallback } from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { upload } from "../../lib/upload";

import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  getAvatarInitial,
  hasMediaAvatar,
  resolveAvatar,
} from "../../lib/media";
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

/* ─── Inline SVG icons ─────────────────────────────────── */

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

/* ─── Emoji face SVG (animated) ────────────────────────── */
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
      {/* Eyes – filled dots */}
      <circle cx="9" cy="9.5" r="1.4" fill={color} stroke="none" />
      <circle cx="15" cy="9.5" r="1.4" fill={color} stroke="none" />
      {/* Smile */}
      <path
        d={
          active
            ? "M8 14.5s1.5 2.5 4 2.5 4-2.5 4-2.5"
            : "M8 14s1.5 2 4 2 4-2 4-2"
        }
      />
      {/* Cheek blush when active */}
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

/* ─── Plus SVG (animated rotate) ──────────────────────── */
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

/* ─── Send SVG ─────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════
   CHAT COMPONENT
══════════════════════════════════════════════════════════ */
const formatReplyTitle = (replyTo, currentUser) => {
  if (!replyTo) return "";
  return replyTo.senderId === currentUser?.id
    ? "Vous"
    : replyTo.senderName || "Utilisateur";
};

const getChatCollection = (group) => (group ? "groups" : "chats");

const getPinnedMessagePreview = (message) => {
  if (!message) return "";
  if (message.text?.trim()) return message.text.trim();
  if (message.img) return "Image";
  if (message.document) return getDocumentName(message);
  if (message.audio) return "Audio";
  if (message.poll) return message.poll.question || "Sondage";
  if (message.sticker) return "Sticker";
  return "Message epingle";
};

const formatMessageTime = (date) => {
  if (!date) return "";
  try {
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date === "object" && date.toDate) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const Chat = () => {
  // Menu contextuel message (clic droit)
  const [msgMenu, setMsgMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });
  // Menu contextuel pour réactions (clic droit)
  const [reactionMenu, setReactionMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    emoji: null,
    users: [],
  });
  // Fenêtre liste utilisateurs ayant réagi
  const [showReactUsers, setShowReactUsers] = useState({
    visible: false,
    emoji: null,
    users: [],
  });
  const [open, setOpen] = useState(false); // emoji picker
  const [attachOpen, setAttachOpen] = useState(false); // attachment menu
  const chatCentreRef = useRef();
  const [text, setText] = useState("");
  const [chat, setChat] = useState();
  const [file, setFile] = useState({ data: null, url: "", type: "" });
  // FIX DATA TRANSFER: fileRef garde la valeur synchrone du fichier sélectionné
  // afin d'éviter le bug React async entre handleFile et handleSend.
  const fileRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [liveUser, setLiveUser] = useState(null);

  // Advanced Features State
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [callSession, setCallSession] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  // Poll State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);
  const [activeMessageIndex, setActiveMessageIndex] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [directChats, setDirectChats] = useState([]);
  const [directChatUsers, setDirectChatUsers] = useState({});

  const { currentUser } = useUserStore();
  const {
    chatId,
    user,
    isGroupChat,
    groupInfo,
    isCurrentUserBlocked,
    isReceiverBlocked,
    darkMode,
    toggleDetails,
  } = useChatStore();

  const isInteractionBlocked =
    !isGroupChat && (isCurrentUserBlocked || isReceiverBlocked);
  const endRef = useRef(null);
  const attachRef = useRef(null);
  const activeUser = isGroupChat ? null : liveUser || user;
  const isGroupAdmin =
    isGroupChat &&
    (chat?.adminId === currentUser?.id || chat?.ownerID === currentUser?.id);
  const onlyAdminCanPost = Boolean(chat?.settings?.onlyAdminCanPost);
  const canSendGroupMessage = !isGroupChat || !onlyAdminCanPost || isGroupAdmin;
  const canSendMedia =
    !isGroupChat || chat?.settings?.allowMedia !== false || isGroupAdmin;
  const canSendPolls =
    !isGroupChat || chat?.settings?.allowPolls !== false || isGroupAdmin;

  // Fermer menu contextuel message si clic ailleurs
  useEffect(() => {
    if (!msgMenu.visible) return;
    const close = () => setMsgMenu({ ...msgMenu, visible: false });
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [msgMenu]);

  // Fermer menu contextuel réaction si clic ailleurs
  useEffect(() => {
    if (!reactionMenu.visible) return;
    const close = () => setReactionMenu({ ...reactionMenu, visible: false });
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [reactionMenu]);

  /* ─── Auto-scroll ─── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  /* ─── Real-time messages ─── */
  useEffect(() => {
    if (!chatId) return undefined;
    const col = getChatCollection(isGroupChat);
    const unSub = onSnapshot(doc(db, col, chatId), (res) =>
      setChat(res.data()),
    );
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

      setLiveUser({
        ...snap.data(),
        id: snap.data().id || user.id,
        customPseudo: user.customPseudo,
      });
    });

    return () => unSub();
  }, [isGroupChat, user]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const unSub = onSnapshot(doc(db, "userschats", currentUser.id), (snap) => {
      setDirectChats(snap.data()?.chats || []);
    });

    return () => unSub();
  }, [currentUser?.id]);

  useEffect(() => {
    const receiverIds = [
      ...new Set(directChats.map((item) => item.receiverId).filter(Boolean)),
    ];

    if (receiverIds.length === 0) {
      setDirectChatUsers({});
      return undefined;
    }

    const unSubs = receiverIds.map((receiverId) =>
      onSnapshot(doc(db, "users", receiverId), (snap) => {
        const data = snap.exists()
          ? snap.data()
          : { id: receiverId, username: "Utilisateur" };
        setDirectChatUsers((prev) => ({ ...prev, [receiverId]: data }));
      }),
    );

    return () => {
      unSubs.forEach((unSub) => unSub());
    };
  }, [directChats]);

  /* ─── Handlers ─── */
  const closeTransientPanels = () => {
    setOpen(false);
    setAttachOpen(false);
    setShowStickerPicker(false);
    setActiveMessageIndex(null);
  };

  const syncPrivateChatPreview = async (
    targetChatId,
    receiverId,
    lastMessage,
  ) => {
    if (!currentUser?.id || !receiverId) return;

    const ids = [currentUser.id, receiverId];

    await Promise.all(
      ids.map(async (id) => {
        const ref = doc(db, "userschats", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const data = snap.data();
        const chats = [...(data.chats || [])];
        const idx = chats.findIndex((item) => item.chatId === targetChatId);

        if (idx === -1) return;

        chats[idx] = {
          ...chats[idx],
          lastMessage,
          isSeen: id === currentUser.id,
          updatedAt: Date.now(),
        };

        await updateDoc(ref, { chats });
      }),
    );
  };

  const persistMessage = async (messagePayload) => {
    await updateDoc(doc(db, getChatCollection(isGroupChat), chatId), {
      messages: arrayUnion(messagePayload),
    });

    if (!isGroupChat && user?.id) {
      await syncPrivateChatPreview(
        chatId,
        user.id,
        getMessagePreview(messagePayload),
      );
    }
  };

  const buildCurrentMessagePayload = ({
    fileUrl = "",
    fileType = "",
    extra = {},
  } = {}) => ({
    id: createMessageId(),
    senderId: currentUser.id,
    senderName: currentUser.username,
    text: text.trim(),
    createdAt: new Date(),
    reactions: {},
    ...(replyTo ? { replyTo } : {}),
    ...(fileUrl &&
      fileType === "image" && {
        img: fileUrl,
        imgName: file.data?.name || `image-${Date.now()}.jpg`,
      }),
    ...(fileUrl &&
      fileType === "document" && {
        document: fileUrl,
        documentName: file.data?.name || "document",
        documentMimeType: file.data?.type || "application/octet-stream",
      }),
    ...(fileUrl &&
      fileType === "audio" && {
        audio: fileUrl,
        audioName: file.data?.name || "audio",
        audioMimeType: file.data?.type || "audio/mpeg",
      }),
    ...extra,
  });

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
  };

  const handleFile = (e, type) => {
    if (
      !canSendGroupMessage ||
      (type === "image" && !canSendMedia) ||
      (type === "document" && !canSendMedia)
    ) {
      toast.warn("Action reservee selon les permissions du groupe");
      return;
    }
    const raw = e.target.files?.[0];
    if (!raw) {
      setAttachOpen(false);
      setActiveMessageIndex(null);
      return;
    }

    // ★ FIX DATA TRANSFER ★
    // On stocke le fichier dans fileRef (synchrone) ET dans le state (pour l'UI).
    // Puis on passe fileData DIRECTEMENT à handleSendWithFile — plus de setTimeout.
    // Avant : setTimeout(() => handleSend(), 0) échouait car le state React
    //         n'était pas encore mis à jour quand handleSend lisait `file`.
    const fileData = { data: raw, url: URL.createObjectURL(raw), type };
    fileRef.current = fileData;
    setFile(fileData);
    setAttachOpen(false);
    setActiveMessageIndex(null);

    // Appel direct avec la valeur fraîche — aucune dépendance au cycle React
    handleSendWithFile(fileData);
  };

  /**
   * handleSendWithFile — cœur de l'envoi.
   * @param {object|null} fileOverride — fichier passé directement depuis handleFile
   *   (évite la dépendance au state async React).
   *
   * // @FIXME: Link to Firebase — persistMessage() appelle updateDoc Firestore.
   *            upload() envoie le fichier dans Firebase Storage.
   */
  const handleSendWithFile = async (fileOverride = null) => {
    if (!canSendGroupMessage) {
      toast.warn(
        "Seul l'administrateur peut envoyer des messages dans ce groupe",
      );
      return;
    }

    const currentFile = fileOverride ?? fileRef.current ?? file;
    const currentText = text.trim();

    if (currentText === "" && !currentFile?.data) return;

    // Reset input immédiatement pour éviter le double-envoi et l'input bloqué
    setText("");
    setReplyTo(null);
    setActiveMessageIndex(null);
    setIsSending(true);

    let fileUrl = "";
    try {
      if (currentFile?.data) {
        const isImage = currentFile.data.type?.startsWith("image/");
        fileUrl = await upload(currentFile.data, "images", {
          allowDataUrlFallback: true,
          maxWidth: isImage ? 300 : 0,
          maxHeight: isImage ? 300 : 0,
          quality: 0.4,
          maxLength: isImage ? 80000 : 800000,
        });

        if (!fileUrl) {
          toast.error("Échec de l'envoi");
          return;
        }
      }

      const payload = buildCurrentMessagePayload({
        fileUrl,
        fileType: currentFile?.type ?? file.type,
      });
      // Patch: use captured currentText instead of state (already cleared)
      payload.text = currentText;
      await persistMessage(payload);

      fileRef.current = null;
      setFile({ data: null, url: "", type: "" });
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  /** handleSend — envoi texte seul (pas de passage de fichier). */
  const handleSend = () => handleSendWithFile(null);

  const handleLocationSend = () => {
    if (!canSendGroupMessage) {
      toast.warn(
        "Seul l'administrateur peut envoyer des messages dans ce groupe",
      );
      return;
    }
    if (!navigator.geolocation)
      return toast.error("Géolocalisation non supportée");
    setAttachOpen(false);
    toast.info("Récupération de la position...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          setIsSending(true);
          const col = isGroupChat ? "groups" : "chats";
          await updateDoc(doc(db, col, chatId), {
            messages: arrayUnion({
              senderId: currentUser.id,
              senderName: currentUser.username,
              location: { lat: latitude, lng: longitude },
              createdAt: new Date(),
            }),
          });
          setIsSending(false);
        } catch (err) {
          setIsSending(false);
        }
      },
      () => toast.error("Impossible d'obtenir la position"),
    );
  };

  const handleStickerSend = async (url) => {
    if (!canSendGroupMessage) {
      toast.warn(
        "Seul l'administrateur peut envoyer des messages dans ce groupe",
      );
      return;
    }
    setShowStickerPicker(false);
    setIsSending(true);
    try {
      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), {
        messages: arrayUnion({
          id: createMessageId(),
          senderId: currentUser.id,
          senderName: currentUser.username,
          sticker: url,
          createdAt: new Date(),
          reactions: {},
        }),
      });
      setIsSending(false);
    } catch (err) {
      setIsSending(false);
    }
  };

  const handlePollSend = async () => {
    if (!canSendGroupMessage || !canSendPolls) {
      toast.warn("Les sondages ne sont pas autorises dans ce groupe");
      return;
    }
    if (
      !pollQuestion.trim() ||
      pollOptions.filter((o) => o.text.trim()).length < 2
    ) {
      return toast.warn("Question et au moins deux options requises");
    }
    const finalOptions = pollOptions
      .filter((o) => o.text.trim())
      .map((o) => ({ ...o, votes: [] }));
    setIsSending(true);
    setShowPollModal(false);
    try {
      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), {
        messages: arrayUnion({
          id: createMessageId(),
          senderId: currentUser.id,
          senderName: currentUser.username,
          poll: { question: pollQuestion, options: finalOptions },
          createdAt: new Date(),
          reactions: {},
        }),
      });
      setPollQuestion("");
      setPollOptions([
        { id: 1, text: "" },
        { id: 2, text: "" },
      ]);
      setIsSending(false);
    } catch (err) {
      setIsSending(false);
    }
  };

  const handleVote = async (messageIndex, optionId) => {
    if (isSending) return;
    const messages = [...chat.messages];
    const msg = messages[messageIndex];
    if (!msg.poll) return;

    let hasChanged = false;
    msg.poll.options.forEach((opt) => {
      if (opt.votes.includes(currentUser.id)) {
        if (opt.id !== optionId) {
          opt.votes = opt.votes.filter((v) => v !== currentUser.id);
          hasChanged = true;
        }
      }
    });

    const targetOpt = msg.poll.options.find((o) => o.id === optionId);
    if (targetOpt && !targetOpt.votes.includes(currentUser.id)) {
      targetOpt.votes.push(currentUser.id);
      hasChanged = true;
    }

    if (hasChanged) {
      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), { messages });
    }
  };

  const handleCall = async (type) => {
    // Allow calls in private chats freely; only restrict in groups if admin-only post
    if (isGroupChat && !canSendGroupMessage) {
      toast.warn("Seul l'administrateur peut lancer un appel dans ce groupe");
      return;
    }
    const roomId = `cogito-call-${chatId}-${Date.now()}`;
    const col = isGroupChat ? "groups" : "chats";
    await updateDoc(doc(db, col, chatId), {
      messages: arrayUnion({
        id: createMessageId(),
        senderId: currentUser.id,
        senderName: currentUser.username,
        callRoom: roomId,
        callType: type,
        createdAt: new Date(),
        reactions: {},
      }),
    });
    setCallSession(roomId);
  };

  /* ── Voice recording ── */
  const startRecording = useCallback(async () => {
    if (isRecording || isInteractionBlocked || !canSendGroupMessage) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg;codecs=opus";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        const audioFile = new File([blob], `vocal-${Date.now()}.${ext}`, { type: mimeType });
        const fileData = { data: audioFile, url: URL.createObjectURL(audioFile), type: "audio" };
        fileRef.current = fileData;
        setFile(fileData);
        await handleSendWithFile(fileData);
        fileRef.current = null;
        setFile({ data: null, url: "", type: "" });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Accès au microphone refusé");
    }
  }, [isRecording, isInteractionBlocked, canSendGroupMessage]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;
    clearInterval(recordTimerRef.current);
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
  }, [isRecording]);

  const formatRecordTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleReplyAction = (message) => {
    setReplyTo(buildReplyPreview(message));
    setActiveMessageIndex(null);
  };

  const handleCopyMessage = async (message) => {
    const textToCopy =
      message.text?.trim() ||
      getAttachmentUrl(message) ||
      getMessagePreview(message);

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Message copie");
      setActiveMessageIndex(null);
    } catch (error) {
      toast.error("Impossible de copier");
    }
  };

  const handleOpenAttachment = (message) => {
    const url = message.img || message.document || message.audio;
    if (!url) return;

    if (url.startsWith("data:")) {
      // Handle Data URL for new tab (avoids about:blank security block)
      const [header, base64] = url.split(",");
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(base64);
      const array = [];
      for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
      const blob = new Blob([new Uint8Array(array)], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      // Note: we don't revoke here because it's for a new tab
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setActiveMessageIndex(null);
  };

  const handleSaveAttachment = (message) => {
    const url = getAttachmentUrl(message);
    if (!url) return;

    downloadFile(url, getDownloadName(message));
    toast.success("Telechargement lance");
    setActiveMessageIndex(null);
  };

  const handleToggleReaction = async (messageIndex, emoji) => {
    if (!chat?.messages) return;

    const messages = [...chat.messages];
    messages[messageIndex] = {
      ...messages[messageIndex],
      reactions: toggleReaction(messages[messageIndex], emoji, currentUser.id),
    };

    await updateDoc(doc(db, getChatCollection(isGroupChat), chatId), {
      messages,
    });
  };

  const handleForwardAction = (message) => {
    setForwardingMessage(message);
    setActiveMessageIndex(null);
  };

  const handleForwardToChat = async (targetChat) => {
    if (!forwardingMessage || !currentUser?.id) return;

    const payload = cloneMessageForForward(forwardingMessage, currentUser);

    try {
      await updateDoc(doc(db, "chats", targetChat.chatId), {
        messages: arrayUnion(payload),
      });

      await syncPrivateChatPreview(
        targetChat.chatId,
        targetChat.receiverId,
        getMessagePreview(payload),
      );
      toast.success("Message transfere");
      setForwardingMessage(null);
    } catch (error) {
      toast.error("Impossible de transferer le message");
    }
  };

  const forwardOptions = directChats
    .map((item) => ({
      ...item,
      user: directChatUsers[item.receiverId],
    }))
    .filter((item) => item.chatId !== chatId);

  // Suppression de la réaction de l'utilisateur
  const handleRemoveReaction = (emoji, users) => {
    if (!users.includes(currentUser.id)) return;
    const msgIdx = chat?.messages?.findIndex(
      (m) => m.reactions && m.reactions[emoji]?.includes(currentUser.id),
    );
    if (msgIdx !== -1) handleToggleReaction(msgIdx, emoji);
    setReactionMenu({ ...reactionMenu, visible: false });
  };

  // Affichage de la liste des utilisateurs ayant réagi
  const handleShowReactUsers = (emoji, users) => {
    setShowReactUsers({ visible: true, emoji, users });
    setReactionMenu({ ...reactionMenu, visible: false });
  };

  // Suppression d'un message
  const handleDeleteMessage = async (message) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      const col = isGroupChat ? "groups" : "chats";
      const ref = doc(db, col, chatId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const msgs = snap.data().messages || [];
      const filtered = msgs.filter((m) => m.id !== message.id);
      await updateDoc(ref, { messages: filtered });
    } catch (err) {
      alert("Erreur lors de la suppression du message.");
    }
  };

  const handlePinMessage = async (message) => {
    if (!isGroupChat || !isGroupAdmin) return;

    try {
      await updateDoc(doc(db, "groups", chatId), {
        pinnedMessage: {
          id: message.id || createMessageId(),
          text: getPinnedMessagePreview(message),
          senderName: message.senderName || "Membre",
        },
      });
      toast.success("Message epingle");
      setActiveMessageIndex(null);
    } catch (error) {
      toast.error("Impossible d'epingler le message");
    }
  };

  const handleUnpinMessage = async () => {
    if (!isGroupChat || !isGroupAdmin) return;

    try {
      await updateDoc(doc(db, "groups", chatId), {
        pinnedMessage: null,
      });
      toast.success("Message desepingle");
    } catch (error) {
      toast.error("Impossible de desepingler le message");
    }
  };

  const closeAll = () => {
    setOpen(false);
    setAttachOpen(false);
    setShowStickerPicker(false);
    setActiveMessageIndex(null);
  };

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
      {/* dismiss overlay */}
      {(open ||
        attachOpen ||
        showStickerPicker ||
        activeMessageIndex !== null) && (
        <div className="dismiss-overlay" onClick={closeAll} />
      )}

      {forwardingMessage && (
        <div
          className="forward-modal-overlay"
          onClick={() => setForwardingMessage(null)}
        >
          <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h3>Transferer le message</h3>
              <button type="button" onClick={() => setForwardingMessage(null)}>
                X
              </button>
            </div>
            <div className="forward-modal-list">
              {forwardOptions.length === 0 ? (
                <p className="forward-empty">
                  Aucune autre conversation disponible.
                </p>
              ) : (
                forwardOptions.map((option) => (
                  <button
                    key={option.chatId}
                    type="button"
                    className="forward-target"
                    onClick={() => handleForwardToChat(option)}
                  >
                    <img src={resolveAvatar(option.user?.avatar)} alt="" />
                    <div>
                      <strong>
                        {option.pseudo ||
                          option.user?.username ||
                          "Conversation"}
                      </strong>
                      <span>{option.lastMessage || "Envoyer ici"}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALL OVERLAY (JITSI) */}
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

      {/* POLL MODAL (SONDAGE) */}
      {showPollModal && (
        <div className="poll-modal-overlay">
          <div className="poll-modal">
            <div className="poll-header">
              <h3>Créer un Sondage</h3>
              <button onClick={() => setShowPollModal(false)}>X</button>
            </div>
            <div className="poll-body">
              <input
                className="poll-input main"
                placeholder="Posez une question..."
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
                      const newOpts = [...pollOptions];
                      newOpts[idx].text = e.target.value;
                      setPollOptions(newOpts);
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
                      -
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

      {/* ═══ TOP BAR ═══════════════════════════════════════════ */}
      <div className="chat-top">
        <div className="chat-top-user">
          {isGroupChat ? (
            hasMediaAvatar(groupInfo?.avatar) ? (
              <img src={groupInfo?.avatar} alt="" className="chat-avatar" />
            ) : (
              <div className="chat-avatar chat-avatar-fallback">
                {getAvatarInitial(groupInfo?.name, "G")}
              </div>
            )
          ) : (
            <img
              src={resolveAvatar(activeUser?.avatar)}
              alt=""
              className="chat-avatar"
            />
          )}
          <div className="chat-top-texts">
            <span className="chat-username">
              {isGroupChat
                ? groupInfo?.name
                : activeUser?.customPseudo || activeUser?.username}
            </span>
            <span className="chat-status">
              {isGroupChat ? "Espace Collaboration" : "En ligne"}
            </span>
          </div>
        </div>
        <div className="chat-top-icons">
          <button
            className="icon-btn"
            title="Appel audio"
            onClick={() => handleCall("audio")}
          >
            <IconPhone />
          </button>
          <button
            className="icon-btn"
            title="Appel vidéo"
            onClick={() => handleCall("video")}
          >
            <IconVideo />
          </button>
          <button
            className="icon-btn"
            title="Informations"
            onClick={toggleDetails}
          >
            <IconInfo />
          </button>
        </div>
      </div>

      {isGroupChat && chat?.pinnedMessage?.text && (
        <div className="chat-pinned-banner">
          <div>
            <strong>Message epingle</strong>
            <span>
              {chat.pinnedMessage.senderName}: {chat.pinnedMessage.text}
            </span>
          </div>
          {isGroupAdmin && (
            <button type="button" onClick={handleUnpinMessage}>
              X
            </button>
          )}
        </div>
      )}

      {/* ═══ MESSAGES ═══════════════════════════════════════════ */}

      <div className="chat-centre" ref={chatCentreRef}>
        {chat?.messages?.map((message, i) => {
          const reactionEntries = Object.entries(
            message.reactions || {},
          ).filter(([, users]) => users?.length);
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

                  {isGroupChat && !isOwnMessage && (
                    <span className="chat-sender-name">
                      {message.senderName || "Membre"}
                    </span>
                  )}

                  {message.forwardedFrom && (
                    <div className="chat-forwarded-banner">
                      Transfere depuis{" "}
                      {message.forwardedFrom.senderName || "Utilisateur"}
                    </div>
                  )}

                  {message.replyTo && (
                    <div className="chat-reply-card">
                      <strong>
                        {formatReplyTitle(message.replyTo, currentUser)}
                      </strong>
                      <span>{message.replyTo.text}</span>
                    </div>
                  )}

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
                            aria-label={`Réagir avec ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                  {message.audio && (
                    <audio controls className="chat-audio">
                      <source
                        src={message.audio}
                        type={message.audioMimeType || "audio/mpeg"}
                      />
                    </audio>
                  )}

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
                          {message.callType === "video" ? "Video" : "Audio"}
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
                      ></iframe>
                      <a
                        href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-file-link"
                        style={{ marginTop: "8px" }}
                      >
                        <IconMapPin size={16} /> <span>Ouvrir dans Maps</span>
                      </a>
                    </div>
                  )}

                  {message.sticker && (
                    <img
                      src={message.sticker}
                      alt="Sticker"
                      className="chat-sticker"
                    />
                  )}

                  {message.poll && (
                    <div className="chat-poll">
                      <strong>{message.poll.question}</strong>
                      <div className="poll-options">
                        {message.poll.options.map((opt) => {
                          const totalVotes = message.poll.options.reduce(
                            (acc, curr) => acc + (curr.votes?.length || 0),
                            0,
                          );
                          const myVotes = opt.votes?.length || 0;
                          const pct =
                            totalVotes === 0
                              ? 0
                              : Math.round((myVotes / totalVotes) * 100);
                          const didIVote = opt.votes?.includes(currentUser.id);
                          return (
                            <div
                              key={opt.id}
                              className={`poll-opt ${didIVote ? "voted" : ""}`}
                              onClick={() => handleVote(i, opt.id)}
                            >
                              <div
                                className="poll-opt-bg"
                                style={{ width: `${pct}%` }}
                              ></div>
                              <span className="poll-opt-text">{opt.text}</span>
                              <span className="poll-opt-pct">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="poll-total">
                        {message.poll.options.reduce(
                          (acc, curr) => acc + (curr.votes?.length || 0),
                          0,
                        )}{" "}
                        votes
                      </div>
                    </div>
                  )}

                  {message.text && <p>{message.text}</p>}
                  <span className="chat-msg-time">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>

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
                        Repondre
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
                      {isGroupChat && isGroupAdmin && (
                        <button
                          type="button"
                          onClick={() => handlePinMessage(message)}
                        >
                          Epingler
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleForwardAction(message)}
                      >
                        Transferer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Menu contextuel message */}
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
            {msgMenu.message.img && (
              <li
                className="chat-msg-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() => {
                  handleOpenAttachment(msgMenu.message);
                  setMsgMenu({ ...msgMenu, visible: false });
                }}
              >
                Visionner l'image
              </li>
            )}
            {msgMenu.message.document && (
              <li
                className="chat-msg-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() => {
                  handleOpenAttachment(msgMenu.message);
                  setMsgMenu({ ...msgMenu, visible: false });
                }}
              >
                Ouvrir le document
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
                  setMsgMenu({ ...msgMenu, visible: false });
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
                setMsgMenu({ ...msgMenu, visible: false });
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
                    msgMenu.message.text ||
                      msgMenu.message.img ||
                      msgMenu.message.document ||
                      "",
                  );
                } catch {}
                setMsgMenu({ ...msgMenu, visible: false });
              }}
            >
              Copier
            </li>
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#C00" }}
              onClick={async () => {
                await handleDeleteMessage(msgMenu.message);
                setMsgMenu({ ...msgMenu, visible: false });
              }}
            >
              Supprimer
            </li>
            <li
              className="chat-msg-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#888" }}
              onClick={() => setMsgMenu({ ...msgMenu, visible: false })}
            >
              Annuler
            </li>
          </ul>
        )}

        {/* Menu contextuel sur réaction */}
        {reactionMenu.visible && (
          <ul
            className="reaction-context-menu"
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
                className="reaction-menu-item"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onClick={() =>
                  handleRemoveReaction(reactionMenu.emoji, reactionMenu.users)
                }
              >
                Supprimer ma réaction
              </li>
            )}
            <li
              className="reaction-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onClick={() =>
                handleShowReactUsers(reactionMenu.emoji, reactionMenu.users)
              }
            >
              Voir qui a réagi
            </li>
            <li
              className="reaction-menu-item"
              style={{ padding: "10px 16px", cursor: "pointer", color: "#888" }}
              onClick={() =>
                setReactionMenu({ ...reactionMenu, visible: false })
              }
            >
              Annuler
            </li>
          </ul>
        )}

        {/* Fenêtre liste utilisateurs ayant réagi */}
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
              Utilisateurs ayant réagi {showReactUsers.emoji}
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

        {/* Suppression de la prévisualisation d'envoi direct */}

        <div ref={endRef} />
      </div>

      {/* ═══ INPUT BAR ══════════════════════════════════════════ */}
      <div className="chat-bottom">
        {replyTo && (
          <div className="chat-composer-reply">
            <div>
              <strong>
                Reponse a {formatReplyTitle(replyTo, currentUser)}
              </strong>
              <span>{replyTo.text}</span>
            </div>
            <button type="button" onClick={() => setReplyTo(null)}>
              X
            </button>
          </div>
        )}

        <div className="chat-input-wrap">
          {isGroupChat && !canSendGroupMessage && (
            <div className="chat-group-permission-banner">
              Seul l'administrateur peut envoyer des messages dans ce groupe.
            </div>
          )}

          {/* Left actions */}
          <div className="chat-inner-actions">
            {/* Image / Photo */}
            <label
              className="icon-btn"
              htmlFor="chat-img-visible"
              title="Photo / Vidéo"
            >
              <IconImage />
            </label>
            <input
              id="chat-img-visible"
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e, "image")}
              disabled={!canSendGroupMessage || !canSendMedia}
            />

            {/* Audio / Mic — enregistrement vocal */}
            {isRecording ? (
              <button
                className="icon-btn mic-recording"
                onClick={stopRecording}
                title="Arrêter l'enregistrement"
                type="button"
              >
                <span className="rec-dot" />
                <span className="rec-timer">{formatRecordTime(recordSeconds)}</span>
              </button>
            ) : (
              <button
                className="icon-btn"
                onClick={startRecording}
                disabled={isInteractionBlocked || !canSendGroupMessage || isSending}
                title="Message vocal"
                type="button"
              >
                <IconMic />
              </button>
            )}

            {/* Plus / Attach */}
            <div className="attach-wrap" ref={attachRef}>
              <button
                className={`icon-btn plus-btn ${attachOpen ? "gold" : ""}`}
                onClick={() => {
                  setAttachOpen((p) => !p);
                  setOpen(false);
                }}
                disabled={isInteractionBlocked || !canSendGroupMessage}
                title="Plus d'options"
              >
                <PlusSVG rotated={attachOpen} />
              </button>

              {attachOpen && (
                <div className="attach-menu">
                  {/* Document */}
                  <label className="attach-item" htmlFor="chat-doc-input">
                    <span
                      className="attach-icon-circle"
                      style={{ background: "#f97316" }}
                    >
                      <IconFileText size={17} color="#fff" />
                    </span>
                    <span>Document</span>
                  </label>
                  <input
                    id="chat-doc-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e, "document")}
                  />

                  {/* Location */}
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
                      if (canSendPolls && canSendGroupMessage) {
                        setShowPollModal(true);
                        setAttachOpen(false);
                      }
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

                  {/* Sticker / Gift */}
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
            placeholder={
              isInteractionBlocked
                ? "Vous ne pouvez pas répondre"
                : "Écrire un message…"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isInteractionBlocked || isSending || !canSendGroupMessage}
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
                disabled={isInteractionBlocked || isSending}
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
                    lazyLoadEmojis={true}
                    searchPlaceholder="Rechercher un emoji…"
                    skinTonesDisabled
                  />
                </div>
              )}
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
              disabled={
                isInteractionBlocked ||
                (text.trim() === "" && !file.data) ||
                isSending
              }
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

export default Chat;
