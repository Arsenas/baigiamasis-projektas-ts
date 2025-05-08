import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import socket from "./socket";
import mainStore from "./store/mainStore";

import { useTheme } from "./context/ThemeContext";

import Toolbar from "./components/Toolbar";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";
import SingleUserPage from "./pages/SingleUserPage";
import Conversations from "./pages/Conversations";
import AllConversations from "./pages/AllConversations";
import ChatPage from "./pages/ChatPage";
import AdminPanelWrapper from "./pages/AdminPanelWrapper";

const App: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    socket.connect();
    socket.on("messagePermanentlyDeleted", ({ messageId }: { messageId: string }) => {
      console.log("🧨 Deleted for all:", messageId);
      mainStore.getState().removeMessage(messageId);
    });
    return () => {
      socket.disconnect();
      socket.off("messagePermanentlyDeleted");
    };
  }, []);

  const gradientClass =
    theme === "dark" ? "from-gray-900 via-gray-800 to-black" : "from-indigo-700 via-fuchsia-600 to-rose-600";

  return (
    <BrowserRouter>
      <div className="relative min-h-screen flex flex-col">
        {/* 💫 Fonas */}
        <div
          className={`absolute top-0 left-0 w-full min-h-full -z-10 
                      bg-gradient-to-r ${gradientClass}
                      animate-pulse-gradient bg-[length:200%_200%] blur-[2px]`}
        />

        {/* 🔝 Viršutinė juosta */}
        <Toolbar />

        {/* 🌐 Turinys su scroll'u */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<SingleUserPage />} />
            <Route path="/allConversations" element={<AllConversations />} />
            <Route path="/conversation/:conversationId" element={<Conversations />} />
            <Route path="/chatPage" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPanelWrapper />} />
          </Routes>
        </main>

        {/* 🔚 Apačia */}
        <Footer className="mt-auto" />
      </div>
    </BrowserRouter>
  );
};

export default App;
