import React, { useEffect, useState } from "react";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import type { Conversation, User } from "../types";

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
    const newSocket = io(process.env.REACT_APP_API_URL || "");
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      if (!currentUser) return; // ✅ Safeguard

      const res = await http.get("/get-all-users");
      if (!res.error) {
        const others = res.data.filter(
          (u: User) => !conversation.participants.some((p) => p._id === u._id) && u._id !== currentUser._id
        );
        setAvailableUsers(others);
      }
    }

    fetchUsers();
  }, [conversation, currentUser]); // ✅ Also add currentUser to dependencies

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

  const handleAddUser = async (userId: string) => {
    try {
      interface AddUserResponse {
        error: boolean;
        message?: string;
        updatedConversation?: Conversation;
      }

      const res = await http.postAuth<AddUserResponse>(
        "/add-user-to-conversation",
        {
          conversationId: conversation._id,
          userId,
        },
        token
      );

      if (!res.error && res.updatedConversation) {
        // Emit update over socket
        socket?.emit("userAddedToConversation", res.updatedConversation);

        // Refresh available users list
        setAvailableUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        console.error(res.message || "Failed to add user.");
      }
    } catch (err) {
      console.error("Error adding user to conversation:", err);
    }
  };

  return (
    <div className="relative p-6 bg-white flex items-center gap-4 rounded-2xl shadow-xl w-full h-full">
      {/* Delete Icon */}
      <svg
        onClick={deleteConversation}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-5 absolute text-gray-300 hover:text-gray-500 top-4 right-4 cursor-pointer"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 0 0-3.478-.397m-12 .562a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916"
        />
      </svg>

      {/* Image */}
      <img
        src={otherParticipants[0]?.image ?? "/default.png"}
        alt="User"
        className="h-[80px] w-[80px] rounded-full object-cover"
      />

      {/* Text */}
      <div className="flex flex-col justify-center text-start w-full">
        <div onClick={() => nav(`/conversation/${conversation._id}`)} className="cursor-pointer hover:text-gray-500">
          <p className="text-gray-700 font-semibold text-[16px]">Conversation with:</p>
          <div className="flex flex-wrap gap-1 text-[15px] text-gray-800 font-semibold">
            {otherParticipants.map((participant, i, arr) => (
              <span key={i}>
                {participant.username}
                {i < arr.length - 1 && ","}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Last updated: {formatDate(conversation.updatedAt)}</p>
      </div>
    </div>
  );
};

export default SingleConversationComp;
