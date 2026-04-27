import "./AddUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState, useRef } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { resolveAvatar } from "../../../../lib/media";
import { toast } from "react-toastify";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    if (!username) return;

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    try {
      const userRef = collection(db, "users");

      const q = query(userRef, where("username", "==", username));

      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const userDoc = querySnapShot.docs[0];
        setUser({ ...userDoc.data(), id: userDoc.id });
      } else {
        toast.error("Utilisateur non trouvé");
      }
    } catch (err) {
      toast.error("Erreur de recherche");
    }
  };

  const handleAdd = async () => {
    if (!user?.id || !currentUser?.id) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userschats");

    try {
      const newChatRef = doc(chatRef);
      const otherUserId = user.id;
      const currentUserId = currentUser.id;

      // Create the new chat
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Check and create/update current user's userschats
      const myChatsRef = doc(userChatsRef, currentUserId);
      const myChatsSnap = await getDoc(myChatsRef);

      if (myChatsSnap.exists()) {
        await updateDoc(myChatsRef, {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: otherUserId,
            updatedAt: Date.now(),
          }),
        });
      } else {
        await setDoc(myChatsRef, {
          chats: [
            {
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: otherUserId,
              updatedAt: Date.now(),
            },
          ],
        });
      }

      // Check and create/update other user's userschats
      const otherChatsRef = doc(userChatsRef, otherUserId);
      const otherChatsSnap = await getDoc(otherChatsRef);

      if (otherChatsSnap.exists()) {
        await updateDoc(otherChatsRef, {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: currentUserId,
            updatedAt: Date.now(),
          }),
        });
      } else {
        await setDoc(otherChatsRef, {
          chats: [
            {
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: currentUserId,
              updatedAt: Date.now(),
            },
          ],
        });
      }

      toast.success("Utilisateur ajouté!");
      setUser(null);
    } catch (err) {
      toast.error("Erreur lors de l'ajout: " + err.message);
    }
  };

  return (
    <div className="AddUser">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Username"
          name="username"
          ref={inputRef}
        />
        <button type="submit">Rechercher</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={resolveAvatar(user.avatar)} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Ajouter</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
