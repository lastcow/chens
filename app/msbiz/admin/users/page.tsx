"use client";
import { useEffect, useState } from "react";
import { Users, Shield, Mail, RefreshCw, X, Check } from "lucide-react";

interface User {
  id: string; email: string; name: string | null; permissions: Record<string, boolean>;
  role: string | null; joined_at: string;
}

const PERMISSION_GROUPS = {
  Orders:         ["orders.view","orders.create","orders.edit","orders.delete"],
  "Price Match":  ["pm.view","pm.manage","pm.approve"],
  Warehouse:      ["warehouse.view","warehouse.manage"],
  Inbound:        ["inbound.view","inbound.create","inbound.receive"],
  Outbound:       ["outbound.view","outbound.create"],
  Invoices:       ["invoices.view","invoices.manage","invoices.qb_sync"],
  Tracking:       ["tracking.view"],
  Exceptions:     ["exceptions.view","exceptions.create","exceptions.resolve"],
  Costs:          ["costs.view","costs.manage"],
  Admin:          ["admin.users","admin.invites","admin.addresses"],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState("");

  useEffect(() => {
    fetch("/api/msbiz/admin/users")
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openEdit = (user: User) => {
    setEditUser(user);
    setPerms({ ...user.permissions });
  };

  const savePerms = async () => {
    if (!editUser) return;
    setSaving(true);
    await fetch(`/api/msbiz/admin/users/${editUser.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: perms }),
    });
    setSaving(false);
    setEditUser(null);
    const res = await fetch("/api/msbiz/admin/users");
    const d = await res.json();
    setUsers(d.users ?? []);
  };

  const revoke = async (userId: string) => {
    await fetch(`/api/msbiz/admin/users/${userId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoke: true }),
    });
    setRevoking("");
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const applyPreset = (preset: string) => {
    const allFlat = Object.values(PERMISSION_GROUPS).flat();
    if (preset === "viewer") {
      const viewOnly = allFlat.filter(p => p.endsWith(".view"));
      setPerms(Object.fromEntries(allFlat.map(p => [p, viewOnly.includes(p)])));
    } else if (preset === "pmer") {
      const pmerSet = new Set(["orders.view","accounts.view","pm.view","pm.manage","price_match.view","price_match.manage","exceptions.view"]);
      setPerms(Object.fromEntries(allFlat.map(p => [p, pmerSet.has(p)])));
    } else if (preset === "operator") {
      const ops = new Set(["orders.view","orders.create","orders.edit","pm.view","pm.manage","warehouse.view","inbound.view","inbound.create","inbound.receive","outbound.view","outbound.create","exceptions.view","exceptions.create","tracking.view","costs.view"]);
      setPerms(Object.fromEntries(allFlat.map(p => [p, ops.has(p)])));
    } else if (preset === "admin") {
      setPerms(Object.fromEntries(allFlat.map(p => [p, true])));
    } else if (preset === "customer") {
      const customerSet = new Set(["accounts.view","orders.view","orders.create","invoices.view","exceptions.view","tracking.view"]);
      setPerms(Object.fromEntries(allFlat.map(p => [p, customerSet.has(p)])));
    } else if (preset === "warehouse") {
      const warehouseSet = new Set(["warehouse.view","inbound.view","inbound.create","inbound.receive","outbound.view","outbound.create","exceptions.view","exceptions.create","tracking.view"]);
      setPerms(Object.fromEntries(allFlat.map(p => [p, warehouseSet.has(p)])));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" /> Users</h2>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-10 animate-pulse">Loading…</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-center px-3 py-3">Role</th>
                <th className="text-center px-3 py-3">Permissions</th>
                <th className="text-center px-3 py-3">Joined</th>
                <th className="text-center px-3 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map(user => {
                const permCount = Object.values(user.permissions).filter(Boolean).length;
                const totalPerms = Object.values(PERMISSION_GROUPS).flat().length;
                return (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-white text-sm">{user.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-700/20 capitalize">
                        {user.role || "member"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-xs text-gray-400 font-mono">{permCount}/{totalPerms}</div>
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full mx-auto mt-1">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(permCount/totalPerms)*100}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500 font-mono">
                      {new Date(user.joined_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit" })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(user)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs transition-colors">
                          <Shield className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setRevoking(user.id)}
                          className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit permissions modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Permissions</h2>
                <p className="text-xs text-gray-500 mt-0.5">{editUser.name || editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>

            {/* Presets */}
            <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Preset:</span>
              {["customer","viewer","pmer","warehouse","operator","admin"].map(p => (
                <button key={p} onClick={() => applyPreset(p)}
                  className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-xs capitalize transition-colors">
                  {p}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {Object.entries(PERMISSION_GROUPS).map(([group, flags]) => (
                <div key={group}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {flags.map(flag => (
                      <label key={flag} className="flex items-center gap-2.5 cursor-pointer group">
                        <button onClick={() => setPerms(p => ({ ...p, [flag]: !p[flag] }))}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                            perms[flag]
                              ? "bg-amber-500 border-amber-500"
                              : "bg-gray-800 border-gray-600 group-hover:border-gray-500"
                          }`}>
                          {perms[flag] && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-xs text-gray-400 font-mono group-hover:text-gray-300 transition-colors">{flag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={savePerms} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {revoking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Revoke Access?</h3>
            <p className="text-sm text-gray-400 mb-6">This user will lose all msbiz permissions immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setRevoking("")} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => revoke(revoking)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium">Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
