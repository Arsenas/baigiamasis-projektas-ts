import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";

// Tipas naudotojui (gali išplėsti pagal duomenis)
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
          console.log(res);
        } else {
          console.error(res.message);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    }

    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    newSocket.on("messageReceived", () => {
      fetchUserConversations();
    });

    newSocket.on("conversationDeleted", () => {
      fetchUserConversations();
    });

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
    <div className="flex gap-6 justify-center font-semibold items-center w-full bg-white p-3 shadow h-[70px]">
      <div className="flex items-center justify-between w-full">
        <div className="flex"></div>
        <div className="flex gap-6">
          {!currentUser && (
            <div>
              <Link
                to="/login"
                onClick={() => handleLinkClick("login")}
                className={`block py-2 px-3 text-gray-800 rounded md:bg-transparent md:p-0 dark:text-white md:dark:text-blue-500 ${
                  activeLink === "login" ? "text-indigo-700" : ""
                }`}
                aria-current="page"
              >
                Login
              </Link>
            </div>
          )}
          {!currentUser && (
            <div>
              <Link
                to="/register"
                onClick={() => handleLinkClick("register")}
                className={`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent ${
                  activeLink === "register" ? "text-indigo-700" : ""
                }`}
              >
                Register
              </Link>
            </div>
          )}
          <div>
            <Link
              to="/"
              onClick={() => handleLinkClick("homepage")}
              className={`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent ${
                activeLink === "homepage" ? "text-indigo-700" : ""
              }`}
            >
              Homepage
            </Link>
          </div>
          {currentUser && (
            <div>
              <Link
                to="/allConversations"
                onClick={() => handleLinkClick("conversations")}
                className={`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent ${
                  activeLink === "conversations" ? "text-indigo-700" : ""
                }`}
              >
                Conversations ({conNum})
              </Link>
            </div>
          )}
          {currentUser && (
            <div>
              <Link
                to="/chatPage"
                onClick={() => handleLinkClick("chatPage")}
                className={`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent ${
                  activeLink === "chatPage" ? "text-indigo-700" : ""
                }`}
              >
                Chat page
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 me-5">
          {currentUser && (
            <div className="flex gap-3 items-center">
              <img
                src={currentUser.image}
                className="w-[42px] h-[42px] hover:h-[44px] hover:w-[44px] bg-indigo-500 p-[2px] rounded-full cursor-pointer"
                alt=""
                onClick={goToProfile}
              />
            </div>
          )}
          {currentUser && (
            <button
              type="button"
              onClick={logOut}
              className="text-white bg-indigo-500 hover:bg-indigo-400 focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
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
