import "./Navbar.css";
import { useChatStore } from "../../lib/chatStore";

const Navbar = ({ setPage, active }) => {
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

      {/* RIGHT ICON */}
      <img
        src="/image/parametre.png"
        className="parametre"
        onClick={toggleSettings}
      />
    </div>
  );
};

export default Navbar;
