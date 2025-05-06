import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Komponentai
import Toolbar from "./components/Toolbar";

// Puslapiai
import Login from "./pages/Login";
import Register from "./pages/Register";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";
import SingleUserPage from "./pages/SingleUserPage";
import Conversations from "./pages/Conversations";
import AllConversations from "./pages/AllConversations";
import ChatPage from "./pages/ChatPage";
import AdminPanel from "./pages/AdminPanel";

const App: React.FC = () => {
  return (
    <div className="App h-screen bg-gradient-to-br">
      <BrowserRouter>
        <div className="fixed top-0 left-0 w-full h-[100vh] -z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x bg-[length:200%_200%] blur-[2px]" />
        <Toolbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          {/* Pagrindinis puslapis su vartotojų sąrašu */}

          <Route path="/login" element={<Login />} />
          {/* Prisijungimo forma */}

          <Route path="/register" element={<Register />} />
          {/* Registracija */}

          <Route path="/profile" element={<Profile />} />
          {/* Vartotojo profilis (dabartinio vartotojo) */}

          <Route path="/profile/:username" element={<SingleUserPage />} />
          {/* Kito vartotojo profilis su galimybe išsiųsti žinutę */}

          <Route path="/allConversations" element={<AllConversations />} />
          {/* Visų pokalbių sąrašas */}

          <Route path="/conversation/:conversationId" element={<Conversations />} />
          {/* Konkretaus pokalbio peržiūra */}

          <Route path="/chatPage" element={<ChatPage />} />
          {/* Bendras pokalbių puslapis */}

          <Route path="/admin" element={<AdminPanel />} />
          {/* Administratoriaus panelė */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
