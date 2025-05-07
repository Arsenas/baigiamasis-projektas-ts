import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import SingleUserCard from "../components/SingleUserCard";

// User tipo apibrėžimas
interface User {
  _id: string;
  username: string;
  image: string;
}

// Pagrindinis komponentas visiems vartotojams atvaizduoti
const Homepage: React.FC = () => {
  const { currentUser, setCurrentUser } = mainStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  // Prisijungiam prie socket.io kai puslapis užsikrauna
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
    setSocket(newSocket);

    // Kito vartotojo profilio nuotraukos atnaujinimas
    newSocket.on("profileUpdated", (data: { userId: string; image: string }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === data.userId ? { ...user, image: data.image } : user))
      );
    });

    // Nauji registruoti vartotojai
    newSocket.on("registeredUsers", (users: User[]) => {
      const filtered = users.filter((u) => u.username !== currentUser?.username);
      setUsers(filtered);
    });

    // Ištrinti vartotojai
    newSocket.on("deletedAcc", (users: User[]) => {
      const filtered = users.filter((u) => u.username !== currentUser?.username);
      setUsers(filtered);
    });

    return () => {
      newSocket.close();
    }; // Socketo uždarymas kai komponentas sunaikinamas
  }, []);

  // Duomenų užkrovimas iš serverio
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await http.get("/get-all-users");

        if (!res.error) {
          let otherUsers: User[] = res.data.filter((u: User) => u.username.toLowerCase() !== "admin");

          if (currentUser) {
            otherUsers = otherUsers.filter((user) => user.username !== currentUser.username);
          }

          setUsers(otherUsers);
        } else {
          setError(res.message || "Serverio klaida");
        }
      } catch (err) {
        setError("Nepavyko gauti vartotojų duomenų");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`flex flex-col gap-3 relative`}>
      {/* Turinys ant viršaus */}
      <div className="flex flex-col w-full absolute top-[70px] px-8">
        <div className="w-full max-w-[1400px] mx-auto bg-white p-6 rounded-2xl">
          <div className="bg-white mt-5 p-5 flex shadow-2xl">
            <p className="font-semibold text-gray-600 rounded-2xl text-2xl">Registered Users:</p>
          </div>

          {/* Kiekvienas vartotojas atvaizduojamas per komponentą */}
          <div className="mt-5 grid gap-6 w-full grid-cols-1 xs:grid-cols-2 xxl:grid-cols-3">
            {Array.isArray(users) &&
              users.map((user) => (
                <div key={user._id} className="w-full">
                  <SingleUserCard user={user} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
