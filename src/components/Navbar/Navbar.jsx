import "./Navbar.css";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { MessageCircle, Users, Video, BookOpen, Bot, Briefcase, Settings, ShieldCheck, Crown } from "lucide-react";

const NAV_ITEMS = [
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "groups", icon: Users, label: "Groups" },
  { key: "meet", icon: Video, label: "Meet" },
  { key: "cours", icon: BookOpen, label: "Cours" },
  { key: "cogi", icon: Bot, label: "Cogi IA" },
  { key: "jobs", icon: Briefcase, label: "Job Étudiant" },
];

const Navbar = ({ setPage, active, onOpenAdmin }) => {
  const { toggleSettings } = useChatStore();
  const { currentUser } = useUserStore();

  return (
    <div className="navbar">
      <div className="nav-left">
        <img src={`${import.meta.env.BASE_URL}image/logo.png`} alt="Cogito" className="logo" onClick={() => setPage("home")} />
      </div>

      <ul className="nav-menu">
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
          <li key={key} className={active === key ? "active" : ""} onClick={() => setPage(key)}>
            <Icon size={20} />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <div className="nav-right">
        {currentUser?.role === "pro" && <Crown size={16} className="nav-pro-icon" title="Compte Pro" />}
        {onOpenAdmin && (
          <button className="nav-admin-btn" onClick={onOpenAdmin} title="Administrateur">
            <ShieldCheck size={18} />
          </button>
        )}
        <button className="nav-settings-btn" onClick={toggleSettings} title="Paramètres">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;