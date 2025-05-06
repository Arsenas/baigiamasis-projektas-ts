import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import mainStore from "../store/mainStore";

// Tipas vartotojui
interface User {
  _id: string;
  username: string;
  role: "user" | "admin";
  token?: string;
}

const AdminPanel: React.FC = () => {
  const { currentUser, token } = mainStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await http.get("/get-all-users", token);
      if (!res.error) {
        setUsers(res.data);
      } else {
        console.error(res.message);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const res = await fetch(`http://localhost:2000/admin/delete-user/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (data.success) {
      alert("User deleted");
      fetchUsers();
    } else {
      alert("Failed to delete: " + data.message);
    }
  }

  async function changeRole(id: string, newRole: "user" | "admin") {
    try {
      const res = await fetch(`http://localhost:2000/admin/change-role/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
      } else {
        alert("Failed to change role: " + data.message);
      }
    } catch (err) {
      console.error("❌ Error changing role:", err);
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Admin Panel: Users</h2>
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Username</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td className="border p-2">{u.username}</td>
              <td className="border p-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u._id, e.target.value as "user" | "admin")}
                  className="border rounded px-2 py-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="border p-2">
                {u.role !== "admin" && (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
