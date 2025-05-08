import React, { useEffect, useState } from "react";
import http from "../plugins/http";
import mainStore from "../store/mainStore";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

interface User {
  _id: string;
  username: string;
  role: "user" | "admin";
}

interface Conversation {
  _id: string;
  participants: { username: string }[];
  messages: any[];
}

interface Message {
  _id: string;
  message: string;
  sender: { username: string };
  conversation?: { _id: string };
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const { token } = mainStore();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<"users" | "conversations" | "messages">("users");
  const [confirmModal, setConfirmModal] = useState<{ id: string; newRole: "user" | "admin" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; username: string } | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    fetchUsers();
    fetchConversations();
    fetchMessages();
  }, []);

  async function fetchUsers() {
    const res = await http.get("/get-all-users", token);
    if (!res.error) setUsers(res.data.filter((u: User) => u.username.toLowerCase() !== "admin"));
  }

  async function fetchConversations() {
    const res = await http.get("/get-all-conversations", token);
    if (!res.error) setConversations(res.data);
  }

  async function fetchMessages() {
    const res = await http.get("/admin/messages", token);
    if (!res.error) setMessages(res.data);
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
    if (data.success) fetchUsers();
  }

  async function changeRole(id: string, newRole: "user" | "admin") {
    const res = await fetch(`http://localhost:2000/admin/change-role/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (data.success) setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
  }

  function handleDeleteConversation(conversationId: string) {
    if (!window.confirm(lang === "lt" ? "Ar tikrai nori ištrinti pokalbį?" : "Delete this conversation?")) return;
    http.delete(`/admin/conversations/${conversationId}`, token).then((res) => {
      if (!res.error) setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    });
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🛡️ {lang === "lt" ? "Administratoriaus pultas" : "Admin Panel"}
          </h2>
          <div className="flex gap-3">
            {["users", "conversations", "messages"].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab as any)}
                className={`px-4 py-2 rounded ${view === tab ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
              >
                {lang === "lt"
                  ? tab === "users"
                    ? "Vartotojai"
                    : tab === "conversations"
                    ? "Pokalbiai"
                    : "Žinutės"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users View */}
        {view === "users" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <div key={u._id} className="bg-gray-50 border p-5 rounded-xl shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-gray-800">{u.username}</div>
                  {u.role === "admin" && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                      {lang === "lt" ? "Administratorius" : "Admin"}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 break-all">ID: {u._id}</div>
                <label className="text-sm font-medium text-gray-700">{lang === "lt" ? "Vaidmuo" : "Role"}</label>
                <select
                  value={u.role}
                  onChange={(e) => {
                    const selected = e.target.value as "user" | "admin";
                    if (selected === "admin") setConfirmModal({ id: u._id, newRole: selected });
                    else changeRole(u._id, selected);
                  }}
                  className="bg-white border border-gray-300 text-sm rounded px-3 py-1 shadow-sm"
                >
                  <option value="user">{lang === "lt" ? "Vartotojas" : "User"}</option>
                  <option value="admin">{lang === "lt" ? "Administratorius" : "Admin"}</option>
                </select>
                <div className="flex justify-between mt-4 gap-2">
                  <button
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="bg-blue-100 text-blue-700 text-sm px-4 py-1 rounded hover:bg-blue-200 transition"
                  >
                    {lang === "lt" ? "Peržiūrėti profilį" : "View Profile"}
                  </button>
                  {u.role !== "admin" && (
                    <button
                      onClick={() => setDeleteModal({ id: u._id, username: u.username })}
                      className="bg-red-100 text-red-700 text-sm px-4 py-1 rounded hover:bg-red-200 transition"
                    >
                      {lang === "lt" ? "Ištrinti" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversations View */}
        {view === "conversations" && (
          <div className="space-y-4">
            {conversations.map((c) => (
              <div
                key={c._id}
                className="bg-gray-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
              >
                <div>
                  <p className="font-medium text-gray-800">ID: {c._id}</p>
                  <p className="text-sm text-gray-600">
                    {lang === "lt" ? "Dalyviai:" : "Participants:"} {c.participants.map((p) => p.username).join(", ")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {lang === "lt" ? "Žinučių skaičius:" : "Messages:"} {c.messages.length}
                  </p>
                </div>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => navigate(`/conversation/${c._id}`)}
                    className="bg-blue-100 text-blue-700 text-sm px-4 py-1 rounded hover:bg-blue-200 transition"
                  >
                    {lang === "lt" ? "Peržiūrėti pokalbį" : "View Conversation"}
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(c._id)}
                    className="bg-red-100 text-red-700 text-sm px-4 py-1 rounded hover:bg-red-200 transition"
                  >
                    {lang === "lt" ? "Ištrinti pokalbį" : "Delete Conversation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages View */}
        {view === "messages" && (
          <div className="space-y-4">
            {messages.map((msg) => {
              const createdAt = msg.createdAt || new Date(parseInt(msg._id.toString().substring(0, 8), 16) * 1000);
              return (
                <div
                  key={msg._id}
                  className="bg-gray-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
                >
                  {/* Kairė pusė – žinutės informacija */}
                  <div>
                    <p>
                      <strong>{lang === "lt" ? "Siuntėjas" : "Sender"}:</strong> {msg.sender?.username}
                    </p>
                    <p>
                      <strong>{lang === "lt" ? "Žinutė" : "Message"}:</strong> {msg.message}
                    </p>
                    <p>
                      <strong>{lang === "lt" ? "Pokalbis" : "Conversation"}:</strong>{" "}
                      {msg.conversation ? msg.conversation._id : "Public"}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(createdAt).toLocaleString()}</p>
                  </div>

                  {/* Dešinė pusė – mygtukas */}
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === "lt"
                              ? "Ar tikrai nori ištrinti šią žinutę?"
                              : "Are you sure you want to delete this message?"
                          )
                        ) {
                          http.delete(`/admin/messages/${msg._id}`, token).then((res) => {
                            if (!res.error) {
                              setMessages((prev) => prev.filter((m) => m._id !== msg._id));
                            } else {
                              alert(res.message || "Failed to delete.");
                            }
                          });
                        }
                      }}
                      className="bg-red-100 text-red-700 text-sm px-4 py-1 rounded hover:bg-red-200 transition"
                    >
                      {lang === "lt" ? "Ištrinti žinutę" : "Delete Message"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
