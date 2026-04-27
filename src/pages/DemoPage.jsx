/**
 * DemoPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de démonstration COGITO — accessible sans authentification Firebase.
 * Lance ChatDemo directement, simulant une conversation avec "COGITO Bot".
 *
 * Usage dans App.jsx :
 *   import DemoPage from "./pages/DemoPage";
 *   {page === "demo" && <DemoPage />}
 *
 * // @FIXME: Link to Firebase — remplacer DemoPage par ChatPage
 *            une fois la configuration Firebase active.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import ChatDemo from "../components/Chat/ChatDemo";

const DEMO_OTHER_USER = {
  id: "demo-user-2",
  username: "COGITO Bot",
  avatar: null,
};

const DemoPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: darkMode ? "#1a1a2e" : "#f0f2f5",
        transition: "background 0.3s",
      }}
    >
      {/* Barre de navigation minimale */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: darkMode ? "#16213e" : "#fff",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo_cogito.png"
            alt="COGITO"
            style={{ height: 32 }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              background: "linear-gradient(135deg, #C5A059, #a07830)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.5px",
            }}
          >
            COGITO — Démo
          </span>
        </div>

        <button
          onClick={() => setDarkMode((d) => !d)}
          style={{
            background: darkMode ? "#C5A059" : "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          {darkMode ? "☀️ Mode clair" : "🌙 Mode sombre"}
        </button>
      </div>

      {/* Zone chat pleine hauteur */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div
          style={{ flex: 1, maxWidth: 860, margin: "0 auto", width: "100%" }}
        >
          <ChatDemo
            user={DEMO_OTHER_USER}
            chatTitle="COGITO Bot"
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
