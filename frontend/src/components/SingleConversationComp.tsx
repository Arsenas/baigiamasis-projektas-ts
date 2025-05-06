import React, { useEffect, useState } from "react";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "../types";

interface Props {
  conversation: Conversation;
}

const SingleConversationComp: React.FC<Props> = ({ conversation }) => {
  const { token, currentUser } = mainStore();
  const nav = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  // 🧠 Filter out yourself to get the other chat partner(s)
  const otherParticipants = conversation.participants.filter((p) => p._id !== currentUser?._id);

  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = date.toISOString().split("T")[0];
    const formattedTime = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${formattedDate} ${formattedTime}`;
  }

  const deleteConversation = async (): Promise<void> => {
    if (!currentUser) return;

    const data = {
      conversationId: conversation._id,
      userId: currentUser._id,
    };

    try {
      const res = await http.postAuth(`/deleteConversation/${conversation._id}`, data, token);
      if (!res.error) {
        const conversations = res.data;
        socket?.emit("deleteConversation", conversations);
        socket?.emit("conversationNumber", conversations);
      } else {
        console.error(res.message);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  return (
    <div className="p-6 bg-white flex shadow-xl rounded relative">
      <svg
        onClick={deleteConversation}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-5 absolute text-gray-300 hover:text-gray-500 bottom-4 right-4 cursor-pointer"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 0 0-3.478-.397m-12 .562a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916"
        />
      </svg>

      <div className="flex gap-3">
        <img
          src={otherParticipants[0]?.image ?? "/default.png"}
          alt="User"
          className="h-[120px] w-[120px] rounded-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 ms-4 justify-center text-start">
        <div
          onClick={() => nav(`/conversation/${conversation._id}`)}
          className="text-gray-600 hover:text-gray-500 cursor-pointer text-xl"
        >
          <p className="font-semibold">Conversation with:</p>
          <div className="flex gap-1 text-lg">
            {otherParticipants.map((participant, i, arr) => (
              <p className="font-semibold" key={i}>
                {participant.username}
                {i < arr.length - 1 && ","}
              </p>
            ))}
          </div>
        </div>
        <div className="text-gray-400 text-xs">Last updated: {formatDate(conversation.updatedAt)}</div>
      </div>
    </div>
  );
};

export default SingleConversationComp;
