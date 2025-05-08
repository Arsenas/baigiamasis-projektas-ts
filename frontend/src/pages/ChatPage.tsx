import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import SingleMessage from "../components/SingleMessage";
import { useNavigate } from "react-router-dom";
import type { Message, User } from "../types";
import { useLanguage } from "../context/LanguageContext";

const ChatPage: React.FC = () => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const { messages, setMessages, removeMessage, currentUser, token } = mainStore();
  const [error, setError] = useState<string | null>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const [showButton, setShowButton] = useState(false);
  const { lang } = useLanguage();

  // Create socket connection and listen for real-time events
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    // Listen for new public messages
    newSocket.on("publicMessage", (raw: any) => {
      if (!raw || typeof raw.sender === "string") return;
      const cleaned: Message = {
        _id: raw._id,
        message: raw.message,
        sender: {
          _id: raw.sender._id,
          username: raw.sender.username,
          image: raw.sender.image,
          role: raw.sender.role ?? "user",
        },
        recipient: "public-room",
        timestamp: raw.timestamp,
        liked: raw.liked ?? [],
      };
      setMessages((prev: Message[]) => [...(prev ?? []), cleaned]);
    });

    // Handle likes for messages
    newSocket.on("likeMessage", (updatedMessage: Message) => {
      setMessages((prev) => prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg)));
    });

    // Handle message deletion (Unsend for me)
    newSocket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
      removeMessage(messageId); // Remove message from state and re-render
    });

    // Handle permanent message deletion (Unsend for everyone)
    newSocket.on("messagePermanentlyDeleted", ({ messageId }: { messageId: string }) => {
      removeMessage(messageId); // Remove message from state and re-render immediately
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchPublicRoomMessages = async () => {
    try {
      const res = await http.get("/get-public-room-messages", token);
      if (!res.error && Array.isArray(res.data)) {
        setMessages(res.data);
      } else {
        console.error("Failed to fetch public room messages:", res.message);
      }
    } catch (error) {
      console.error("Error fetching public room messages:", error);
    }
  };

  useEffect(() => {
    fetchPublicRoomMessages();
  }, []);

  const sendMessage = async () => {
    if (!currentUser || !messageRef.current) return;

    const value = messageRef.current.value.trim();
    if (value.length < 1 || value.length > 200) {
      return setError("Message should be between 1 and 200 characters.");
    }

    const data: Message = {
      _id: "", // server will generate this
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        image: currentUser.image ?? "",
        role: currentUser.role ?? "user",
      },
      recipient: "public-room",
      message: value,
      timestamp: new Date().toISOString(),
      liked: [],
    };

    try {
      const res = await http.postAuth("/send-public-message", data, token);
      if (!res.error && res.data) {
        socket?.emit("publicMessage", res.data);
        messageRef.current.value = "";
      } else {
        console.log(res.message);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
      const res = await http.postAuth(
        "/like-message",
        {
          messageId,
          username: currentUser.username,
        },
        token
      );

      if (!res.error && res.data) {
        setMessages((prev: Message[]) => prev.map((msg: Message) => (msg._id === res.data._id ? res.data : msg)));
        socket?.emit("likeMessage", res.data);
      }
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await http.postAuth(`/delete-message/${messageId}`, {}, token);
      setMessages((prev: Message[]) => prev.filter((msg: Message) => msg._id !== messageId));
      socket?.emit("messageDeleted", { messageId });
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      setShowButton(scrollTop > 100);
    }
  };

  return (
    <div className="w-full flex justify-center px-[10px] sm:px-[20px] pt-[70px]">
      <div className="w-full max-w-[1400px] bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-semibold text-gray-700">
            {lang === "lt" ? "Viešas pokalbių kambarys" : "Chat Room"}
          </p>
        </div>

        {currentUser ? (
          <>
            <div
              ref={containerRef}
              className="flex flex-col min-h-[300px] max-h-[500px] p-3 overflow-auto bg-gray-50 rounded-xl"
              onScroll={handleScroll}
            >
              {messages.map((message, i) => (
                <SingleMessage
                  key={i}
                  message={message}
                  handleLikeMessage={handleLikeMessage}
                  handleDeleteMessage={handleDeleteMessage}
                  socket={socket}
                  removeMessage={removeMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex p-3 mt-4 bg-white/60 backdrop-blur-md border border-white/30 rounded-xl">
              <div className="w-full flex gap-2 items-center text-gray-500">
                <input
                  ref={messageRef}
                  type="text"
                  placeholder={lang === "lt" ? "Rašykite žinutę" : "Type your message"}
                  className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <svg
                  onClick={sendMessage}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6 cursor-pointer hover:text-gray-800"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[600px] bg-white p-3 w-full flex flex-col justify-end items-center">
            <p className="font-semibold text-gray-600">
              {lang === "lt" ? "Prisijunkite, kad galėtumėte rašyti žinutes" : "Please Log In to send a message"}
            </p>
            <button
              onClick={() => nav("/login")}
              className="text-white w-[300px] mt-5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm px-5 py-2.5"
            >
              {lang === "lt" ? "Prisijungti" : "Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
