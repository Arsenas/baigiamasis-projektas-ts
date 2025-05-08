import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import ErrorComp from "../components/ErrorComp";
import SuccessComp from "../components/SuccessComp";
import { useTheme } from "../context/ThemeContext";

interface User {
  _id: string;
  username: string;
  image: string;
  [key: string]: any;
}

const SingleUserPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const { currentUser, token } = mainStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const nav = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || "");
    setSocket(newSocket);

    newSocket.on("profileUpdated", (data: User) => {
      console.log("Profile updated with data: ", data);
      setUser(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await http.get(`/get-user/${username}`);
        if (!res.error) {
          setUser(res.data);
        } else {
          setError(res.message ?? null);
        }
      } catch (err) {
        setError("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [username]);

  if (loading) return <div>Loading...</div>;

  async function sendMessage() {
    if (!messageRef.current || !user || !currentUser) return;

    setError(null);

    const msgText = messageRef.current.value.trim();
    if (msgText.length < 1 || msgText.length > 200) {
      setError("Message should be between 1 and 200 characters.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const timestamp = new Date().toISOString();

    const messageData = {
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        image: currentUser.image,
      },
      recipient: user.username,
      recipientImage: user.image,
      message: msgText,
      timestamp,
      liked: [],
    };
    try {
      const res = await http.postAuth("/send-message", messageData, token);

      if (!res.error && res.data) {
        setSuccessMessage("Message sent!");
        setTimeout(() => setSuccessMessage(null), 3000);

        socket?.emit("chatMessage", {
          ...messageData,
          _id: res.data._id,
        });

        messageRef.current.value = "";
      } else {
        setError(res.message ?? "Unknown error");
      }
    } catch (err) {
      console.error("❌ Send message error:", err);
      setError("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* Profile card */}
      <div className="relative z-10 bg-white max-w-xl w-full rounded-3xl shadow-2xl overflow-hidden">
        {/* 🔲 Wallpaper section */}
        <div
          className="h-32 sm:h-48 bg-cover bg-center"
          style={{
            backgroundImage: `url(${user?.wallpaper || "/default-wallpaper.jpg"})`,
          }}
        />

        {/* 🔵 Profile content */}
        <div className="p-8 pt-0 flex flex-col items-center">
          <img src={user?.image} className="rounded-full h-40 w-40 shadow-md p-1 bg-white -mt-20" alt="Profile" />
          <h1 className="text-3xl font-bold text-gray-800 mt-2">{user?.username}</h1>

          <p className="text-sm text-gray-500 mb-6 italic text-center px-4">
            {user?.description?.trim() ? user.description : "This user hasn’t written a description yet."}
          </p>

          {currentUser?._id === user?._id && (
            <p className="text-xs text-indigo-600 mb-4 font-medium">This is your profile</p>
          )}

          {currentUser ? (
            <div className="w-full flex flex-col gap-3">
              <label htmlFor="message" className="block text-sm font-medium text-gray-900 text-start">
                Your message:
              </label>
              <textarea
                id="message"
                rows={4}
                ref={messageRef}
                className="block w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
                placeholder="Write your thoughts here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              ></textarea>

              <button
                type="button"
                onClick={sendMessage} // ✅ Tikra funkcija
                className={`mt-5 text-sm px-5 py-2.5 rounded-full font-medium transition ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                Send Message
              </button>

              {error && <ErrorComp error={error} />}
              {successMessage && <SuccessComp msg={successMessage} />}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => nav("/login")}
              className={`text-sm px-5 py-2.5 rounded-full font-medium transition ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              Login to send a message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleUserPage;
