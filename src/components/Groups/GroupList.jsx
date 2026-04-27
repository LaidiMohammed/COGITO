import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Users } from "lucide-react";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { getAvatarInitial, hasMediaAvatar } from "../../lib/media";
import "./GroupList.css";

const GroupList = ({ search = "" }) => {
  const { currentUser } = useUserStore();
  const { changeGroup, chatId, isGroupChat } = useChatStore();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const groupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", currentUser.id),
    );

    const unSub = onSnapshot(groupsQuery, (snap) => {
      const items = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setGroups(items);
    });

    return () => unSub();
  }, [currentUser?.id]);

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const sorted = [...groups].sort((a, b) => {
      const aTs = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTs = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTs - aTs;
    });

    if (!needle) return sorted;
    return sorted.filter((group) =>
      (group.groupName || "").toLowerCase().includes(needle),
    );
  }, [groups, search]);

  if (filteredGroups.length === 0) {
    return (
      <div className="group-list-empty">
        <Users size={20} />
        <span>No groups found</span>
      </div>
    );
  }

  return filteredGroups.map((group) => {
    const isActive = isGroupChat && chatId === group.id;

    return (
      <div
        key={group.id}
        className={`Item group-item${isActive ? " active" : ""}`}
        onClick={() =>
          changeGroup(
            group.id,
            group.groupName || "Group",
            group.groupImg || "",
            group.members?.length || 0,
          )
        }
      >
        <div className="avatar-wrapper">
          {hasMediaAvatar(group.groupImg) ? (
            <img src={group.groupImg} alt={group.groupName || "Group"} />
          ) : (
            <div className="group-avatar-fallback">
              {getAvatarInitial(group.groupName, "G")}
            </div>
          )}
        </div>

        <div className="texts">
          <div className="texts-top">
            <span>{group.groupName || "Group"}</span>
          </div>
          <p>{group.lastMessage || `${group.members?.length || 0} members`}</p>
        </div>
      </div>
    );
  });
};

export default GroupList;
