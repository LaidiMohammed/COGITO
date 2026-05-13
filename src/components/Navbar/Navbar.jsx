import "./Navbar.css";
import { useChatStore } from "../../lib/chatStore";

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Navbar = ({ setPage, active, onOpenAdmin }) => {
  const { toggleSettings } = useChatStore();

  return (
    <div className="navbar">
      {/* LEFT LOGO */}
      <div className="nav-left">
        <video
          src="/image/logo.mp4"
          className="logo"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      {/* CENTER MENU */}
      <ul className="nav-menu">
        <li
          className={active === "chat" ? "active" : ""}
          onClick={() => setPage("chat")}
        >
          Chat
        </li>
        <li
          className={active === "groups" ? "active" : ""}
          onClick={() => setPage("groups")}
        >
          Groups
        </li>
        <li
          className={active === "meet" ? "active" : ""}
          onClick={() => setPage("meet")}
        >
          Meet
        </li>
        <li
          className={active === "cours" ? "active" : ""}
          onClick={() => setPage("cours")}
        >
          Cours
        </li>
        <li
          className={active === "cogi" ? "active" : ""}
          onClick={() => setPage("cogi")}
        >
          Cogi IA
        </li>
      </ul>

      {/* RIGHT ICONS */}
      <div className="nav-right">
        {onOpenAdmin && (
          <button
            className="nav-admin-btn"
            onClick={onOpenAdmin}
            title="Panneau Administrateur"
          >
            <ShieldIcon />
            <span>Admin</span>
          </button>
        )}
        <img
          src="/image/parametre.png"
          className="parametre"
          onClick={toggleSettings}
          title="Paramètres"
        />
      </div>
    </div>
  );
};

export default Navbar;
