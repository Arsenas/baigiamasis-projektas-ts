import React from "react";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      key={user._id}
      className="bg-white flex flex-col sm:flex-row items-center justify-between w-full rounded-2xl shadow-lg p-5 gap-4 hover:shadow-xl transition duration-300"
    >
      {/* Avatar and Username */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm shrink-0">
          <img src={user.image} alt={`${user.username}'s avatar`} className="w-full h-full object-cover" />
        </div>
        <p className="text-xl font-semibold text-gray-800">{user.username}</p>
      </div>

      {/* Divider for small screens */}
      <hr className="sm:hidden w-full border-gray-200" />

      {/* Message button */}
      {currentUser && (
        <button
          type="button"
          onClick={() => navigate(`/profile/${user.username}`)}
          className={`font-medium rounded-full text-sm px-5 py-2.5 transition ${
            isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          Message
        </button>
      )}
    </div>
  );
};

export default SingleUserCard;
