const FALLBACK_FILE_NAME = "document";

export const REACTION_OPTIONS = ["👍", "❤️", "😀", "😮", "😭", "🎉"];

export const createMessageId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const isDataUrl = (value) =>
  typeof value === "string" && value.startsWith("data:");

export const getDocumentName = (message) => {
  if (message?.documentName) return message.documentName;
  if (!message?.document || isDataUrl(message.document))
    return FALLBACK_FILE_NAME;

  try {
    return (
      decodeURIComponent(message.document.split("/").pop().split("?")[0]) ||
      FALLBACK_FILE_NAME
    );
  } catch (error) {
    return FALLBACK_FILE_NAME;
  }
};

export const getAttachmentUrl = (message) =>
  message?.img || message?.document || message?.audio || "";

export const getDownloadName = (message) => {
  if (message?.img)
    return message.imgName || `image-${message.id || Date.now()}.jpg`;
  if (message?.document) return getDocumentName(message);
  if (message?.audio)
    return message.audioName || `audio-${message.id || Date.now()}`;
  return `message-${message?.id || Date.now()}`;
};

export const downloadFile = (url, fileName) => {
  if (!url || typeof document === "undefined") return;

  const fallbackDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || FALLBACK_FILE_NAME;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isDataUrl(url)) {
    fallbackDownload();
    return;
  }

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      return response.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || FALLBACK_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    })
    .catch(() => {
      fallbackDownload();
    });
};

export const getMessagePreview = (message) => {
  if (!message) return "";
  if (message.text?.trim()) return message.text.trim();
  if (message.img) return "Photo";
  if (message.document) return getDocumentName(message);
  if (message.audio) return "Message vocal";
  if (message.sticker) return "Sticker";
  if (message.location) return "Localisation";
  if (message.poll?.question) return `Sondage: ${message.poll.question}`;
  if (message.callRoom) return "Appel";
  return "Message";
};

export const buildReplyPreview = (message) => ({
  id: message?.id || "",
  senderId: message?.senderId || "",
  senderName: message?.senderName || "Utilisateur",
  text: getMessagePreview(message),
  hasImage: Boolean(message?.img),
  hasDocument: Boolean(message?.document),
});

export const cloneMessageForForward = (message, currentUser) => ({
  id: createMessageId(),
  senderId: currentUser.id,
  senderName: currentUser.username,
  text: message?.text || "",
  createdAt: new Date(),
  reactions: {},
  ...(message?.img && { img: message.img, imgName: message.imgName || "" }),
  ...(message?.document && {
    document: message.document,
    documentName: getDocumentName(message),
    documentMimeType: message.documentMimeType || "",
  }),
  ...(message?.audio && {
    audio: message.audio,
    audioName: message.audioName || "audio",
    audioMimeType: message.audioMimeType || "audio/mpeg",
  }),
  ...(message?.sticker && { sticker: message.sticker }),
  ...(message?.location && { location: message.location }),
  ...(message?.poll && { poll: message.poll }),
  ...(message?.replyTo && { replyTo: message.replyTo }),
  ...(message?.callRoom && {
    callRoom: message.callRoom,
    callType: message.callType || "audio",
  }),
  forwardedFrom: {
    senderId: message?.senderId || "",
    senderName: message?.senderName || "Utilisateur",
  },
});

export const toggleReaction = (message, emoji, userId) => {
  const reactions = { ...(message?.reactions || {}) };
  const existing = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];

  reactions[emoji] = existing.includes(userId)
    ? existing.filter((id) => id !== userId)
    : [...existing, userId];

  if (reactions[emoji].length === 0) {
    delete reactions[emoji];
  }

  return reactions;
};
