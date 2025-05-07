import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const Toolbar: React.FC = () => {
  const { currentUser, setCurrentUser, conNum, setConNum } = mainStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [activeLink, setActiveLink] = useState<string>("");

  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  const defaultAvatar =
    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

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
    <div className="flex justify-center items-center w-full bg-white border-b border-gray-200 px-4 shadow h-[70px]">
      <div className="flex items-center justify-between w-full max-w-7xl relative">
        {/* 🔘 Kairė: kalba + tema */}
        <div className="flex gap-4 items-center">
          {/* Kalbos perjungimas su vėliavėle ir tekstu */}
          <button
            onClick={() => setLang(lang === "en" ? "lt" : "en")}
            title={lang === "en" ? "Switch to Lithuanian" : "Pakeisti į anglų"}
          >
            <img src={`/flags/${lang === "en" ? "gb.svg" : "lt.svg"}`} alt={lang} className="w-6 h-6" />
          </button>

          {/* Toggle animuotas */}
          <label className="relative inline-flex items-center cursor-pointer w-11 h-6">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={() => setTheme(theme === "light" ? "dark" : "light")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 transition-colors duration-300" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-full" />
          </label>
        </div>

        {/* 🌐 Centras: per vidurį */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-6 text-sm font-semibold">
          {!currentUser && (
            <Link
              to="/login"
              onClick={() => handleLinkClick("login")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "login" ? "text-indigo-700" : ""
              }`}
            >
              {lang === "lt" ? "Prisijungti" : "Login"}
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
              {lang === "lt" ? "Registracija" : "Register"}
            </Link>
          )}
          <Link
            to="/"
            onClick={() => handleLinkClick("homepage")}
            className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
              activeLink === "homepage" ? "text-indigo-700" : ""
            }`}
          >
            {lang === "lt" ? "Pagrindinis" : "Homepage"}
          </Link>
          {currentUser && (
            <Link
              to="/allConversations"
              onClick={() => handleLinkClick("conversations")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "conversations" ? "text-indigo-700" : ""
              }`}
            >
              {lang === "lt" ? "Pokalbiai" : "Conversations"} ({conNum})
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
              {lang === "lt" ? "Viešas kambarys" : "Public Room"}
            </Link>
          )}

          {/* Tik adminui rodyti Admin Panel */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => handleLinkClick("adminPanel")}
              className={`py-2 px-3 text-gray-800 hover:text-indigo-600 ${
                activeLink === "adminPanel" ? "text-indigo-700" : ""
              }`}
            >
              {lang === "lt" ? "Administratoriaus pultas" : "Admin Panel"}
            </Link>
          )}
        </div>

        {/* 🔚 Dešinė: avatar + logout */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <img
              src={currentUser.image || defaultAvatar}
              className="w-[42px] h-[42px] hover:h-[44px] hover:w-[44px] bg-indigo-500 p-[2px] rounded-full cursor-pointer"
              alt="avatar"
              onClick={goToProfile}
            />
          )}
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                setCurrentUser(null);
                navigate("/login");
              }}
              className="text-white bg-indigo-500 hover:bg-indigo-400 font-medium rounded-lg text-sm px-4 py-2"
            >
              {lang === "lt" ? "Atsijungti" : "Log out"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
