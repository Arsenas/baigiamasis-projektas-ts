import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import SingleMessage from "../components/SingleMessage";
import SuccessComp from "../components/SuccessComp";
import ErrorComp from "../components/ErrorComp";
import type { Message, User, Conversation } from "../types";
import { useLanguage } from "../context/LanguageContext";

const Conversations: React.FC = () => {
  const messageRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { removeMessage } = mainStore();
  const { currentUser, token } = mainStore();
  const [socket, setSocket] = useState<typeof Socket | null>(null); // Corrected: Socket Type
  const [users, setUsers] = useState<User[] | null>(null);
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [displayUsers, setDisplayUsers] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [error, setError] = useState<string | null>(null); // Corrected: setError
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const { conversationId } = useParams<{ conversationId: string }>();
  const nav = useNavigate();
  const { lang } = useLanguage();

  // ------------------ SOCKET SETUP ------------------
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    console.log("Socket connection established", newSocket);

    // Listen for new chat messages
    newSocket.on("chatMessage", (raw: any) => {
      console.log("Received chat message:", raw);
      if (!raw || !raw.sender || typeof raw.sender === "string") return;

      const cleaned: Message = {
        _id: raw._id,
        message: raw.message,
        sender: {
          _id: raw.sender._id,
          username: raw.sender.username,
          image: raw.sender.image,
          role: raw.sender.role ?? "user",
        },
        recipient: raw.recipient,
        timestamp: raw.timestamp,
        liked: raw.liked ?? [],
      };

      console.log("Cleaned message:", cleaned);

      setMessages((prev) => [...prev, cleaned]);
    });

    newSocket.on("likeMessage", (incoming: any) => {
      console.log("Received likeMessage event:", incoming);

      if (!incoming || !incoming._id) return;

      const updated: Message = {
        _id: incoming._id,
        message: incoming.message,
        timestamp: incoming.timestamp,
        liked: incoming.liked ?? [],
        recipient: incoming.recipient,
        sender: {
          _id: incoming.sender._id,
          username: incoming.sender.username,
          image: incoming.sender.image,
          role: incoming.sender.role ?? "user",
        },
      };

      setMessages((prev) => prev.map((msg) => (msg._id === updated._id ? updated : msg)));
    });

    // Handle message deletion (unsend for everyone)
    newSocket.on("messagePermanentlyDeleted", ({ messageId }: { messageId: string }) => {
      console.log("Received socket event for message deletion:", messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    // Listen for message deletion (unsend for everyone or for a single user)
    newSocket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
      console.log("Received socket event for message deletion:", messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId)); // Remove message from UI
    });

    // Handle message reception
    newSocket.on("messageReceived", fetchNonParticipants);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);
  //--------------get all users ---------
  useEffect(() => {
    async function fetchUsers() {
      const res = await http.get("/get-all-users", token);
      if (!res.error && participants && currentUser) {
        const filtered = res.data.filter(
          (u: User) => !participants.some((p) => p._id === u._id) && u._id !== currentUser._id
        );
        setAvailableUsers(filtered);
      }
    }

    if (participants && currentUser) {
      fetchUsers();
    }
  }, [participants, currentUser]);
  const handleAddUser = async (userId: string) => {
    if (!conversationId) return;

    try {
      const res = await http.postAuth<{ error: boolean; updatedConversation?: Conversation; message?: string }>(
        "/add-user-to-conversation",
        {
          conversationId: conversationId,
          userId,
        },
        token
      );

      if (!res.error && res.updatedConversation) {
        setAvailableUsers((prev) => prev.filter((u) => u._id !== userId));

        // ✅ Convert Participant[] → User[] by assigning default role
        setParticipants(
          res.updatedConversation.participants.map((p) => ({
            ...p,
            role: "user", // fallback role (you can adjust if you have real roles)
          }))
        );
      } else {
        console.error(res.message || "Failed to add user");
      }
    } catch (err) {
      console.error("Add user error:", err);
    }
  };
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

      if (!res.error) {
        // Replace updated message in state
        setMessages((prev) => prev.map((msg) => (msg._id === res.data._id ? res.data : msg)));

        socket?.emit("likeMessage", res.data); // only needed if others should update in real-time
      }
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  // ------------------ DELETE MESSAGE Permanent ------------------
  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Step 1: Delete the message from the backend
      await http.postAuth(`/delete-message/${messageId}`, {}, token);

      // Step 2: Remove the message from the local state (UI)
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      // Step 3: Emit the socket event to notify other users about the message deletion
      socket?.emit("messageDeleted", { messageId });

      console.log(`Message ${messageId} deleted successfully.`);
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  // ------------- DELETE MESSAGE only for me -------------
  const handleDeleteForMe = async (messageId: string) => {
    try {
      // Find the message by its ID from the messages array
      const message = messages.find((msg) => msg._id === messageId);
      if (!message || !message._id) {
        console.error("Message not found or missing _id");
        return;
      }

      // Step 1: Call backend API to delete the message only for the current user (unsend for me)
      await http.postAuth(`/delete-message-for-me/${message._id}`, {}, token);

      // Step 2: Emit the event for the socket connection to notify others
      socket?.emit("messageDeleted", { messageId: message._id });

      // Step 3: Remove the message from the local state immediately (UI update)
      removeMessage(message._id); // This will remove the message from the UI instantly

      console.log(`Message ${message._id} unsent for me successfully.`);
    } catch (err) {
      console.error("❌ Failed to unsend for me:", err);
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
          role: res.data.user.role ?? "user",
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
    <div className="flex flex-col items-center w-full mt-[70px] px-[10px] sm:px-[20px]">
      <div className="w-full max-w-[1400px] flex flex-col gap-6 bg-white/90 backdrop-blur-md border border-white/50 shadow-2xl rounded-2xl p-6">
        {currentUser ? (
          <div className="w-full flex flex-col xl:flex-row gap-6">
            {/* Chat Box */}
            <div className="flex flex-col w-full bg-white/60 backdrop-blur-md border border-white/30 p-4 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm border border-white/20 p-3 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  {selectedUser && (
                    <img className="w-12 h-12 rounded-full object-cover" src={selectedUser.image} alt="" />
                  )}
                  <p className="text-gray-600 font-semibold">
                    {lang === "lt" ? "Pokalbis su:" : "Chat with:"}{" "}
                    {(participants ?? [])
                      .filter((p) => p.username !== currentUser.username)
                      .map((p) => p.username)
                      .join(", ") || (lang === "lt" ? "(nėra pasirinkto)" : "(no one yet)")}
                  </p>
                </div>
                <svg
                  onClick={() => setDisplayUsers(!displayUsers)}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6 text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>

              {/* Message List */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex flex-col min-h-[520px] max-h-[550px] p-3 overflow-auto bg-white/60 backdrop-blur-md border border-white/30 rounded-xl shadow-inner"
              >
                {messages.map((msg) => (
                  <SingleMessage
                    key={msg._id}
                    message={msg}
                    participants={participants ?? []}
                    handleLikeMessage={handleLikeMessage}
                    handleDeleteMessage={handleDeleteMessage}
                    socket={socket}
                    removeMessage={removeMessage}
                  />
                ))}
                {successMsg && <SuccessComp msg={successMsg} />}
                {errorMsg && <ErrorComp error={errorMsg} />}
                <div ref={messagesEndRef} />
              </div>

              {/* Load Earlier */}
              {showButton && (
                <button
                  onClick={handleLoadEarlier}
                  className="mt-4 bg-indigo-500 hover:bg-indigo-400 text-white p-2 rounded text-sm self-center"
                >
                  {lang === "lt" ? "Įkelti ankstesnes" : "Load Earlier"}
                </button>
              )}

              {/* Input */}
              {selectedUser && (
                <div className="flex mt-4 p-3 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl items-center gap-2">
                  <input
                    ref={messageRef}
                    type="text"
                    placeholder={lang === "lt" ? "Rašykite žinutę..." : "Type your message"}
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

            {/* Add Users Sidebar */}
            {displayUsers && (
              <div className="bg-white/60 backdrop-blur-md border border-white/30 w-[300px] rounded-2xl shadow p-4 overflow-auto flex flex-col gap-2">
                <p className="text-gray-700 font-semibold mb-2">
                  {lang === "lt" ? "Pridėti vartotojus į pokalbį" : "Add Users to the chat"}
                </p>
                {availableUsers?.map((u) => (
                  <div key={u._id} className="flex justify-between items-center border-b pb-2">
                    <span>{u.username}</span>
                    <svg
                      onClick={() => handleAddUser(u._id)}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[600px] bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl p-6 w-full flex flex-col justify-center items-center">
            <p className="font-semibold text-gray-600 mb-4">
              {lang === "lt" ? "Prisijunkite, kad galėtumėte rašyti žinutes" : "Please Log In to send a message"}
            </p>
            <button
              onClick={() => nav("/login")}
              className="text-white w-[300px] bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm px-5 py-2.5"
            >
              {lang === "lt" ? "Prisijungti" : "Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
