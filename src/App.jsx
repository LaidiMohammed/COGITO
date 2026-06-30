import Login from "./components/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import Notification from "./components/Notification/notification";
import Welcome from "./components/Welcome/Welcome";
import Groups from "./components/Groups/Groups";
import Meet from "./components/Meet/Meet";
import Cours from "./components/Cours/Cours";
import Cogi from "./components/Cogi/Cogi";
import AdminPanel from "./components/Admin/AdminPanel";
import ChatPage from "./pages/ChatPage";
import Settings from "./components/Settings/Settings";
import ChatFAB from "./components/ChatFAB/ChatFAB";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useEffect, useState } from "react";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { Ban } from "lucide-react";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo, setUser } = useUserStore();
  const { darkMode, toggleDarkMode, showSettings, toggleSettings } = useChatStore();

  const [page, setPage] = useState("home");
  const [active, setActive] = useState("home");
  const [showAdmin, setShowAdmin] = useState(false);

  const changePage = (p) => { setPage(p); setActive(p); };
  const handleLogout = () => { auth.signOut(); };

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unSub();
  }, [fetchUserInfo]);

  if (currentUser?.banned) {
    return (
      <div className="loading-video-overlay" style={{ flexDirection: "column", gap: 24 }}>
        <div style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 16, padding: "40px 60px", textAlign: "center", maxWidth: 460,
        }}>
          <Ban size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
          <h2 style={{ color: "#ef4444", fontFamily: "Poppins", marginBottom: 8 }}>Compte suspendu</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Votre compte a été suspendu par un administrateur. Contactez le support.
          </p>
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

  if (isLoading) {
    return (
      <div className="loading-video-overlay">
        <video src={`${import.meta.env.BASE_URL}image/loading.mp4`} autoPlay loop muted playsInline className="loading-video" />
      </div>
    );
  }

  return (
    <>
      <div className={`container ${darkMode ? "dark" : ""}`}>
        {currentUser ? (
          <>
            <Navbar
              setPage={changePage}
              active={active}
              onOpenAdmin={currentUser.role === "admin" ? () => setShowAdmin(true) : null}
            />
            <div className="page-transition" key={page}>
              {page === "home" && <Welcome setPage={changePage} />}
              {page === "chat" && <ChatPage setPage={changePage} />}
              {page === "groups" && <Groups setPage={changePage} />}
              {page === "meet" && <Meet />}
              {page === "cours" && <Cours />}
              {page === "cogi" && <Cogi />}
              {page === "jobs" && <div className="page-placeholder"><h2>Jobs Étudiants</h2><p>Page à venir...</p></div>}
              {page === "about" && <div className="page-placeholder"><h2>About Us</h2><p>Page à venir...</p></div>}
            </div>

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
          <Login />
        )}
        <ChatFAB currentPage={page} setPage={changePage} />
        <Notification />
      </div>
    </>
  );
};

export default App;
