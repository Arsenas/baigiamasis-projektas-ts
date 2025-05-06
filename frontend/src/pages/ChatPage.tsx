import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import SingleMessage from "../components/SingleMessage";
import { useNavigate } from "react-router-dom";
import type { Message, User } from "../types";

const ChatPage: React.FC = () => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sender, setSender] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showButton, setShowButton] = useState(false);
  const { currentUser, token } = mainStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    newSocket.on("privateMessage", (message: Message) => {
      setMessages((prevMessages) => (prevMessages ? [...prevMessages, message] : [message]));
    });

    newSocket.on("likeMessage", () => {
      fetchPublicRoomMessages();
    });

    newSocket.on("disconnect", () => {
      if (currentUser) {
        console.log(`${currentUser?.username} has left the chat`);
      }
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

  const handleLikeMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
      const res = await http.postAuth(
        "/like-message",
        {
          messageId,
          username: currentUser.username,
          recipient: selectedUser,
          sender: currentUser,
        },
        token
      );

      if (!res.error) {
        socket?.emit("likeMessage", res.data);
      }
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  const fetchPublicRoomMessages = async () => {
    try {
      const res = await http.get("/get-public-room-messages");
      if (!res.error) {
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
    if (!currentUser) return;
    const timestamp = Math.floor(Date.now() / 1000);

    if (!messageRef.current || messageRef.current.value.length < 1 || messageRef.current.value.length > 200) {
      return setError("Message should be longer than 1 symbol and shorter than 200.");
    }

    const convertTimestamp = (ts: number): string => {
      const date = new Date(ts * 1000);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(
        2,
        "0"
      )} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    };

    const formattedTimestamp = convertTimestamp(timestamp);

    const data: Message = {
      sender: currentUser.username,
      recipient: selectedUser ? selectedUser.username : "public-room",
      message: messageRef.current.value,
      timestamp: formattedTimestamp,
      senderImage: currentUser.image,
      recipientImage: selectedUser ? selectedUser.image : "public-room",
    };

    const res = await http.postAuth("/send-message", data, token);

    if (!res.error) {
      socket?.emit("privateChatMessage", {
        ...data,
        _id: res.data._id,
      });
      messageRef.current.value = "";
    } else {
      console.log(res.message);
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      setShowButton(scrollTop > 100);
    }
  };

  const handleLoadEarlier = async () => {
    if (!currentUser || !selectedUser) return;
    if (selectedUser) {
      try {
        const res = await http.get(`/get-earlier-messages/${currentUser.username}/${selectedUser.username}`);
        if (!res.error) {
          setMessages((prev) => [...res.data, ...prev]);
        } else {
          console.error(res.message);
        }
      } catch (error) {
        console.error("Failed to fetch earlier messages:", error);
      }
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-r from-indigo-500 to-violet-400 p-16">
      <div className="flex">
        <div className="flex flex-col w-full bg-white rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 bg-gray-100 p-4">
            <div className="flex flex-col">
              <p className="text-gray-500 font-semibold">Chat Room</p>
            </div>
          </div>

          {currentUser ? (
            <div>
              <div
                ref={containerRef}
                className="flex flex-col min-h-[620px] max-h-[620px] p-3 overflow-auto"
                onScroll={handleScroll}
              >
                {messages.map((message, i) => (
                  <SingleMessage
                    key={i}
                    message={message}
                    participants={participants ?? []}
                    handleLikeMessage={handleLikeMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {showButton && (
                <button
                  onClick={handleLoadEarlier}
                  className="absolute hidden bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white p-2 rounded"
                >
                  Load earlier
                </button>
              )}

              <div className="flex p-3 bg-gray-100 rounded-xl">
                <div className="w-full flex gap-2 items-center text-gray-500">
                  <input
                    ref={messageRef}
                    type="text"
                    placeholder="Type your message"
                    className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
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
            </div>
          ) : (
            <div className="h-[600px] bg-white p-3 w-full flex flex-col justify-end items-center">
              <p className="font-semibold text-gray-600">Please Log In to send a message</p>
              <button
                type="button"
                onClick={() => nav("/login")}
                className="text-white w-[300px] mt-5 bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-orange-300 font-medium rounded-full text-sm px-5 py-2.5"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
