import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
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
        const data = docSnap.data();
        set({
          currentUser: {
            ...data,
            id: data.id || uid,
            blocked: Array.isArray(data.blocked) ? data.blocked : [],
          },
          isLoading: false,
        });
      } else {
        await setDoc(doc(db, "users", uid), {
          id: uid,
          username: auth.currentUser?.displayName || auth.currentUser?.email || "Utilisateur",
          email: auth.currentUser?.email || "",
          avatar: auth.currentUser?.photoURL || "",
          role: "student",
          plan: "free",
          premiumRequested: false,
          blocked: [],
        });
        set({
          currentUser: {
            id: uid,
            username: auth.currentUser?.displayName || auth.currentUser?.email || "Utilisateur",
            email: auth.currentUser?.email || "",
            avatar: auth.currentUser?.photoURL || "",
            role: "student",
            plan: "free",
            premiumRequested: false,
            blocked: [],
          },
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("fetchUserInfo error:", err);
      const fallback = auth.currentUser;
      if (fallback) {
        set({
          currentUser: {
            id: fallback.uid,
            username: fallback.displayName || fallback.email || "Utilisateur",
            email: fallback.email || "",
            avatar: fallback.photoURL || "",
            role: "student",
            plan: "free",
            premiumRequested: false,
            blocked: [],
          },
          isLoading: false,
        });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    }
  },
  setUser: (user) => set({ currentUser: user }),
  updateAvatar: async (url) => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, avatar: url }
        : null,
    }));
    // Persist to Firestore if user exists
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { avatar: url });
      } catch (err) {}
    }
  },
}));
