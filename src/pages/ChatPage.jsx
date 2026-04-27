import Liste from "../components/Liste/Liste";
import Chat from "../components/Chat/Chat";
import Details from "../components/Details/Details";
import Welcome from "../components/Welcome/Welcome";
import Settings from "../components/Settings/Settings";
import GroupChatWindow from "../components/Groups/GroupChatWindow";
import "./ChatPage.css";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import { auth } from "../lib/firebase";

const ChatPage = ({ setPage }) => {
  const {
    chatId,
    isGroupChat,
    showDetails,
    showSettings,
    toggleSettings,
    darkMode,
    toggleDarkMode,
  } = useChatStore();
  const { currentUser, setUser } = useUserStore();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="chatPage">
      <Liste />
      {!chatId && <Welcome setPage={setPage} />}
      {chatId && (isGroupChat ? <GroupChatWindow /> : <Chat />)}
      {chatId && showDetails && <Details />}

      <Settings
        isOpen={showSettings}
        onClose={toggleSettings}
        theme={darkMode ? "dark" : "light"}
        setTheme={toggleDarkMode}
        user={currentUser}
        setUser={setUser}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default ChatPage;
