export const DEFAULT_AVATAR = "./Avatar.png";

export const sanitizeImageUrl = (value) => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";

  // Old profile flows stored temporary browser blob URLs in Firestore.
  // Those URLs stop working after refresh, so we treat them as empty.
  if (trimmed.startsWith("blob:")) return "";

  return trimmed;
};

export const resolveAvatar = (value, fallback = DEFAULT_AVATAR) =>
  sanitizeImageUrl(value) || fallback;

export const hasMediaAvatar = (value) => Boolean(sanitizeImageUrl(value));

export const getAvatarInitial = (value, fallback = "?") => {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed.charAt(0).toUpperCase();
};
