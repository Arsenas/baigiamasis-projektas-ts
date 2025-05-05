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
    <div key={user._id} className="bg-white flex items-center w-full rounded shadow-lg gap-3 p-3">
      <img src={user.image} className="w-36 h-36 rounded-full" alt="" />
      <div className="flex flex-col gap-3">
        <p className="mt-2 text-start text-gray-600 text-xl">{user.username}</p>
        {currentUser && (
          <button
            type="button"
            onClick={() => navigate(`/profile/${user.username}`)}
            className="text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          >
            Message
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleUserCard;
