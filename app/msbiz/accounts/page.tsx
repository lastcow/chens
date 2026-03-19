"use client";
import { useEffect, useState, useCallback } from "react";
import {
  UserCircle, Plus, Search, Edit2, Trash2, X,
  Copy, Check, DollarSign, Save,
  Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  PlusCircle, MinusCircle, Package,
} from "lucide-react";

interface Account {
  id: string; email: string; display_name: string | null; password?: string;
  status: string; // FK id e.g. 'account.Ready'
  status_value: string; // e.g. 'Ready'
  status_label: string; // display label
  status_color: string; // hex color e.g. '#22c55e'
  notes: string | null; balance: number;
  owner_id: string | null; owner_name: string | null; owner_email: string | null;
  last_used_at: string | null; created_at: string;
  order_count: number; pm_count: number;
}

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
  const [adjustAcc, setAdjustAcc]   = useState<Account | null>(null);
  const [ordersAcc, setOrdersAcc]   = useState<Account | null>(null);
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
          {["Ready","Suspended","Topup","Error","Hold"].map(s => <option key={s} value={`account.${s}`}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="w-1.5 pl-2"></th>
                <th className="text-left px-4 py-2">Account</th>
                <th className="text-left px-3 py-2 w-36">Balance</th>
                <th className="text-center px-3 py-2 w-20">Orders</th>
              </tr>
            </thead>
            <tbody className="">
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
              ) : accounts.map(acc => {
                const _b = Number(acc.balance ?? 0);
                const _bpct = (Math.min(Math.max(_b / 10, 0), 100)).toString() + "%";
                const _bcol = _b <= 0 ? "#374151" : _b < 100 ? "#ef4444" : _b < 400 ? "#f59e0b" : "#22c55e";
                const _btcol = _b <= 0 ? "#4b5563" : _b < 100 ? "#f87171" : _b < 400 ? "#fb923c" : "#4ade80";
                return (
                <>
                <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors group">
                  {/* Status bar */}
                  <td className="pl-2 pr-0 py-1 w-1.5">
                    <div className="w-1 rounded-full h-7 mx-auto"
                      style={{ backgroundColor: acc.status_color ?? "#4b5563" }}
                      title={acc.status_label ?? acc.status} />
                  </td>
                  {/* Account: email + password + copy-all */}
                  <td className="px-4 py-1 w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-mono text-white truncate">{acc.email}</span>
                      <button
                        onClick={() => copyAll(acc)}
                        title="Copy email, password & balance"
                        className={`opacity-0 group-hover:opacity-100 transition-all shrink-0 ${
                          copiedId === `all-${acc.id}` ? "text-green-400" : "text-gray-600 hover:text-green-400"
                        }`}>
                        {copiedId === `all-${acc.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {acc.password && (
                      <div className="relative group/pw mt-0.5 w-fit">
                        <span className="text-[11px] font-mono text-gray-600 group-hover/pw:invisible select-none">••••••••</span>
                        <span className="text-[11px] font-mono text-gray-400 absolute inset-0 invisible group-hover/pw:visible whitespace-nowrap" title={acc.password}>{acc.password}</span>
                      </div>
                    )}
                  </td>
                  {/* Balance */}
                  <td className="px-3 py-1 w-36">
                    <span style={{fontFamily:"monospace",fontSize:"0.875rem",fontWeight:600,color:_btcol}}>{"$" + _b.toFixed(2)}</span>
                  </td>
                  {/* Orders — clickable, rightmost visible column */}
                  <td className="px-3 py-1 w-20 align-middle relative">
                    <div className="flex items-center justify-center">
                      {(acc.order_count ?? 0) > 0 ? (
                        <button onClick={() => setOrdersAcc(acc)}
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                          <span className="text-xs text-gray-300 font-mono font-medium underline decoration-dotted underline-offset-2">{acc.order_count}</span>
                          <span className="text-gray-600 text-xs">/</span>
                          <span className="text-[11px] font-mono">
                            {(acc.pm_count ?? 0) > 0
                              ? <span className="text-blue-400">{acc.pm_count}</span>
                              : <span className="text-gray-600">—</span>
                            }
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </div>
                    {/* Gmail-style action overlay — appears on row hover, floats over content */}
                    <div className="absolute right-0 top-0 bottom-0 hidden group-hover:flex items-center gap-0.5 px-1 z-10">
                      <button onClick={() => setAdjustAcc(acc)} title="Adjust balance"
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setOrdersAcc(acc)} title="View orders"
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                        <Package className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditId(acc.id); setShowForm(true); }} title="Edit account"
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(acc.id)} title="Delete account"
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="p-0">
                    <div className="h-[3px] w-full" style={{backgroundColor:"#1f2937"}}>
                      <div className="h-full transition-all duration-500" style={{width:_bpct,backgroundColor:_bcol}} />
                    </div>
                  </td>
                </tr>
                </>
                );
              })
            }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
      </div>

      {showForm && (
        <AccountForm accountId={editId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }} />
      )}

      {ordersAcc && (
        <AccountOrdersDialog
          account={ordersAcc}
          onClose={() => setOrdersAcc(null)}
        />
      )}

      {adjustAcc && (
        <AdjustDialog
          account={adjustAcc}
          onClose={() => setAdjustAcc(null)}
          onSaved={(updated) => {
            setAccounts(prev => prev.map(a => a.id === updated.id ? { ...a, balance: updated.balance } : a));
            setAdjustAcc(null);
          }}
        />
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
                  <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full border inline-block border-gray-600"
                    style={{ color: acc.status_color ?? "#9ca3af" }}>{acc.status_label ?? acc.status_value ?? acc.status}</div>
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

interface StatusOption {
  id: string;
  label: string;
  color_hex: string;
}

function AccountForm({ accountId, onClose, onSaved }: { accountId: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [form, setForm] = useState({
    email: "", password: "", display_name: "", status: "account.Ready",
    notes: "", balance: "",
  });

  useEffect(() => {
    fetch("/api/msbiz/statuses?type=account")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.statuses)) setStatusOptions(d.statuses);
        else if (Array.isArray(d)) setStatusOptions(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountId) return;
    fetch(`/api/msbiz/accounts/${accountId}`)
      .then(r => r.json())
      .then(d => {
        if (d.account) {
          const a = d.account;
          setForm({
            email: a.email, password: a.password ?? "",
            display_name: a.display_name ?? "", status: a.status ?? "account.Ready",
            notes: a.notes ?? "", balance: a.balance != null ? String(a.balance) : "0",
          });
        }
      });
  }, [accountId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.email) { setError("Email is required"); return; }
    if (!accountId && !form.password) { setError("Password is required"); return; }
    setSaving(true); setError("");
    const body: Record<string, unknown> = {
      email: form.email, display_name: form.display_name || null,
      status: form.status, notes: form.notes || null,
      balance: parseFloat(form.balance) || 0,
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
                {statusOptions.length > 0
                  ? statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)
                  : <option value={form.status}>{form.status}</option>
                }
              </select>
            </div>
          </div>

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

// ─── Adjust Balance Dialog ────────────────────────────────────────────────────

function AdjustDialog({
  account, onClose, onSaved,
}: {
  account: { id: string; email: string; display_name: string | null; balance: number };
  onClose: () => void;
  onSaved: (updated: { id: string; balance: number }) => void;
}) {
  const [mode, setMode]     = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const current = Number(account.balance ?? 0);
  const delta   = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
  const preview = mode === "add" ? current + delta : current - delta;
  const invalid = delta <= 0 || (mode === "deduct" && delta > current);

  const submit = async () => {
    if (invalid) return;
    setSaving(true); setError("");
    const newBalance = parseFloat(preview.toFixed(2));
    const res = await fetch(`/api/msbiz/accounts/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBalance, notes: note || undefined }),
    });
    if (res.ok) {
      onSaved({ id: account.id, balance: newBalance });
    } else {
      const d = await res.json();
      setError(d.error || "Failed");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col">

        {/* Bento header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => <div key={i} className="rounded-md bg-emerald-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />)}
            </div>
            <div className="absolute -top-8 -left-8 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 right-8 w-28 h-28 bg-emerald-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Adjust Balance</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[180px]">
                  {account.display_name ?? account.email}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Current balance */}
          <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Current Balance</span>
            <span className="font-mono font-semibold text-white">${current.toFixed(2)}</span>
          </div>

          {/* Add / Deduct toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("add")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "add"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
              }`}>
              <PlusCircle className="w-4 h-4" /> Add
            </button>
            <button onClick={() => setMode("deduct")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "deduct"
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
              }`}>
              <MinusCircle className="w-4 h-4" /> Deduct
            </button>
          </div>

          {/* Amount input — no spinners */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Amount ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {mode === "deduct" && delta > current && (
              <p className="text-[11px] text-red-400 mt-1">Amount exceeds current balance</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for adjustment…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Live balance preview */}
          {delta > 0 && !invalid && (
            <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 border ${
              mode === "add"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <span className="text-xs text-gray-400">Balance after</span>
              <div className="text-right">
                <span className={`font-mono font-bold text-base ${mode === "add" ? "text-emerald-400" : "text-amber-400"}`}>
                  ${preview.toFixed(2)}
                </span>
                <span className={`text-[10px] ml-2 ${mode === "add" ? "text-emerald-600" : "text-amber-600"}`}>
                  {mode === "add" ? `+$${delta.toFixed(2)}` : `-$${delta.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving || invalid || delta === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500/90 hover:bg-emerald-500 text-white">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : mode === "add" ? "Add Funds" : "Deduct Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Orders Dialog ────────────────────────────────────────────────────

interface OrderRow {
  id: string; ms_order_number: string; order_date: string; status: string;
  pm_status: string | null;
  pm_status_value: string | null;
  pm_status_label: string | null;
  pm_status_color: string | null;
  total: number; subtotal: number; tax: number;
  items: { name: string; qty: number; unit_price: number }[];
}

const ORD_LIMIT = 10;

function AccountOrdersDialog({
  account, onClose,
}: {
  account: { id: string; email: string; display_name: string | null; balance: number };
  onClose: () => void;
}) {
  const [orders, setOrders]   = useState<OrderRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [pmFilter, setPm]     = useState("");
  const [copiedOrd, setCopiedOrd] = useState<string | null>(null);

  const copyOrder = (o: OrderRow) => {
    const text = `Email: ${account.email}  Order# ${o.ms_order_number}  Total: $${Number(o.total).toFixed(2)}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedOrd(o.id);
    setTimeout(() => setCopiedOrd(null), 1500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({
      account_id: account.id,
      limit: String(ORD_LIMIT),
      page: String(page),
    });
    if (search) p.set("search", search);
    if (pmFilter) p.set("pm_status", pmFilter);
    const res = await fetch(`/api/msbiz/orders?${p}`);
    const d = await res.json();
    setOrders(d.orders ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [account.id, page, search, pmFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search, pmFilter]);

  const pages = Math.max(1, Math.ceil(total / ORD_LIMIT));
  const bal = Number(account.balance ?? 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Bento header — amber theme */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => <div key={i} className="rounded-md bg-amber-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />)}
            </div>
            <div className="absolute -top-8 -left-8 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 right-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{account.display_name ?? account.email}</h2>
                {account.display_name && (
                  <p className="text-[11px] text-gray-500 mt-0.5 font-mono truncate max-w-[220px]">{account.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider">Balance</div>
                <div className="text-sm font-mono font-bold text-amber-400">${bal.toFixed(2)}</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-800 flex gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order # or item name…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <select
            value={pmFilter}
            onChange={e => setPm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All PM Status</option>
            {[["unpmed","Pending PM"],["submitted","PM Submitted"],["approved","PM Approved"],["rejected","PM Rejected"],["ineligible","Not Eligible"],["expired","PM Expired"]].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-600 animate-pulse text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No orders found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-gray-600 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left px-5 py-2.5">Order #</th>
                  <th className="text-left px-4 py-2.5 w-full">Items</th>
                  <th className="text-center px-4 py-2.5">PM Status</th>
                  <th className="text-right px-5 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {orders.map(o => {
                  return (
                    <tr key={o.id} className="hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                      {/* Order # + copy */}
                      <td className="px-5 py-3 align-top w-40">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-amber-400 text-xs font-semibold">{o.ms_order_number}</span>
                          <button
                            onClick={() => copyOrder(o)}
                            title="Copy email, order#, total"
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-amber-400 transition-colors"
                          >
                            {copiedOrd === o.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      {/* Items stacked */}
                      <td className="px-4 py-3 align-top w-full">
                        <div className="space-y-0.5">
                          {Array.isArray(o.items) && o.items.length > 0 ? o.items.map((it, i) => (
                            <div key={i} className="text-xs text-gray-300 whitespace-nowrap">
                              <span className="font-mono text-gray-500 mr-1">{it.qty}×</span>
                              {it.name}
                              <span className="text-gray-600 font-mono ml-1">${Number(it.unit_price).toFixed(2)}/ea</span>
                            </div>
                          )) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                      {/* PM Status badge */}
                      <td className="px-4 py-3 align-top text-center">
                        <span
                          className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10"
                          style={{ color: o.pm_status_color ?? "#9ca3af", backgroundColor: `${o.pm_status_color ?? "#9ca3af"}22` }}>
                          {o.pm_status_label ?? o.pm_status_value ?? o.pm_status ?? "—"}
                        </span>
                      </td>
                      {/* Total */}
                      <td className="px-5 py-3 align-top text-right">
                        <span className="font-mono text-sm font-semibold text-white">${Number(o.total).toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-600">
            {total === 0 ? "0 orders" : `${(page - 1) * ORD_LIMIT + 1}–${Math.min(page * ORD_LIMIT, total)} of ${total}`}
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
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(pages)} disabled={page >= pages}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
