import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import SingleConversationComp from "../components/SingleConversationComp";
import { useNavigate } from "react-router-dom";
import type { User, Conversation } from "../types";
import { useLanguage } from "../context/LanguageContext";

const AllConversations: React.FC = () => {
  const { currentUser, setConNum } = mainStore();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const nav = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    async function fetchUserConversations() {
      if (!currentUser?._id) return;

      try {
        const res = await http.get(`/conversations/${currentUser._id}`);
        if (!res.error) {
          const filtered = (res.data || []).filter((c: any) => {
            // handle hiddenFor being undefined or populated
            return !c.hiddenFor?.some((id: any) => id === currentUser._id || id._id === currentUser._id);
          });

          setConNum(filtered.length);
          setConversations(filtered);
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

  const filteredConversations = currentUser
    ? conversations.filter((c) => {
        const otherUser = c.participants.find((p) => p._id !== currentUser._id);
        return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  return (
    <div className="flex-grow flex flex-col justify-start items-center w-full min-h-[calc(100vh-130px)] px-[10px] sm:px-[20px] pt-[70px] pb-10">
      <div className="w-full max-w-[1400px] bg-white/90 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-2xl flex flex-col gap-6">
        {/* 🔍 Paieška ir antraštė */}
        <div className="bg-white/60 backdrop-blur-md border border-white/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-semibold text-2xl shadow-2xl">
          <p className="text-gray-600">{lang === "lt" ? "Tavo pokalbiai:" : "Your Conversations:"}</p>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === "lt" ? "Ieškoti..." : "Search..."}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* 💬 Pokalbiai */}
        {currentUser ? (
          <div className="flex flex-wrap justify-start gap-x-[40px] gap-y-[50px]">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                className="w-full sm:w-[calc(50%-20px)] xl:w-[calc(33.33%-27px)] max-w-[450px]"
              >
                <SingleConversationComp conversation={conversation} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => nav(`/login`)}
              className="text-white bg-indigo-600 hover:bg-indigo-500 font-medium rounded-full text-sm px-5 py-2.5"
            >
              {lang === "lt" ? "Prisijunkite, kad matytumėte pokalbius" : "Log In to see your conversations"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllConversations;
