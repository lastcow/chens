"use client";
import { useEffect, useState, useCallback } from "react";
import { UserCircle, Plus, Search, Edit2, Eye, EyeOff, X, Copy, Check, MoreHorizontal } from "lucide-react";

interface Account {
  id: string; email: string; display_name: string | null;
  status: string; notes: string | null; last_used_at: string | null; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-900/30 text-green-400 border-green-700/30",
  inactive: "bg-gray-800 text-gray-500 border-gray-700",
  suspended:"bg-red-900/30 text-red-400 border-red-700/30",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/msbiz/accounts");
    const d = await res.json();
    setAccounts(d.accounts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const doDelete = async (id: string) => {
    await fetch(`/api/msbiz/accounts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchAccounts();
  };

  const filtered = accounts.filter(a =>
    !search ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.display_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">MS Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
      </div>

      {/* Account cards */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No accounts found.</p>
          <p className="text-gray-600 text-xs mt-1">Add a Microsoft account to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(acc => (
            <div key={acc.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    {acc.display_name && (
                      <div className="font-medium text-white text-sm">{acc.display_name}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono truncate">{acc.email}</span>
                      <button onClick={() => copyEmail(acc.email, acc.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all">
                        {copiedId === acc.id
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {acc.notes && <p className="text-[10px] text-gray-600 mt-0.5 truncate max-w-sm">{acc.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[acc.status] ?? ""}`}>
                    {acc.status}
                  </span>
                  {acc.last_used_at && (
                    <span className="text-[10px] text-gray-600 font-mono hidden sm:block">
                      {new Date(acc.last_used_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditId(acc.id); setShowForm(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingId(acc.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AccountForm
          accountId={editId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 mb-6">The credentials will be permanently removed. Any orders linked to this account will remain.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => doDelete(deletingId)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountForm({ accountId, onClose, onSaved }: { accountId: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", display_name: "", status: "active", notes: "",
  });

  useEffect(() => {
    if (!accountId) return;
    fetch(`/api/msbiz/accounts/${accountId}`)
      .then(r => r.json())
      .then(d => {
        if (d.account) {
          const a = d.account;
          setForm({ email: a.email, password: "", display_name: a.display_name ?? "", status: a.status, notes: a.notes ?? "" });
        }
      });
  }, [accountId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.email) { setError("Email is required"); return; }
    if (!accountId && !form.password) { setError("Password is required"); return; }
    setSaving(true); setError("");

    const body: Record<string, string> = {
      email: form.email, display_name: form.display_name, status: form.status, notes: form.notes,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(accountId ? `/api/msbiz/accounts/${accountId}` : "/api/msbiz/accounts", {
      method: accountId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) { onSaved(); } else {
      const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{accountId ? "Edit Account" : "Add Account"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Display Name</label>
            <input value={form.display_name} onChange={e => set("display_name", e.target.value)}
              placeholder="e.g., Main Business Account"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Email *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Password {accountId && <span className="text-gray-600 normal-case font-normal">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 pr-10 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">Stored encrypted with AES-256-GCM.</p>
          </div>

          {accountId && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              placeholder="Any relevant info about this account…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : accountId ? "Update Account" : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
