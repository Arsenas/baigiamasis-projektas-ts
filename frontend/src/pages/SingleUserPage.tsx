import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import ErrorComp from "../components/ErrorComp";
import SuccessComp from "../components/SuccessComp";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const nav = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:2000");
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
      sender: currentUser.username,
      recipient: user.username,
      message: msgText,
      timestamp,
      senderImage: currentUser.image,
      recipientImage: user.image,
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
    <div className="h-screen relative">
      <div className="bg-gradient-to-r from-indigo-500 to-violet-400 p-3 h-1/3"></div>
      <div className="bg-white w-[600px] p-5 mx-auto container rounded-3xl absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-full w-full relative flex-col">
          <img
            src={user?.image}
            className="rounded-full h-[200px] w-[200px] absolute left-1/2 transform -translate-x-1/2 -top-1/2 shadow-xl p-3 backdrop-blur"
            alt="Profile"
          />
          <p className="pt-[180px] text-3xl font-semibold text-gray-600">{user?.username}</p>

          {currentUser ? (
            <div className="mt-10 flex flex-col gap-3">
              <label htmlFor="message" className="block mb-2 text-sm text-start font-medium text-gray-900">
                Your message
              </label>
              <textarea
                id="message"
                rows={4}
                ref={messageRef}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
                placeholder="Write your thoughts here..."
              ></textarea>

              <button
                type="button"
                onClick={sendMessage}
                className="text-white bg-indigo-600 hover:bg-indigo-500 font-medium rounded-full text-sm px-5 py-2.5"
              >
                Send a message
              </button>

              {error && <ErrorComp error={error} />}
              {successMessage && <SuccessComp msg={successMessage} />}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => nav("/login")}
              className="text-white mt-5 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-full text-sm px-5 py-2.5"
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
