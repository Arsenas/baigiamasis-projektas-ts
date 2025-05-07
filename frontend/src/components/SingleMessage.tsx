import React from "react";
import mainStore from "../store/mainStore";
import type { Message } from "../types";

interface Props {
  message: Message;
  handleLikeMessage: (id: string) => void;
  participants?: any[];
}

const SingleMessage: React.FC<Props> = ({ message, handleLikeMessage }) => {
  const { currentUser } = mainStore();

  const isCurrentUser = currentUser?._id === message.sender._id;
  const likedCount = message.liked?.length ?? 0;

  const bubbleClasses = isCurrentUser ? "bg-indigo-200 justify-end text-end" : "bg-blue-50 justify-start text-start";
  const alignItems = isCurrentUser ? "items-end" : "items-start";
  const timeAlign = isCurrentUser ? "text-end me-10" : "text-start ms-10";

  return (
    <div className={`mt-3 flex flex-col gap-1 ${alignItems}`}>
      <div className={`flex gap-2 w-full ${isCurrentUser ? "justify-end" : ""}`}>
        {!isCurrentUser && (
          <img className="w-12 h-12 rounded-full p-0.5 bg-white" src={message.sender.image} alt="sender avatar" />
        )}

        <div className="flex flex-col max-w-[70%]">
          <div className="text-gray-400 text-sm">{message.sender.username}</div>
          <div className={`flex items-center py-2 px-5 rounded-3xl relative ${bubbleClasses}`}>
            {message.message}

            {message._id && (
              <svg
                onClick={() => handleLikeMessage(message._id!)}
                xmlns="http://www.w3.org/2000/svg"
                fill={likedCount > 0 ? "pink" : "none"}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={`size-4 cursor-pointer absolute bottom-0 -left-1 ${
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
          <img className="w-12 h-12 rounded-full p-0.5 bg-white" src={message.sender.image} alt="your avatar" />
        )}
      </div>

      <p className={`text-xs text-gray-300 ${timeAlign}`}>{message.timestamp}</p>
    </div>
  );
};

export default SingleMessage;
