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

  const isCurrentUser = message.sender?._id === currentUser?._id;
  const likedCount = message.liked?.length ?? 0;

  const containerAlign = isCurrentUser ? "items-end" : "items-start";
  const messageAlign = isCurrentUser ? "justify-end" : "justify-start";
  const bubbleColor = isCurrentUser ? "bg-indigo-200" : "bg-blue-50";
  const textAlign = isCurrentUser ? "text-end me-10" : "text-start ms-10";

  return (
    <div className={`mt-3 flex flex-col gap-1 ${containerAlign}`}>
      <div className={`flex w-full gap-2 ${messageAlign}`}>
        {!isCurrentUser && (
          <img className="w-10 h-10 rounded-full bg-white shadow-md" src={message.sender?.image} alt="sender avatar" />
        )}

        <div className="flex flex-col max-w-[70%]">
          <p className="text-gray-400 text-sm">{message.sender?.username}</p>
          <div className={`relative px-5 py-2 rounded-3xl text-gray-900 ${bubbleColor}`}>
            {message.message}
            {typeof message._id === "string" &&
              (() => {
                const id = message._id;
                return (
                  <svg
                    onClick={() => handleLikeMessage(id)}
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
                );
              })()}
          </div>
        </div>

        {isCurrentUser && (
          <img className="w-10 h-10 rounded-full bg-white shadow-md" src={message.sender?.image} alt="your avatar" />
        )}
      </div>

      <p className={`text-xs text-gray-400 ${textAlign}`}>{message.timestamp}</p>
    </div>
  );
};

export default SingleMessage;
