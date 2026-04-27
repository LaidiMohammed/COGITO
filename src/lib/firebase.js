import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "cogi-26845.firebaseapp.com",
  projectId: "cogi-26845",
  storageBucket: "cogi-26845.firebasestorage.app",
  messagingSenderId: "869125346055",
  appId: "1:869125346055:web:e9ec5a787d24579951aba2",
};

/* VITE_API_KEY missing OK - using hardcoded config. Add to .env if needed: VITE_API_KEY=your_key */
// if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("MISSING")) {
//
// }

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);
