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
  credits?: number;
}

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface CreditDialog {
  user: User;
}

interface RoleDialog {
  user: User;
  selectedRole: "USER" | "ADMIN";
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<ConfirmDialog | null>(null);
  const [creditDialog, setCreditDialog] = useState<CreditDialog | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditToast, setCreditToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [roleDialog, setRoleDialog] = useState<RoleDialog | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const showConfirm = (opts: ConfirmDialog) => setDialog(opts);
  const closeDialog = () => setDialog(null);

  const openRoleDialog = (user: User) => {
    setRoleDialog({ user, selectedRole: user.role });
  };

  const submitRole = async () => {
    if (!roleDialog) return;
    const { user, selectedRole } = roleDialog;
    if (selectedRole === user.role) { setRoleDialog(null); return; }
    setRoleDialog(null);
    setActing(user.id + "-role");
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole }),
    });
    await fetchUsers();
    setActing(null);
  };

  const toggleSuspend = (user: User) => {
    const action = user.suspended ? "unsuspend" : "suspend";
    showConfirm({
      title: action.charAt(0).toUpperCase() + action.slice(1) + " User",
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      danger: !user.suspended,
      onConfirm: async () => {
        closeDialog();
        setActing(user.id + "-suspend");
        await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suspended: !user.suspended }),
        });
        await fetchUsers();
        setActing(null);
      },
    });
  };

  const openCreditDialog = (user: User) => {
    setCreditAmount("");
    setCreditNote("");
    setCreditDialog({ user });
  };

  const submitCredit = async () => {
    if (!creditDialog) return;
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0) return;
    setCreditLoading(true);
    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_user_id: creditDialog.user.id,
        amount,
        description: creditNote.trim() || `System credit grant`,
      }),
    });
    const d = await res.json();
    setCreditLoading(false);
    setCreditDialog(null);
    if (res.ok) {
      setCreditToast({ msg: `✅ ${amount} tokens added to ${creditDialog.user.email} (balance: ${d.balance_after?.toFixed(1)})`, ok: true });
    } else {
      setCreditToast({ msg: `❌ Failed: ${d.error ?? "Unknown error"}`, ok: false });
    }
    setTimeout(() => setCreditToast(null), 4000);
  };

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) ||
           (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {creditToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg
          ${creditToast.ok ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {creditToast.msg}
        </div>
      )}

      {/* Add Credit dialog */}
      {creditDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div>
              <h3 className="font-semibold text-white">Add Token Credits</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{creditDialog.user.email}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount (credits)</label>
                <input
                  type="number" min="1" step="1"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={e => setCreditNote(e.target.value)}
                  placeholder="Reason for credit…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 flex gap-2">
              <span className="text-amber-400 shrink-0">⚠️</span>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Make sure you have the <strong>right amount and right user</strong> before confirming. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={submitCredit}
                disabled={creditLoading || !creditAmount || parseFloat(creditAmount) <= 0}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-40"
              >
                {creditLoading ? "Adding…" : `Add ${creditAmount || "?"} tokens`}
              </button>
              <button onClick={() => setCreditDialog(null)} className="btn-secondary flex-1 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role dialog */}
      {roleDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div>
              <h3 className="font-semibold text-white">Change Role</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{roleDialog.user.email}</p>
            </div>
            <div className="space-y-2">
              {(["USER", "ADMIN"] as const).map(role => (
                <label key={role} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  roleDialog.selectedRole === role
                    ? role === "ADMIN" ? "border-amber-500/50 bg-amber-500/10" : "border-gray-600 bg-gray-800"
                    : "border-gray-800 hover:border-gray-700"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={roleDialog.selectedRole === role}
                    onChange={() => setRoleDialog(prev => prev ? { ...prev, selectedRole: role } : null)}
                    className="accent-amber-500"
                  />
                  <div>
                    <p className={`text-sm font-medium ${role === "ADMIN" ? "text-amber-400" : "text-gray-300"}`}>{role}</p>
                    <p className="text-xs text-gray-500">{role === "ADMIN" ? "Full admin access" : "Standard user access"}</p>
                  </div>
                  {roleDialog.user.role === role && (
                    <span className="ml-auto text-xs text-gray-500">current</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={submitRole}
                disabled={roleDialog.selectedRole === roleDialog.user.role}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-40"
              >
                Confirm
              </button>
              <button onClick={() => setRoleDialog(null)} className="btn-secondary flex-1 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom confirm dialog */}
      {dialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-white">{dialog.title}</h3>
            <p className="text-sm text-gray-400">{dialog.message}</p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={dialog.onConfirm}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                  dialog.danger
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "btn-primary"
                }`}
              >
                {dialog.confirmLabel}
              </button>
              <button
                onClick={closeDialog}
                className="flex-1 py-2 text-sm btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    user.role === "ADMIN"
                      ? "bg-amber-900/30 text-amber-400 border-amber-700/30"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  }`}>
                    {user.role}
                  </span>
                  {user.suspended && (
                    <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/30 rounded px-1.5 py-0.5">Suspended</span>
                  )}
                  {user.oauth_provider && (
                    <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30 rounded px-1.5 py-0.5">
                      {user.oauth_provider}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="truncate">{user.email}</span>
                  <span className="shrink-0 text-amber-500/70">⊙ {(user.credits ?? 0).toFixed(1)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openCreditDialog(user)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-purple-700/40 hover:border-purple-500/60 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ⊙ Credits
                </button>
                <button
                  onClick={() => openRoleDialog(user)}
                  disabled={!!acting}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:border-amber-500/50 hover:text-amber-400 text-gray-400 transition-colors disabled:opacity-40"
                >
                  {acting === user.id + "-role" ? "…" : user.role === "ADMIN" ? "Demote" : "Promote"}
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
