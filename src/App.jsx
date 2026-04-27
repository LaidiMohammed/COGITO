import Login from "./components/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import Notification from "./components/Notification/notification";
import Groups from "./components/Groups/Groups";
import Meet from "./components/Meet/Meet";
import Cours from "./components/Cours/Cours";
import Cogi from "./components/Cogi/Cogi";

import ChatPage from "./pages/ChatPage";
import DemoPage from "./pages/DemoPage";
import Settings from "./components/Settings/Settings";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useEffect, useState } from "react";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

// ─── MODE DÉMO ─────────────────────────────────────────────────────────────
// Accès : ajoutez #demo à l'URL (ex: http://localhost:5173/#demo)
// // @FIXME: Link to Firebase — retirer ce bloc une fois l'auth Firebase active.
const isDemoMode = () =>
  typeof window !== "undefined" && window.location.hash === "#demo";
// ───────────────────────────────────────────────────────────────────────────

const App = () => {
  const { currentUser, isLoading, fetchUserInfo, setUser } = useUserStore();
  const { darkMode, toggleDarkMode, showSettings, toggleSettings } =
    useChatStore();

  const [page, setPage] = useState("chat");
  const [active, setActive] = useState("chat");

  // Écouter le changement de hash (navigation vers/depuis #demo)
  const [demoMode, setDemoMode] = useState(isDemoMode());

  useEffect(() => {
    const onHash = () => setDemoMode(isDemoMode());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const changePage = (p) => {
    setPage(p);
    setActive(p);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  // ── Mode démo : affichage direct sans auth ──────────────────────────────
  // @FIXME: Link to Firebase — supprimer ce bloc pour désactiver le mode démo.
  if (demoMode) {
    return <DemoPage />;
  }

  if (isLoading)
    return (
      <div className="loading">
        Loading auth…{" "}
        <a
          href="#demo"
          style={{
            display: "block",
            marginTop: 16,
            fontSize: 14,
            color: "#C5A059",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          ▶ Voir la démo sans connexion
        </a>
      </div>
    );

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      {currentUser ? (
        <>
          <Navbar setPage={changePage} active={active} />

          {page === "chat" && <ChatPage setPage={changePage} />}
          {page === "groups" && <Groups setPage={changePage} />}
          {page === "meet" && <Meet />}
          {page === "cours" && <Cours />}
          {page === "cogi" && <Cogi />}

          <Settings
            isOpen={showSettings}
            onClose={toggleSettings}
            theme={darkMode ? "dark" : "light"}
            setTheme={toggleDarkMode}
            user={currentUser}
            setUser={setUser}
            onLogout={handleLogout}
          />
        </>
      ) : (
        <>
          <Login />
          {/* Lien mode démo depuis l'écran de connexion */}
          <a
            href="#demo"
            style={{
              position: "fixed",
              bottom: 16,
              right: 16,
              background: "linear-gradient(135deg, #C5A059, #a07830)",
              color: "#fff",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              zIndex: 9999,
            }}
          >
            ▶ Mode Démo
          </a>
        </>
      )}

      <Notification />
    </div>
  );
};

export default App;
