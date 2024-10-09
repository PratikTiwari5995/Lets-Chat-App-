import { useEffect, useState } from "react";
import AddUser from "./addUser/Adduser";
import "./chatList.css";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [addMode, setAddMode] = useState(false);
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      console.log("No current user found");
      return;
    }

   
    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const data = res.data();
      console.log("userchats data:", data);

      if (!data || !data.chats) {
        console.log("No chat data found");
        return;
      }

     
      const items = data.chats || [];
      const promise = items.map(async (item) => {
        try {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocsnap = await getDoc(userDocRef);

          const user = userDocsnap.exists()
            ? userDocsnap.data()
            : { username: "Unknown User", avatar: "./avatar.png" };

          return { ...item, user };
        } catch (err) {
          console.log("Error fetching user data:", err instanceof Error ? err.message : err);
          return { ...item, user: { username: "Unknown User", avatar: "./avatar.png" } };
        }
      });

      try {
        const chatData = await Promise.all(promise);

        // Sort chats by `updatedAt` to show the latest chat first
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (err) {
        console.log("Error processing chats:", err instanceof Error ? err.message : err);
      }
    });

    return () => {
      unSub();
    };
  }, [currentUser]);

  // Handle chat selection and mark as seen
  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    if (chatIndex !== -1) {
      userChats[chatIndex].isSeen = true;

      const userChatRef = doc(db, "userchats", currentUser.id);

      try {
        await updateDoc(userChatRef, {
          chats: userChats,
        });

        // Change the active chat in the store
        changeChat(chat.chatId, chat.user);
      } catch (error) {
        console.log("Error updating chat:", error);
      }
    }
  };

  // Filter chats based on search input
  const filteredChats = chats.filter((chat) =>
    chat.user?.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatlist">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      
      {filteredChats.length > 0 ? (
        filteredChats.map((chat) => (
          <div
            className="item"
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
            style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
          >
           
            <img
              src={chat.user?.blocked?.includes(currentUser.id) ? "./avatar.png" : chat.user?.avatar || "./avatar.png"}
              alt=""
            />
            <div className="texts">
              {/* Handle blocked users and display username */}
              <span>
                {chat.user?.blocked?.includes(currentUser.id)
                  ? "Blocked User"
                  : chat.user?.username || "Unknown User"}
              </span>
              <p>{chat.lastMessage}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="no-chats">No chats available</div>
      )}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
