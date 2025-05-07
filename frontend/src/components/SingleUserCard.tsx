import React from "react";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";

// Tipas naudotojo propsams
interface User {
  _id: string;
  username: string;
  image: string;
  [key: string]: any; // leidžia papildomus laukus
}

interface Props {
  user: User;
}

const SingleUserCard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const { currentUser } = mainStore();

  return (
    <div
      key={user._id}
      className="bg-white flex items-center justify-start w-full rounded-xl shadow-lg p-4 gap-6 transition hover:shadow-xl"
    >
      {/* Avatar with enforced square ratio and circular crop */}
      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500 shrink-0">
        <img src={user.image} alt={`${user.username}'s avatar`} className="w-full h-full object-cover" />
      </div>

      {/* Username + Message button aligned on opposite sides */}
      <div className="flex flex-col [@media(min-width:300px)]:flex-row justify-between items-start sm:items-center w-full gap-2 sm:gap-0">
        <p className="text-lg sm:text-xl font-medium text-gray-800">{user.username}</p>
        {currentUser && (
          <button
            type="button"
            onClick={() => navigate(`/profile/${user.username}`)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            Message
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleUserCard;
