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
        <h2>{currentUser?.username || "Chargement..."}</h2>
      </div>
      <div className="icons">
        <span
          className="settings-shortcut"
          onClick={toggleSettings}
          title="Modifier le profil"
        >
          <Settings size={22} strokeWidth={2.2} color="#C5A059" />
        </span>
      </div>
    </div>
  );
};

export default Userinfo;
