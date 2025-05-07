import React, { useState } from "react";
import type { Message } from "../types";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import { Socket } from "socket.io-client";

interface Props {
  message: Message;
  handleLikeMessage: (id: string) => void;
  handleDeleteMessage: (id: string) => void;
  participants?: any[]; // Keep participants as it was
  socket: ReturnType<typeof io> | null; // Accept socket as a prop
  removeMessage: (id: string) => void; // Accept removeMessage as a prop
}

const SingleMessage: React.FC<Props> = ({
  message,
  handleLikeMessage,
  handleDeleteMessage,
  participants,
  socket,
  removeMessage,
}) => {
  const { currentUser } = mainStore();
  const { token } = mainStore();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrentUser = message.sender?._id === currentUser?._id;
  const likedCount = message.liked?.length ?? 0;

  const containerAlign = isCurrentUser ? "items-end" : "items-start";
  const messageAlign = isCurrentUser ? "justify-end" : "justify-start";
  const bubbleColor = isCurrentUser ? "bg-indigo-200" : "bg-blue-50";
  const textAlign = isCurrentUser ? "text-end me-10" : "text-start ms-10";

  const handleDeleteForEveryone = async () => {
    try {
      // Call backend API to delete the message permanently
      await http.deleteAuth(`/permanent-delete-message/${message._id}`, token);

      // Emit the event for the socket connection
      socket?.emit("messagePermanentlyDeleted", { messageId: message._id });
      console.log("Socket event emitted for message:", message._id);

      // Update local state by removing the message instantly
      removeMessage(message._id ?? ""); // Ensure _id is not undefined
    } catch (err) {
      console.error("❌ Failed to delete for everyone:", err);
    }
  };

  return (
    <div className={`mt-3 flex flex-col gap-1 ${containerAlign}`}>
      <div className={`flex w-full gap-2 items-end ${messageAlign}`}>
        {/* ⋮ Menu */}
        {isCurrentUser && (
          <div className="flex items-center relative h-full">
            <svg
              onClick={() => setShowMenu((prev) => !prev)}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-black hover:text-gray-700 cursor-pointer mt-[20px]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>

            {showMenu && (
              <div className="absolute top-5 right-full mr-2 bg-white border rounded-md shadow-lg z-10 w-40">
                <button
                  onClick={() => handleDeleteMessage(message._id!)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Unsend for me
                </button>
                {isCurrentUser && (
                  <button
                    onClick={handleDeleteForEveryone}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    Unsend for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avatar - left or right depending on sender */}
        {!isCurrentUser && (
          <img className="w-10 h-10 rounded-full bg-white shadow-md" src={message.sender?.image} alt="sender avatar" />
        )}

        <div className="flex flex-col max-w-[70%] relative">
          <p className="text-gray-400 text-sm">{message.sender?.username}</p>

          <div className={`relative px-5 py-2 rounded-3xl text-gray-900 ${bubbleColor}`}>
            {message.message}

            {/* ❤️ Like button — bottom right */}
            {typeof message._id === "string" && (
              <svg
                onClick={() => handleLikeMessage(message._id as string)}
                xmlns="http://www.w3.org/2000/svg"
                fill={likedCount > 0 ? "pink" : "none"}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`size-4 cursor-pointer absolute bottom-0 -right-1 ${
                  likedCount > 0 ? "text-pink-400" : "hover:text-pink-400"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            )}
          </div>
        </div>

        {isCurrentUser && (
          <img className="w-10 h-10 rounded-full bg-white shadow-md" src={message.sender?.image} alt="your avatar" />
        )}
      </div>

      {/* Timestamp */}
      <div className={`flex items-center gap-2 text-xs text-gray-400 ${textAlign}`}>
        <span>{new Date(message.timestamp).toISOString().slice(0, 16).replace("T", " ")}</span>
      </div>
    </div>
  );
};

export default SingleMessage;
