import "./Welcome.css";
import { ChatIcon } from "../icons/ChatIcon";
import { GroupsIcon } from "../icons/GroupsIcon";
import { MeetIcon } from "../icons/MeetIcon";
import { CoursIcon } from "../icons/CoursIcon";
import { CogiIcon } from "../icons/CogiIcon";

const Welcome = ({ setPage }) => {
  return (
    <div className="Welcome">
      <div className="welcome-content">
        <img src="/image/logo.png" alt="Cogito" className="welcome-logo" />
        <h1 className="welcome-title">Welcome to Cogito</h1>
        <p className="welcome-subtitle">
          Your complete platform for collaboration, learning, and communication
        </p>

        <ul className="welcome-nav">
          <li onClick={() => setPage("chat")}>
            <ChatIcon /> Chat
          </li>
          <li onClick={() => setPage("groups")}>
            <GroupsIcon /> Groups
          </li>
          <li onClick={() => setPage("meet")}>
            <MeetIcon /> Meet
          </li>
          <li onClick={() => setPage("cours")}>
            <CoursIcon /> Cours
          </li>
          <li onClick={() => setPage("cogi")}>
            <CogiIcon /> Cogi IA
          </li>
        </ul>

        <p className="welcome-note">
          🔒 End-to-end encrypted - Your conversations are private and secure
        </p>
      </div>
    </div>
  );
};

export default Welcome;
