"use client";
import { useEffect, useState } from "react";
import { Building2, Check, Shield } from "lucide-react";

const MSBIZ_PERMISSION_GROUPS: Record<string, string[]> = {
  Orders:        ["orders.view","orders.create","orders.edit","orders.delete"],
  "Price Match": ["pm.view","pm.manage","pm.approve"],
  Warehouse:     ["warehouse.view","warehouse.manage"],
  Inbound:       ["inbound.view","inbound.create","inbound.receive"],
  Outbound:      ["outbound.view","outbound.create"],
  Invoices:      ["invoices.view","invoices.manage","invoices.qb_sync"],
  Tracking:      ["tracking.view"],
  Exceptions:    ["exceptions.view","exceptions.create","exceptions.resolve"],
  Costs:         ["costs.view","costs.manage"],
  Accounts:      ["accounts.view","accounts.manage"],
  Addresses:     ["addresses.view","addresses.manage"],
  Admin:         ["admin.users","admin.invites","admin.addresses"],
};

const ALL_MSBIZ_PERMS = Object.values(MSBIZ_PERMISSION_GROUPS).flat();

const MSBIZ_PRESETS: Record<string, Set<string>> = {
  viewer:   new Set(ALL_MSBIZ_PERMS.filter(p => p.endsWith(".view"))),
  operator: new Set(["orders.view","orders.create","orders.edit","pm.view","pm.manage","warehouse.view","inbound.view","inbound.create","inbound.receive","outbound.view","outbound.create","exceptions.view","exceptions.create","tracking.view","costs.view","accounts.view","addresses.view","invoices.view"]),
  admin:    new Set(ALL_MSBIZ_PERMS),
};

interface MsbizDialog {
  user: User;
  perms: Record<string, boolean>;
  role: string;
  enabled: boolean;
  saving: boolean;
}

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
  const [msbizDialog, setMsbizDialog] = useState<MsbizDialog | null>(null);

  const openMsbizDialog = async (user: User) => {
    // Fetch current msbiz state for this user
    const [modRes, permRes] = await Promise.all([
      fetch(`/api/admin/modules`).then(r => r.json()),
      fetch(`/api/msbiz/admin/users`).then(r => r.json()),
    ]);
    const userMod = (modRes.users ?? []).find((u: { id: string; modules: Record<string, boolean> }) => u.id === user.id);
    const msbizEnabled = userMod?.modules?.msbiz ?? false;
    const msbizUser = (permRes.users ?? []).find((u: { id: string }) => u.id === user.id);
    const perms = msbizUser?.permissions ?? Object.fromEntries(ALL_MSBIZ_PERMS.map(p => [p, false]));
    setMsbizDialog({ user, perms, role: msbizUser?.role_name ?? "operator", enabled: msbizEnabled, saving: false });
  };

  const saveMsbizPerms = async () => {
    if (!msbizDialog) return;
    setMsbizDialog(d => d ? { ...d, saving: true } : null);

    // 1. Toggle module enable/disable in user_modules table
    await fetch("/api/admin/modules", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: msbizDialog.user.id, module: "msbiz", enabled: msbizDialog.enabled }),
    });

    // 2. Always upsert permissions (enabled or disabled — so state is preserved for re-enable)
    await fetch(`/api/msbiz/admin/users/${msbizDialog.user.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: msbizDialog.perms, role_name: msbizDialog.role }),
    });

    setMsbizDialog(null);
    await fetchUsers();
  };

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

      {/* MS Business permissions dialog */}
      {msbizDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">MS Business Access</h3>
                  <p className="text-xs text-gray-500 truncate">{msbizDialog.user.name ?? msbizDialog.user.email}</p>
                </div>
              </div>
              <button onClick={() => setMsbizDialog(null)} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center text-lg">✕</button>
            </div>

            {/* Enable toggle */}
            <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Module Access</p>
                <p className="text-xs text-gray-500">Enable or disable the MS Business module for this user</p>
              </div>
              <button onClick={() => setMsbizDialog(d => d ? { ...d, enabled: !d.enabled } : null)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${msbizDialog.enabled ? "bg-amber-500" : "bg-gray-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${msbizDialog.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {msbizDialog.enabled && (
              <>
                {/* Role presets */}
                <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3">
                  <Shield className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-500 mr-1">Preset:</span>
                  {["viewer","operator","admin"].map(preset => (
                    <button key={preset} onClick={() => setMsbizDialog(d => d ? {
                      ...d,
                      role: preset,
                      perms: Object.fromEntries(ALL_MSBIZ_PERMS.map(p => [p, MSBIZ_PRESETS[preset].has(p)])),
                    } : null)}
                      className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors border ${
                        msbizDialog.role === preset
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
                      }`}>
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Permission flags */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {Object.entries(MSBIZ_PERMISSION_GROUPS).map(([group, flags]) => (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{group}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {flags.map(flag => (
                          <label key={flag} className="flex items-center gap-2.5 cursor-pointer group">
                            <button onClick={() => setMsbizDialog(d => d ? { ...d, perms: { ...d.perms, [flag]: !d.perms[flag] } } : null)}
                              className={`w-4.5 h-4.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                msbizDialog.perms[flag]
                                  ? "bg-amber-500 border-amber-500"
                                  : "bg-gray-800 border-gray-600 group-hover:border-gray-500"
                              }`}>
                              {msbizDialog.perms[flag] && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className="text-xs text-gray-400 font-mono group-hover:text-gray-300">{flag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
              <button onClick={() => setMsbizDialog(null)} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={saveMsbizPerms} disabled={msbizDialog.saving}
                className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
                {msbizDialog.saving ? "Saving…" : "Save Changes"}
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
                <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                  <span className="truncate">{user.email}</span>
                  <span className="shrink-0 text-amber-500/60 font-mono">⊙ {(user.credits ?? 0).toFixed(1)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => openMsbizDialog(user)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-700/30 hover:border-amber-500/50 text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <Building2 className="w-3 h-3" /> MS Biz
                </button>
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
