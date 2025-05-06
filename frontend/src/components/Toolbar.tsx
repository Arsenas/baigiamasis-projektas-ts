import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";

interface User {
  _id: string;
  image: string;
  [key: string]: any;
}

const Toolbar: React.FC = () => {
  const { currentUser, setCurrentUser, conNum, setConNum } = mainStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [activeLink, setActiveLink] = useState<string>("");

  function logOut(): void {
    setCurrentUser(null);
    navigate("/login");
  }

  useEffect(() => {
    async function fetchUserConversations() {
      if (!currentUser?._id) return;

      try {
        const res = await http.get(`/conversations/${currentUser._id}`);
        if (!res.error) {
          setConNum(res.data.length);
        } else {
          console.error(res.message);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    }

    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    newSocket.on("messageReceived", fetchUserConversations);
    newSocket.on("conversationDeleted", fetchUserConversations);

    fetchUserConversations();

    return () => {
      newSocket.close();
    };
  }, [currentUser]);

  const handleLinkClick = (link: string): void => {
    setActiveLink(link);
  };

  function goToProfile(): void {
    navigate("/profile");
    setActiveLink("");
  }

  return (
    <div className="flex justify-center items-center w-full bg-white border-b border-gray-200 p-3 shadow h-[70px]">
      <div className="flex items-center justify-between w-full max-w-7xl px-4">
        {/* Left spacer */}
        <div className="flex"></div>

        {/* Center navigation */}
        <div className="flex gap-6 text-sm font-semibold">
          {!currentUser && (
            <Link
              to="/login"
              onClick={() => handleLinkClick("login")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "login" ? "text-indigo-700" : ""
              }`}
            >
              Login
            </Link>
          )}
          {!currentUser && (
            <Link
              to="/register"
              onClick={() => handleLinkClick("register")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "register" ? "text-indigo-700" : ""
              }`}
            >
              Register
            </Link>
          )}
          <Link
            to="/"
            onClick={() => handleLinkClick("homepage")}
            className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
              activeLink === "homepage" ? "text-indigo-700" : ""
            }`}
          >
            Homepage
          </Link>
          {currentUser && (
            <Link
              to="/allConversations"
              onClick={() => handleLinkClick("conversations")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "conversations" ? "text-indigo-700" : ""
              }`}
            >
              Conversations ({conNum})
            </Link>
          )}
          {currentUser && (
            <Link
              to="/chatPage"
              onClick={() => handleLinkClick("chatPage")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "chatPage" ? "text-indigo-700" : ""
              }`}
            >
              Chat page
            </Link>
          )}
        </div>

        {/* Right side: avatar + logout */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <img
              src={currentUser.image}
              className="w-[42px] h-[42px] hover:h-[44px] hover:w-[44px] bg-indigo-500 p-[2px] rounded-full cursor-pointer"
              alt="avatar"
              onClick={goToProfile}
            />
          )}
          {currentUser && (
            <button
              type="button"
              onClick={logOut}
              className="text-white bg-indigo-500 hover:bg-indigo-400 font-medium rounded-lg text-sm px-4 py-2"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
