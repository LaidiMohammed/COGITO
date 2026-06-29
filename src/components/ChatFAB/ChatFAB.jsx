import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { MessageCircle } from "lucide-react";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./ChatFAB.css";

const ChatFAB = ({ currentPage, setPage }) => {
  const { currentUser } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;

    const unSub = onSnapshot(doc(db, "userschats", currentUser.id), (res) => {
      const chats = res.data()?.chats || [];
      // Count how many chats have !isSeen
      const unread = chats.filter((c) => !c.isSeen).length;
      setUnreadCount(unread);
    });

    return () => unSub();
  }, [currentUser?.id]);

  // Hide the FAB if we are already on the Chat page or not logged in
  if (currentPage === "chat" || !currentUser) return null;

  return (
    <button className="chat-fab" onClick={() => setPage("chat")} title="Ouvrir le Chat">
      <MessageCircle size={28} color="#fff" />
      {unreadCount > 0 && (
        <span className="chat-fab-badge">{unreadCount}</span>
      )}
    </button>
  );
};

export default ChatFAB;
