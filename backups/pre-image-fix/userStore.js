import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import { create } from "zustand";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        console.warn("User doc missing for uid:", uid, "- creating...");
        // Create minimal user doc
        await setDoc(doc(db, "users", uid), {
          id: uid,
          blocked: [],
        });
        set({ currentUser: { id: uid, blocked: [] }, isLoading: false });
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      console.error("Erreur chargement profil:", err.message);
      set({ currentUser: null, isLoading: false });
    }
  },
  setUser: (user) => set({ currentUser: user }),
  updateAvatar: (url) => set((state) => ({ 
    currentUser: state.currentUser ? { ...state.currentUser, avatar: url } : null 
  })),
}));