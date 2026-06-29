import "./Userinfo.css";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { resolveAvatar } from "../../../lib/media";
import { Settings } from "lucide-react";

const Userinfo = () => {
  const { currentUser } = useUserStore();
  const { toggleSettings } = useChatStore();

  return (
    <div className="Userinfo">
      <div className="user">
        <img src={resolveAvatar(currentUser?.avatar)} alt="" />
        <div className="user-info">
          <h2>{currentUser?.username || "Chargement..."}</h2>
          <span className={`user-plan ${currentUser?.plan === "pro" ? "user-plan--pro" : ""}`}>
            {currentUser?.plan === "pro" ? "Pro" : "Gratuit"}
          </span>
        </div>
      </div>
      <div className="icons">
        <span className="settings-shortcut" onClick={toggleSettings} title="Modifier le profil">
          <Settings size={20} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
};

export default Userinfo;