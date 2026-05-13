import Login from "./components/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import Notification from "./components/Notification/notification";
import Groups from "./components/Groups/Groups";
import Meet from "./components/Meet/Meet";
import Cours from "./components/Cours/Cours";
import Cogi from "./components/Cogi/Cogi";
import AdminPanel from "./components/Admin/AdminPanel";

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
  const [showAdmin, setShowAdmin] = useState(false);

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
  if (demoMode) {
    return <DemoPage />;
  }

  // ── Compte banni ──────────────────────────────────────────────────────────
  if (currentUser?.banned) {
    return (
      <div className="loading-video-overlay" style={{ flexDirection: "column", gap: 24 }}>
        <div style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 16,
          padding: "40px 60px",
          textAlign: "center",
          maxWidth: 460,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#ef4444", fontFamily: "Poppins", marginBottom: 8 }}>Compte suspendu</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Votre compte a été suspendu par un administrateur. Contactez le support pour plus d'informations.</p>
          <button
            onClick={() => auth.signOut()}
            style={{
              marginTop: 24, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)",
              color: "#ef4444", padding: "10px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 600,
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="loading-video-overlay">
        <video
          src="/image/loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="loading-video"
        />
      </div>
    );

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      {currentUser ? (
        <>
          <Navbar
            setPage={changePage}
            active={active}
            onOpenAdmin={currentUser.role === "admin" ? () => setShowAdmin(true) : null}
          />

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

          {showAdmin && currentUser.role === "admin" && (
            <AdminPanel onClose={() => setShowAdmin(false)} />
          )}
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
