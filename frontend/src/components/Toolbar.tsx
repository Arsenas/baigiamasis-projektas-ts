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
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const defaultAvatar =
    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  useEffect(() => {
    async function fetchUserConversations() {
      if (!currentUser?._id) return;
      try {
        const res = await http.get(`/conversations/${currentUser._id}`);
        if (!res.error) {
          setConNum(res.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    }

    const newSocket = io(process.env.REACT_APP_API_URL || "");
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
    //setIsOpen(false);
  };

  const goToProfile = (): void => {
    navigate("/profile");
    setActiveLink("");
    setIsOpen(false);
  };

  return (
    <div className={`transition-all duration-300 ${isOpen ? "mb-[10px] md:mb-0" : ""}`}>
      {/* Topbar */}
      <div className="w-full bg-white/70 backdrop-blur-md border-b border-gray-200 shadow h-[70px] z-30 relative">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 h-full">
          {/* 🔘 Kairė: Kalba + Tema + Burger */}
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setLang(lang === "en" ? "lt" : "en")}
              title={lang === "en" ? "Switch to Lithuanian" : "Pakeisti į anglų"}
            >
              <img src={`/flags/${lang === "en" ? "gb.svg" : "lt.svg"}`} alt={lang} className="w-6 h-6" />
            </button>

            <label className="relative inline-flex items-center cursor-pointer w-11 h-6">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "light" ? "dark" : "light")}
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                  theme === "dark" ? "bg-gray-600" : "bg-gray-300 peer-checked:bg-indigo-600"
                }`}
              />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-full" />
            </label>

            {/* 🍔 Burger */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-800 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* 🌐 Centras (tik md+): Navigacija */}
          <div className="hidden md:flex gap-6 absolute left-1/2 -translate-x-1/2 text-sm font-semibold">
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

          {/* 👤 Dešinė: Avatar + logout */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <img
                src={currentUser.image || defaultAvatar}
                className={`w-[42px] h-[42px] hover:h-[44px] hover:w-[44px] p-[2px] rounded-full cursor-pointer ${
                  theme === "dark" ? "bg-gray-700" : "bg-indigo-500"
                }`}
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
                className={`${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-indigo-500 hover:bg-indigo-400 text-white"
                } font-medium rounded-lg text-sm px-4 py-2 transition`}
              >
                {lang === "lt" ? "Atsijungti" : "Log out"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🌐 Navigacija ant mažo ekrano su animacija */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          isOpen ? "max-h-[300px] py-4" : "max-h-0 py-0"
        } flex flex-col items-center gap-2 text-sm font-semibold bg-white px-4 z-20`}
      >
        {!currentUser && (
          <Link to="/login" onClick={() => handleLinkClick("login")}>
            {lang === "lt" ? "Prisijungti" : "Login"}
          </Link>
        )}
        {!currentUser && (
          <Link to="/register" onClick={() => handleLinkClick("register")}>
            {lang === "lt" ? "Registracija" : "Register"}
          </Link>
        )}
        <Link to="/" onClick={() => handleLinkClick("homepage")}>
          {lang === "lt" ? "Pagrindinis" : "Homepage"}
        </Link>
        {currentUser && (
          <Link to="/allConversations" onClick={() => handleLinkClick("conversations")}>
            {lang === "lt" ? "Pokalbiai" : "Conversations"} ({conNum})
          </Link>
        )}
        {currentUser && (
          <Link to="/chatPage" onClick={() => handleLinkClick("chatPage")}>
            {lang === "lt" ? "Viešas kambarys" : "Public Room"}
          </Link>
        )}
        {currentUser?.role === "admin" && (
          <Link to="/admin" onClick={() => handleLinkClick("adminPanel")}>
            {lang === "lt" ? "Administratoriaus pultas" : "Admin Panel"}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
