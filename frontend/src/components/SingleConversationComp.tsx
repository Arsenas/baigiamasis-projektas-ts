import React, { useEffect, useState } from "react";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";

// Tipai
interface Participant {
  username: string;
  [key: string]: any;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  updatedAt: string;
  [key: string]: any;
}

interface Props {
  conversation: Conversation;
}

const SingleConversationComp: React.FC<Props> = ({ conversation }) => {
  const { token, currentUser } = mainStore();
  const nav = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

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
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
      </svg>

      <div className="flex gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-16 h-[120px] w-[120px] text-gray-800 rounded-full p-3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-1 ms-4 justify-center text-start">
        <div
          onClick={() => nav(`/conversation/${conversation._id}`)}
          className="text-gray-600 hover:text-gray-500 cursor-pointer text-xl"
        >
          <p className="font-semibold">Conversation with:</p>
          <div className="flex gap-1 text-sm">
            <div className="flex gap-1 text-lg">
              {conversation.participants
                .filter((participant) => participant.username !== currentUser?.username)
                .map((participant, i, arr) => (
                  <p className="font-semibold" key={i}>
                    {participant.username}
                    {i < arr.length - 1 && ","}
                  </p>
                ))}
            </div>
          </div>
        </div>
        <div className="text-gray-400 text-xs">Last updated: {formatDate(conversation.updatedAt)}</div>
      </div>
    </div>
  );
};

export default SingleConversationComp;
