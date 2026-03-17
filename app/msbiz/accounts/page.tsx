"use client";
import { useEffect, useState, useCallback } from "react";
import {
  UserCircle, Plus, Search, Edit2, Trash2, X,
  Copy, Check, DollarSign, Link2, Package, User, Save,
  Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
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

const STATUS_BAR: Record<string, string> = {
  Ready:     "bg-green-500",
  Suspended: "bg-red-500",
  Topup:     "bg-amber-500",
  Error:     "bg-red-400",
  Hold:      "bg-gray-600",
};

const LIMIT = 20;

export default function AccountsPage() {
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId]   = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.length >= 3) p.set("search", search);
    if (statusFilter) p.set("status", statusFilter);
    const res = await fetch(`/api/msbiz/accounts?${p}`);
    const d = await res.json();
    setAccounts(d.accounts ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const copyAll = (acc: Account) => {
    const text = `email: ${acc.email}, password: ${acc.password ?? ""}, balance $${Number(acc.balance ?? 0).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(`all-${acc.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const doDelete = async (id: string) => {
    await fetch(`/api/msbiz/accounts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchAccounts();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">MS Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} account{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 sticky top-[100px] z-10 bg-gray-950/80 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts… (3+ chars)"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
          <option value="">All Statuses</option>
          {["Ready","Suspended","Topup","Error","Hold"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 sticky top-[140px] bg-gray-900/95 backdrop-blur-md z-[5]">
                <th className="w-1.5 pl-2"></th>
                <th className="text-left px-4 py-3">Account</th>
                <th className="text-left px-3 py-3 w-36">Password</th>
                <th className="text-right px-3 py-3 w-28">Balance</th>
                <th className="text-left px-3 py-3 w-36">Owner</th>
                <th className="text-center px-3 py-3 w-20">Orders</th>
                <th className="text-center px-3 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-gray-800 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <UserCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No accounts found.</p>
                  </td>
                </tr>
              ) : accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors group">
                  {/* Status bar */}
                  <td className="pl-2 pr-0 py-0 w-1.5">
                    <div className={`w-1 rounded-full h-7 mx-auto ${STATUS_BAR[acc.status] ?? "bg-gray-600"}`}
                      title={acc.status} />
                  </td>
                  {/* Account: display name + email */}
                  <td className="px-4 py-3 w-full min-w-0">
                    <div className="font-medium text-white text-sm truncate">{acc.display_name || "—"}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-mono text-gray-500 truncate">{acc.email}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(acc.email);
                        setCopiedId(`email-${acc.id}`);
                        setTimeout(() => setCopiedId(null), 1500);
                      }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-green-400 transition-all shrink-0">
                        {copiedId === `email-${acc.id}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </td>
                  {/* Password */}
                  <td className="px-3 py-3 w-36">
                    {acc.password ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-gray-400 truncate max-w-[90px]" title={acc.password}>••••••••</span>
                        <button onClick={() => {
                          navigator.clipboard.writeText(acc.password!);
                          setCopiedId(`pw-${acc.id}`);
                          setTimeout(() => setCopiedId(null), 1500);
                        }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-green-400 transition-all shrink-0">
                          {copiedId === `pw-${acc.id}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    ) : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  {/* Balance */}
                  <td className="px-3 py-3 w-28 text-right">
                    <span className="text-sm font-mono font-semibold text-green-400">
                      ${Number(acc.balance ?? 0).toFixed(2)}
                    </span>
                  </td>
                  {/* Owner */}
                  <td className="px-3 py-3 w-36">
                    <span className="text-xs text-blue-300 truncate block max-w-[120px]" title={acc.owner_name ?? acc.owner_email ?? ""}>
                      {acc.owner_name || acc.owner_email || "—"}
                    </span>
                  </td>
                  {/* Orders */}
                  <td className="px-3 py-3 w-20 text-center">
                    {acc.order_ids?.length > 0
                      ? <span className="text-xs text-purple-300 font-mono">{acc.order_ids.length}</span>
                      : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-3 w-20">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyAll(acc)} title="Copy email, password & balance"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          copiedId === `all-${acc.id}` ? "text-green-400 bg-green-500/10" : "text-gray-500 hover:text-blue-400 hover:bg-blue-500/10"
                        }`}>
                        {copiedId === `all-${acc.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setEditId(acc.id); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(acc.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs text-gray-400">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(pages)} disabled={page === pages}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AccountForm accountId={editId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }} />
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delete Account?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Credentials will be permanently removed.</p>
              </div>
            </div>
            {(() => {
              const acc = accounts.find(a => a.id === deletingId);
              return acc ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-white">{acc.display_name || acc.email}</div>
                  {acc.display_name && <div className="text-xs font-mono text-gray-500 mt-0.5">{acc.email}</div>}
                  <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full border inline-block ${STATUS_COLORS[acc.status] ?? ""}`}>{acc.status}</div>
                </div>
              ) : null;
            })()}
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={() => doDelete(deletingId!)}
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
  const toggleOrder = (id: string) => setForm(f => ({
    ...f,
    order_ids: f.order_ids.includes(id) ? f.order_ids.filter(o => o !== id) : [...f.order_ids, id],
  }));

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
        {/* Bento grid header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="rounded-md bg-amber-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />
              ))}
            </div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{accountId ? "Edit Account" : "Add Account"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{accountId ? `Editing ${form.email || "…"}` : "Add a new MS account"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Display Name</label>
            <input value={form.display_name} onChange={e => set("display_name", e.target.value)}
              placeholder="e.g., Main Business Account"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Balance ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" inputMode="decimal" value={form.balance}
                  onChange={e => set("balance", e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {["Ready","Suspended","Topup","Error","Hold"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

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
                          form.order_ids.includes(o.id) ? "bg-amber-500 border-amber-500" : "bg-gray-800 border-gray-600"
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
