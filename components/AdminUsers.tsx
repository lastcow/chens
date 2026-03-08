"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  };

  if (loading) return <div className="text-gray-400">Loading users...</div>;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Users ({users.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-3 pr-4">Name</th>
              <th className="text-left py-3 pr-4">Email</th>
              <th className="text-left py-3 pr-4">Role</th>
              <th className="text-left py-3 pr-4">Joined</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-3 pr-4">{user.name || "—"}</td>
                <td className="py-3 pr-4 text-gray-300">{user.email}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-amber-400 hover:text-amber-300 text-xs"
                    >
                      {user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
