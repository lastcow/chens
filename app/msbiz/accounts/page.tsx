"use client";
import { useEffect, useState, useCallback } from "react";
import {
  UserCircle, Plus, Search, Edit2, Trash2, X, Eye, EyeOff,
  Copy, Check, DollarSign, Link2, Package, User, Save,
} from "lucide-react";

interface Account {
  id: string; email: string; display_name: string | null; password?: string;
  status: string; notes: string | null; balance: number;
  owner_id: string | null; owner_name: string | null; owner_email: string | null;
  order_ids: string[]; last_used_at: string | null; created_at: string;
}

interface Order { id: string; ms_order_number: string; status: string; }

const STATUS_COLORS: Record<string, string> = {
  Ready:     "bg-green-900/30 text-green-400 border-green-700/30",
  Suspended: "bg-red-900/30 text-red-400 border-red-700/30",
  Topup:     "bg-amber-900/30 text-amber-400 border-amber-700/30",
  Error:     "bg-red-900/50 text-red-300 border-red-600/40",
  Hold:      "bg-gray-800 text-gray-400 border-gray-700",
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />)}
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
              <div className="flex items-start justify-between gap-4">
                {/* Left: avatar + info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {acc.display_name && <span className="font-medium text-white text-sm">{acc.display_name}</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[acc.status] ?? "bg-gray-800 text-gray-500 border-gray-700"}`}>
                        {acc.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs text-gray-400 font-mono">{acc.email}</span>
                      <button onClick={() => copyEmail(acc.email, acc.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all">
                        {copiedId === acc.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {acc.password && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono text-gray-400 select-all">{acc.password}</span>
                        <button onClick={() => { navigator.clipboard.writeText(acc.password!); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-gray-500 flex-wrap">
                      {/* Balance */}
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5 text-green-500" />
                        <span className="font-mono font-medium text-green-400">${Number(acc.balance ?? 0).toFixed(2)}</span>
                      </span>
                      {/* Owner */}
                      {(acc.owner_name || acc.owner_email) && (
                        <span className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-blue-400" />
                          <span className="text-blue-300">{acc.owner_name || acc.owner_email}</span>
                        </span>
                      )}
                      {/* Orders */}
                      {acc.order_ids?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-2.5 h-2.5 text-purple-400" />
                          <span className="text-purple-300">{acc.order_ids.length} order{acc.order_ids.length !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                      {/* Notes */}
                      {acc.notes && <span className="truncate max-w-48 text-gray-600">{acc.notes}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setEditId(acc.id); setShowForm(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(acc.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AccountForm accountId={editId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }} />
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 mb-6">Credentials will be permanently removed. Linked orders will not be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={() => doDelete(deletingId)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    email: "", password: "", display_name: "", status: "Ready",
    notes: "", balance: "", order_ids: [] as string[],
  });

  useEffect(() => {
    if (!accountId) return;
    // Fetch orders for linking (edit only)
    fetch("/api/msbiz/orders?limit=200").then(r => r.json()).then(d => setOrders(d.orders ?? [])).catch(() => {});
    fetch(`/api/msbiz/accounts/${accountId}`)
      .then(r => r.json())
      .then(d => {
        if (d.account) {
          const a = d.account;
          setForm({
            email: a.email, password: a.password ?? "",
            display_name: a.display_name ?? "", status: a.status ?? "Ready",
            notes: a.notes ?? "", balance: a.balance != null ? String(a.balance) : "0",
            order_ids: a.order_ids ?? [],
          });
        }
      });
  }, [accountId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleOrder = (id: string) => {
    setForm(f => ({
      ...f,
      order_ids: f.order_ids.includes(id)
        ? f.order_ids.filter(o => o !== id)
        : [...f.order_ids, id],
    }));
  };

  const submit = async () => {
    if (!form.email) { setError("Email is required"); return; }
    if (!accountId && !form.password) { setError("Password is required"); return; }
    setSaving(true); setError("");

    const body: Record<string, unknown> = {
      email: form.email, display_name: form.display_name || null,
      status: form.status, notes: form.notes || null,
      balance: parseFloat(form.balance) || 0,
      order_ids: form.order_ids,
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
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">{accountId ? "Edit Account" : "Add Account"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Display name */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Display Name</label>
            <input value={form.display_name} onChange={e => set("display_name", e.target.value)}
              placeholder="e.g., Main Business Account"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Password {accountId && <span className="text-gray-600 normal-case font-normal text-[10px]">(blank = keep)</span>}
              </label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 pr-9 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Balance + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Balance ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.balance}
                  onChange={e => {
                    // only allow numbers and decimal point, no arrows
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    set("balance", v);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {["Ready","Suspended","Topup","Error","Hold"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked orders — edit only */}
          {accountId && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Linked Orders
                {form.order_ids.length > 0 && <span className="ml-1 text-amber-400 font-mono">[{form.order_ids.length}]</span>}
              </label>
              {orders.length === 0 ? (
                <p className="text-xs text-gray-600">No orders available.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 border border-gray-700 rounded-lg p-2 bg-gray-800/50">
                  {orders.map(o => (
                    <label key={o.id} className="flex items-center gap-2.5 cursor-pointer group px-1 py-1 rounded hover:bg-gray-700/40 transition-colors">
                      <div onClick={() => toggleOrder(o.id)}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          form.order_ids.includes(o.id)
                            ? "bg-amber-500 border-amber-500"
                            : "bg-gray-800 border-gray-600 group-hover:border-gray-500"
                        }`}>
                        {form.order_ids.includes(o.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs font-mono text-amber-400">{o.ms_order_number}</span>
                      <span className="text-[10px] text-gray-500 capitalize">{o.status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : accountId ? "Update Account" : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
