import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState<{ id: string; newRole: "user" | "admin" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await http.get("/get-all-users", token);
      if (!res.error) {
        const filtered = res.data.filter((u: User) => u.username.toLowerCase() !== "admin");
        setUsers(filtered);
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
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          🛡️ Admin Panel <span className="text-sm text-gray-500">({users.length} users)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div key={u._id} className="bg-gray-50 border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-gray-800">{u.username}</div>
                {u.role === "admin" && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">Admin</span>
                )}
              </div>

              <div className="text-sm text-gray-500 break-all">ID: {u._id}</div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={u.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value as "user" | "admin";
                    if (selectedRole === "admin") {
                      setConfirmModal({ id: u._id, newRole: selectedRole });
                    } else {
                      changeRole(u._id, selectedRole);
                    }
                  }}
                  className="bg-white border border-gray-300 text-sm rounded px-3 py-1 shadow-sm focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-between mt-4 gap-2">
                <button
                  onClick={() => navigate(`/profile/${u.username}`)}
                  className="bg-blue-100 text-blue-700 text-sm px-4 py-1 rounded hover:bg-blue-200 transition"
                >
                  View Profile
                </button>

                {u.role !== "admin" && (
                  <button
                    onClick={() => setDeleteModal({ id: u._id, username: u.username })}
                    className="bg-red-100 text-red-700 text-sm px-4 py-1 rounded hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {confirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Are you sure you want to promote this user to Admin?
              </h3>
              <p className="text-sm text-gray-600 mb-6">This user will have full administrative permissions.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    if (confirmModal) {
                      changeRole(confirmModal.id, confirmModal.newRole);
                      setConfirmModal(null);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Are you sure you want to delete <span className="text-red-600">{deleteModal.username}</span>?
              </h3>
              <p className="text-sm text-gray-600 mb-6">This user account will be permanently removed.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    deleteUser(deleteModal.id);
                    setDeleteModal(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
