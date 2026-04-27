import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  lastMessage: "",
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  showDetails: true,
  showSettings: false,
  darkMode: false,

  isGroupChat: false,
  groupInfo: null,

  /* ── Mute map: { [chatId]: boolean } ── */
  mutedChats: JSON.parse(localStorage.getItem("mutedChats") || "{}"),

  muteChat: (chatId, muted) =>
    set((state) => {
      const next = { ...state.mutedChats, [chatId]: muted };
      localStorage.setItem("mutedChats", JSON.stringify(next));
      return { mutedChats: next };
    }),

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  toggleDetails: () => set((state) => ({ showDetails: !state.showDetails })),

  changeChat: (chatId, user, lastMessage = "") => {
    const currentUser = useUserStore.getState().currentUser;

    if (!currentUser) return set({ chatId, user: null, lastMessage: "" });

    // Reset group state when switching to private chat
    set({ isGroupChat: false, groupInfo: null });

    if (user.blocked?.includes(currentUser.id)) {
      return set({
        chatId,
        user: null,
        lastMessage: "",
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    } else if (currentUser.blocked?.includes(user.id)) {
      return set({
        chatId,
        user,
        lastMessage,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      return set({
        chatId,
        user,
        lastMessage,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  changeGroup: (groupId, groupName, groupAvatar = "", memberCount = 0) => {
    set({
      chatId: groupId,
      isGroupChat: true,
      groupInfo: {
        id: groupId,
        name: groupName,
        avatar: groupAvatar,
        memberCount,
      },
      user: null, // No single receiver in group chat
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },

  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },

  updateCustomPseudo: (pseudo) => {
    set((state) => ({
      user: state.user ? { ...state.user, customPseudo: pseudo } : null,
    }));
  },
}));
