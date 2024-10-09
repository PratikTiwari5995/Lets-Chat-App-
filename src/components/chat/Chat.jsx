import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from '../../lib/userStore';
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  
  useEffect(() => {
    if (!chatId) return; 
    const chatRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setChat(docSnapshot.data());
      } else {
        console.log("No chat data found.");
      }
    });

    return () => unsubscribe(); 
  }, [chatId]);

  
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

 
  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  
  const handleSend = async () => {
    if (text.trim() === "" && !img.file) return; 

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file); 
      }

      
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderID: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      
      const userIDs = [currentUser.id, user.id];

      for (let id of userIDs) {
        const userChatRef = doc(db, "userChats", id);
        const userChatSnapshot = await getDoc(userChatRef);

        if (userChatSnapshot.exists()) {
          const userChatData = userChatSnapshot.data();
          const chatIndex = userChatData.chats.findIndex(c => c.chatId === chatId);

          if (chatIndex !== -1) {
            userChatData.chats[chatIndex].lastMessage = text || "Sent an image";
            userChatData.chats[chatIndex].isSeen = id === currentUser.id;
            userChatData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatRef, {
              chats: userChatData.chats,
            });
          }
        }
      }

     
      setImg({ file: null, url: "" });
      setText("");
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
          <div className="texts">
            <span>{user?.username || "User"}</span>
            <p>Online</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Call" />
          <img src="./video.png" alt="Video" />
          <img src="./info.png" alt="Info" />
        </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div className={`message ${message.senderID === currentUser.id ? "own" : ""}`} key={index}>
            <div className="texts">
              {message.img && <img src={message.img} alt="Image message" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}

       
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Preview" />
            </div>
          </div>
        )}

        
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Attach" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="Camera" />
          <img src="./mic.png" alt="Mic" />
        </div>

        <input
          type="text"
          placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You cannot send message":"Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
         disabled={isCurrentUserBlocked || isReceiverBlocked}
        />

        <div className="emoji">
          <img src="./emoji.png" alt="Emoji" onClick={() => setOpen((prev) => !prev)} />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>

        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
