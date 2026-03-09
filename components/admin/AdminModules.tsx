"use client";
import { useEffect, useState } from "react";

const ALL_MODULES = [
  { id: "canvas_lms", label: "Canvas LMS", icon: "🎓", desc: "Canvas grade management, AI grading agent, at-risk dashboard" },
];

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  modules: Record<string, boolean>;
};

export default function AdminModules() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/modules")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); });
  }, []);

  const toggle = async (userId: string, module: string, current: boolean) => {
    const key = `${userId}:${module}`;
    setSaving(key);
    const res = await fetch("/api/admin/modules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, module, enabled: !current }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, modules: { ...u.modules, [module]: !current } } : u
        )
      );
    }
    setSaving(null);
  };

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* Module legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {ALL_MODULES.map((m) => (
          <div key={m.id} className="card border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span>{m.icon}</span>
              <span className="font-semibold text-amber-400">{m.label}</span>
            </div>
            <p className="text-xs text-gray-400">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* User × Module matrix */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
              {ALL_MODULES.map((m) => (
                <th key={m.id} className="text-center px-4 py-3 text-gray-400 font-medium">
                  {m.icon} {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.image ? (
                      <img src={user.image} className="w-7 h-7 rounded-full" alt="" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-200">{user.name || "—"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${user.role === "ADMIN" ? "bg-amber-500/20 text-amber-400" : "bg-gray-700 text-gray-300"}`}>
                    {user.role}
                  </span>
                </td>
                {ALL_MODULES.map((m) => {
                  const enabled = user.modules[m.id] ?? false;
                  const key = `${user.id}:${m.id}`;
                  return (
                    <td key={m.id} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(user.id, m.id, enabled)}
                        disabled={saving === key}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          enabled ? "bg-amber-500" : "bg-gray-700"
                        } ${saving === key ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
