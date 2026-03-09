"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  suspended: boolean;
  oauth_provider: string | null;
  createdAt: string;
  image?: string | null;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (user: User) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change ${user.email} role to ${newRole}?`)) return;
    setActing(user.id + "-role");
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchUsers();
    setActing(null);
  };

  const toggleSuspend = async (user: User) => {
    const action = user.suspended ? "unsuspend" : "suspend";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;
    setActing(user.id + "-suspend");
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !user.suspended }),
    });
    await fetchUsers();
    setActing(null);
  };

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) ||
           (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
        />
        <span className="text-xs text-gray-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-8 text-center">Loading users…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className={`card flex items-center gap-4 py-3 px-4 ${user.suspended ? "opacity-50" : ""}`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0 overflow-hidden">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.name?.[0] ?? user.email[0]).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{user.name ?? "—"}</span>
                  {user.suspended && (
                    <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/30 rounded px-1.5 py-0.5">Suspended</span>
                  )}
                  {user.oauth_provider && (
                    <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30 rounded px-1.5 py-0.5">
                      {user.oauth_provider}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>

              {/* Role badge */}
              <span className={`text-xs font-mono px-2 py-1 rounded border shrink-0 ${
                user.role === "ADMIN"
                  ? "bg-amber-900/30 text-amber-400 border-amber-700/30"
                  : "bg-gray-800 text-gray-400 border-gray-700"
              }`}>
                {user.role}
              </span>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleRole(user)}
                  disabled={!!acting}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:border-amber-500/50 hover:text-amber-400 text-gray-400 transition-colors disabled:opacity-40"
                >
                  {acting === user.id + "-role" ? "…" : user.role === "ADMIN" ? "→ USER" : "→ ADMIN"}
                </button>
                <button
                  onClick={() => toggleSuspend(user)}
                  disabled={!!acting}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    user.suspended
                      ? "border-green-700/40 text-green-400 hover:border-green-500"
                      : "border-red-700/40 text-red-400 hover:border-red-500"
                  }`}
                >
                  {acting === user.id + "-suspend" ? "…" : user.suspended ? "Unsuspend" : "Suspend"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
