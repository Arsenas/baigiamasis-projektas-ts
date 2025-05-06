import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import SingleConversationComp from "../components/SingleConversationComp";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

// Tikslus tipas pagal faktinius laukus projekte
interface Conversation {
  _id: string;
  updatedAt: string;
  participants: User[];
}

const AllConversations: React.FC = () => {
  const { currentUser, setConNum } = mainStore();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    async function fetchUserConversations() {
      if (!currentUser?._id) return;

      try {
        const res = await http.get(`/conversations/${currentUser._id}`);
        if (!res.error) {
          setConNum(res.data.length);
          setConversations(res.data || []);
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

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex bg-gradient-to-r from-indigo-500 to-violet-400 h-1/3" />
      <div className="flex absolute top-[100px] xl:px-[100px] px-[20px] w-full">
        <div className="flex-col flex bg-white p-4 w-full rounded-2xl min-h-[650px]">
          <div className="flex p-5 bg-white shadow-2xl w-full mb-12 font-semibold text-xl">Your Conversations:</div>

          {currentUser ? (
            <div className="flex flex-wrap gap-[50px]">
              {conversations.map((conversation) => (
                <div key={conversation._id} className="xl:w-[450px] w-full">
                  <SingleConversationComp conversation={conversation} />
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => nav(`/login`)}
              className="text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            >
              Log In to see your conversations
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllConversations;
