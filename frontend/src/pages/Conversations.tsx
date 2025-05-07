import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import SingleMessage from "../components/SingleMessage";
import { useNavigate, useParams } from "react-router-dom";
import SuccessComp from "../components/SuccessComp";
import ErrorComp from "../components/ErrorComp";
import type { Message, User } from "../types";

const Conversations: React.FC = () => {
  const messageRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentUser, token } = mainStore();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [displayUsers, setDisplayUsers] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { conversationId } = useParams<{ conversationId: string }>();
  const nav = useNavigate();

  // ------------------ SOCKET SETUP ------------------
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    newSocket.on("chatMessage", (raw: any) => {
      if (!raw || !raw.sender || typeof raw.sender === "string") return;

      const cleaned: Message = {
        _id: raw._id,
        message: raw.message,
        sender: {
          _id: raw.sender._id,
          username: raw.sender.username,
          image: raw.sender.image,
        },
        recipient: raw.recipient,
        timestamp: raw.timestamp,
        liked: raw.liked ?? [],
      };

      setMessages((prev) => [...prev, cleaned]);
    });

    newSocket.on("likeMessage", (messages: Message[]) => {
      setMessages(messages);
    });

    newSocket.on("messageReceived", fetchNonParticipants);

    return () => {
      newSocket.close();
    };
  }, []);

  // ------------------ FETCH CONVERSATION ------------------
  useEffect(() => {
    const fetchConversation = async () => {
      setMessages([]);

      try {
        const res = await http.get(`/conversation/${conversationId}`);

        if (!res || res.error || !res.data || !res.data.participants) {
          console.error("❌ Invalid response structure:", res);
          setError("Conversation data is invalid or missing.");
          return;
        }

        const { participants: fetchedParticipants, messages } = res.data;
        setMessages(messages);
        setParticipants(fetchedParticipants);

        const localUser = mainStore.getState().currentUser;
        const other = fetchedParticipants.find((p: User) => p.username !== localUser?.username);
        setSelectedUser(other ?? null);
      } catch (err) {
        console.error("Failed to fetch conversation:", err);
        setError("Failed to fetch conversation");
      }
    };

    fetchConversation();
  }, [conversationId]);

  // ------------------ FETCH NON-PARTICIPANTS ------------------
  const fetchNonParticipants = async () => {
    try {
      const res = await http.get(`/conversation/${conversationId}/non-participants`);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching non-participants:", error);
    }
  };

  useEffect(() => {
    fetchNonParticipants();
  }, [conversationId]);

  // ------------------ SCROLL ------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      setShowButton(scrollTop > 100);
    }
  };

  // ------------------ SEND MESSAGE ------------------
  const sendMessage = async () => {
    if (!currentUser || !selectedUser || !messageRef.current) return;

    const content = messageRef.current.value.trim();
    if (content.length < 1 || content.length > 200) return;

    const message = {
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        image: currentUser.image ?? "",
      },
      recipient: selectedUser.username, // still a string unless you're populating
      message: content,
      timestamp: new Date().toISOString(),
      liked: [],
    };

    try {
      const res = await http.postAuth("/send-message", message, token);
      if (!res.error) {
        socket?.emit("chatMessage", res.data);
        messageRef.current.value = "";
      } else {
        setErrorMsg(res.message ?? "Message send failed.");
      }
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  // ------------------ LIKE MESSAGE ------------------
  const handleLikeMessage = async (messageId: string) => {
    if (!currentUser || !selectedUser) return;
    try {
      const res = await http.postAuth(
        "/like-message-private",
        {
          messageId,
          username: currentUser.username,
          recipient: selectedUser,
          sender: currentUser,
        },
        token
      );
      if (!res.error) socket?.emit("likeMessage", res.data);
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  // ------------------ LOAD EARLIER ------------------
  const handleLoadEarlier = async () => {
    if (!currentUser || !selectedUser) return;
    try {
      const res = await http.get(`/get-earlier-messages/${currentUser.username}/${selectedUser.username}`);
      if (!res.error) {
        const cleanedMessages: Message[] = res.data.map((msg: any) => ({
          _id: msg._id,
          message: msg.message,
          sender:
            typeof msg.sender === "string"
              ? { _id: msg.sender, username: "Unknown" }
              : {
                  _id: msg.sender._id,
                  username: msg.sender.username,
                  image: msg.sender.image,
                },
          recipient: msg.recipient,
          timestamp: msg.timestamp,
          liked: msg.liked ?? [],
        }));

        setMessages((prev) => [...cleanedMessages, ...prev]);
      }
    } catch (error) {
      console.error("Error loading earlier messages:", error);
    }
  };

  // ------------------ ADD USER ------------------
  const addUser = async (username: string) => {
    try {
      const res = await http.postAuth(`/conversation/${conversationId}/${username}`, { user: { username } }, token);
      if (!res.error) {
        setDisplayUsers(false);
        setSuccessMsg(res.message ?? null);
        const newUser: User = {
          _id: res.data.user._id, // or whatever your backend returns
          username: res.data.user.username,
          image: res.data.user.image ?? "", // fallback in case it's missing
        };
        setParticipants((prev) => (prev ? [...prev, newUser] : [newUser]));
        socket?.emit("userAdded");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message ?? null);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  // ------------------ RENDER ------------------
  return (
    <div className="flex flex-col bg-gradient-to-r from-indigo-500 to-violet-400 p-16">
      <div className="flex gap-3">
        {currentUser ? (
          <div className="w-full flex gap-3">
            <div className="flex flex-col w-full bg-white rounded-3xl">
              <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-xl">
                {selectedUser && <img className="w-14 h-14 rounded-full" src={selectedUser.image} alt="" />}
                <div className="flex justify-between w-full">
                  <p className="text-gray-500 font-semibold">
                    Chat with:{" "}
                    {(participants ?? [])
                      .filter((p) => p.username !== currentUser.username)
                      .map((p) => p.username)
                      .join(", ") || "(no one yet)"}
                  </p>
                  <svg
                    onClick={() => setDisplayUsers(!displayUsers)}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6 text-gray-400 me-5 hover:text-gray-500 cursor-pointer"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </div>

              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex flex-col min-h-[620px] max-h-[620px] p-3 overflow-auto"
              >
                {messages.map((msg, i) => (
                  <SingleMessage
                    key={i}
                    message={msg}
                    participants={participants ?? []}
                    handleLikeMessage={handleLikeMessage}
                  />
                ))}
                {successMsg && <SuccessComp msg={successMsg} />}
                {errorMsg && <ErrorComp error={errorMsg} />}
                <div ref={messagesEndRef} />
              </div>

              {showButton && (
                <button
                  onClick={handleLoadEarlier}
                  className="absolute hidden bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white p-2 rounded"
                >
                  Load Earlier
                </button>
              )}

              {selectedUser && (
                <div className="flex p-3 bg-gray-100 rounded-xl">
                  <input
                    ref={messageRef}
                    type="text"
                    placeholder="Type your message"
                    className="bg-gray-50 w-full border border-gray-300 text-sm rounded-lg p-2.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button onClick={sendMessage}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6 text-gray-500 hover:text-gray-700"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12 3.269 3.125A59.768 59.768 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {displayUsers && (
              <div className="bg-white rounded-3xl w-[300px] overflow-hidden flex flex-col justify-between">
                <div className="bg-gray-100 p-6">
                  <p className="text-gray-700 font-semibold">Add Users to the chat</p>
                </div>
                <div className="flex flex-col h-full gap-3 overflow-auto">
                  {users?.map((x, i) => (
                    <div key={i} className="w-full text-lg text-start flex flex-col items-center">
                      <div className="flex w-full justify-between py-2 ps-4 items-center">
                        <div>{x.username}</div>
                        <svg
                          onClick={() => addUser(x.username)}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-5 text-gray-400 me-5 hover:text-gray-500 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                      <div className="bg-gray-200 w-full h-[1px]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[600px] bg-white rounded-2xl p-3 w-full flex flex-col justify-end items-center">
            <p className="font-semibold text-gray-600">Please Log In to send a message</p>
            <button
              onClick={() => nav("/login")}
              className="text-white w-[300px] mt-5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm px-5 py-2.5 text-center"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
