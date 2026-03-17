"use client";
import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  ShoppingCart, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package, DollarSign, Check
} from "lucide-react";

interface PO {
  id: string; po_number: string | null;
  requester_id: string; requester_name: string | null; requester_email: string | null;
  merchandise_id: string; merchandise_name: string | null; upc: string | null; model: string | null;
  image_url: string | null; merchandise_price: number | null;
  qty: number; completed_qty: number; required_price: number | null; deadline: string | null;
  warehouse_id: string | null; warehouse_name: string | null;
  warehouse_address: string | null; warehouse_contact_name: string | null; warehouse_contact_phone: string | null;
  status: string; notes: string | null; created_at: string;
}

interface User { id: string; name: string | null; email: string; role_name?: string; }
interface Merch { id: string; name: string; upc: string | null; model: string | null; image_url: string | null; price: number; }
interface Warehouse { id: string; name: string; full_address: string | null; city: string | null; state: string | null; zip: string | null; }

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-900/30 text-amber-400 border-amber-700/30",
  approved:  "bg-blue-900/30 text-blue-400 border-blue-700/30",
  ordered:   "bg-purple-900/30 text-purple-400 border-purple-700/30",
  received:  "bg-green-900/30 text-green-400 border-green-700/30",
  cancelled: "bg-gray-800 text-gray-500 border-gray-700",
};

const STATUS_BAR: Record<string, string> = {
  pending:   "bg-amber-500",
  approved:  "bg-blue-500",
  ordered:   "bg-purple-500",
  received:  "bg-green-500",
  cancelled: "bg-gray-600",
};

const LIMIT = 20;

export default function AdminPurchaseOrders() {
  const [orders, setOrders]       = useState<PO[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState<PO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedPoId, setCopiedPoId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.length >= 2) p.set("search", search);
    if (statusFilter) p.set("status", statusFilter);
    const res = await fetch(`/api/admin/purchase-orders?${p}`);
    const d = await res.json();
    setOrders(d.orders ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const doDelete = async (id: string) => {
    await fetch(`/api/admin/purchase-orders/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchOrders();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" /> Purchase Orders
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} order{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 sticky top-[100px] z-10 bg-gray-950/80 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search item, requester… (3+ chars)"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
          <option value="">All Statuses</option>
          {["pending","approved","ordered","received","cancelled"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 whitespace-nowrap">
                <th className="w-1.5 pl-2"></th>
                <th className="text-left px-3 py-3 w-14 shrink-0">PO #</th>
                <th className="text-left px-3 py-3 w-10 shrink-0"></th>
                <th className="text-left px-3 py-3">Item</th>
                <th className="text-left px-3 py-3 w-32 shrink-0">Requester</th>
                <th className="text-center px-3 py-3 w-12 shrink-0">Qty</th>
                <th className="text-right px-3 py-3 w-24 shrink-0">Price</th>
                <th className="text-left px-3 py-3 w-24 shrink-0">Deadline</th>
                <th className="text-left px-3 py-3 w-32 shrink-0">Ship To</th>
                <th className="text-center px-3 py-3 w-16 shrink-0"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3">
                    <div className="h-5 bg-gray-800 rounded animate-pulse w-full" />
                  </td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16">
                  <ShoppingCart className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No purchase orders.</p>
                </td></tr>
              ) : orders.map(po => (
                <React.Fragment key={po.id}>
                <tr className="hover:bg-gray-800/30 transition-colors group">
                  {/* Status bar */}
                  <td className="pl-2 pr-0 py-0 w-1.5">
                    <div className={`w-1 rounded-full h-7 mx-auto ${STATUS_BAR[po.status] ?? "bg-gray-600"}`} title={po.status} />
                  </td>
                  {/* PO Number — click to copy full details */}
                  <td className="px-3 py-2.5 w-14 shrink-0 whitespace-nowrap">
                    {po.po_number ? (
                      <button
                        onClick={() => {
                          const parts = [
                            `PO# ${po.po_number}`,
                            `item: ${po.merchandise_name ?? ""}${po.upc ? ` (${po.upc})` : ""}`,
                            po.warehouse_name ? `ship to: ${po.warehouse_name}` : null,
                            po.merchandise_price != null ? `list price $${Number(po.merchandise_price).toFixed(2)}` : null,
                          ].filter(Boolean).join(", ");
                          navigator.clipboard.writeText(parts);
                          setCopiedPoId(po.id);
                          setTimeout(() => setCopiedPoId(null), 1500);
                        }}
                        title={po.po_number}
                        className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors cursor-pointer group/po">
                        {copiedPoId === po.id
                          ? <Check className="w-3 h-3 text-green-400 shrink-0" />
                          : null}
                        <span>{po.po_number.slice(-4)}</span>
                      </button>
                    ) : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  {/* Image */}
                  <td className="px-3 py-2.5 w-10 shrink-0">
                    {po.image_url
                      ? <img src={po.image_url} alt="" className="max-h-10 max-w-[40px] w-auto h-auto rounded-md border border-gray-700 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <div className="w-8 h-8 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5 text-gray-600" />
                        </div>}
                  </td>
                  {/* Item — takes remaining space, truncates */}
                  <td className="px-3 py-2.5 w-full min-w-0 max-w-0">
                    <div className="font-medium text-white text-sm truncate whitespace-nowrap" title={po.merchandise_name ?? ""}>{po.merchandise_name ?? "—"}</div>
                    <div className="flex gap-2 mt-0.5 text-[10px] text-gray-600 font-mono whitespace-nowrap">
                      {po.upc && <span>{po.upc}</span>}
                      {po.model && <span className="truncate">{po.model}</span>}
                    </div>
                  </td>
                  {/* Requester */}
                  <td className="px-3 py-2.5 w-32 shrink-0 whitespace-nowrap">
                    <div className="text-xs text-white truncate max-w-[120px]" title={po.requester_name ?? ""}>{po.requester_name || "—"}</div>
                    <div className="text-[10px] text-gray-600 font-mono truncate max-w-[120px]" title={po.requester_email ?? ""}>{po.requester_email}</div>
                  </td>
                  {/* Qty */}
                  <td className="px-3 py-2.5 w-12 shrink-0 text-center whitespace-nowrap">
                    <span className="text-sm font-mono font-bold text-white">{po.qty}</span>
                  </td>
                  {/* Required price */}
                  <td className="px-3 py-2.5 w-24 shrink-0 text-right whitespace-nowrap">
                    {po.required_price != null ? (
                      <div>
                        <div className="text-xs font-mono font-semibold text-green-400">${Number(po.required_price).toFixed(2)}</div>
                        {po.merchandise_price != null && (
                          <div className="text-[10px] text-gray-600 font-mono">${Number(po.merchandise_price).toFixed(2)}</div>
                        )}
                      </div>
                    ) : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  {/* Deadline */}
                  <td className="px-3 py-2.5 w-24 shrink-0 whitespace-nowrap">
                    {po.deadline ? (() => {
                      const days = Math.ceil((new Date(po.deadline).getTime() - Date.now()) / 86400000);
                      const overdue = days < 0;
                      const urgent  = days >= 0 && days <= 3;
                      const label   = overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`;
                      return (
                        <span className={`text-xs font-mono ${overdue ? "text-red-400" : urgent ? "text-amber-400" : "text-gray-400"}`}
                          title={new Date(po.deadline).toLocaleDateString()}>
                          {label}
                        </span>
                      );
                    })() : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  {/* Warehouse — tooltip with full address + contact */}
                  <td className="px-3 py-2.5 w-32 shrink-0 whitespace-nowrap">
                    <span className="text-xs text-gray-400 truncate block max-w-[120px]"
                      title={[
                        po.warehouse_name,
                        po.warehouse_address,
                        po.warehouse_contact_name,
                        po.warehouse_contact_phone,
                      ].filter(Boolean).join("\n")}>
                      {po.warehouse_name || "—"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-2.5 w-16 shrink-0 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditItem(po); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(po.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                  {/* Full-width progress bar row */}
                  <tr key={`${po.id}-bar`} className="group">
                    <td colSpan={9} className="px-0 pt-0 pb-1">
                      {(() => {
                        const pct = po.qty > 0 ? Math.min((po.completed_qty / po.qty) * 100, 100) : 0;
                        const done = po.completed_qty >= po.qty && po.qty > 0;
                        const color = done ? "bg-green-500" : pct > 0 ? "bg-blue-500" : "bg-gray-700";
                        return (
                          <div className="h-0.5 w-full bg-gray-800/60" title={`${po.completed_qty} / ${po.qty} completed`}>
                            <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="px-2 text-xs text-gray-400">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(pages)} disabled={page===pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <POForm po={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchOrders(); }} />
      )}

      {deletingId && (() => {
        const po = orders.find(o => o.id === deletingId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><Trash2 className="w-4 h-4 text-red-400" /></div>
                <div><h3 className="font-bold text-white">Delete PO?</h3><p className="text-xs text-gray-500 mt-0.5">This cannot be undone.</p></div>
              </div>
              {po && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-white">{po.merchandise_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Requested by {po.requester_name || po.requester_email} · qty {po.qty}</div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDeletingId(null)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
                <button onClick={() => doDelete(deletingId!)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// react-select dark theme styles
const selectStyles = {
  control: (b: object) => ({ ...b, backgroundColor: "#1f2937", borderColor: "#374151", minHeight: "38px", boxShadow: "none", "&:hover": { borderColor: "#6b7280" } }),
  menu: (b: object) => ({ ...b, backgroundColor: "#111827", border: "1px solid #374151", zIndex: 9999 }),
  menuList: (b: object) => ({ ...b, maxHeight: "200px" }),
  option: (b: object, s: { isFocused: boolean; isSelected: boolean }) => ({
    ...b, backgroundColor: s.isSelected ? "#d97706" : s.isFocused ? "#1f2937" : "transparent",
    color: s.isSelected ? "#fff" : "#e5e7eb", fontSize: "13px", cursor: "pointer",
    "&:active": { backgroundColor: "#92400e" },
  }),
  singleValue: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  input: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  placeholder: (b: object) => ({ ...b, color: "#6b7280", fontSize: "13px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b: object) => ({ ...b, color: "#6b7280", padding: "0 6px" }),
  clearIndicator: (b: object) => ({ ...b, color: "#6b7280" }),
};

function POForm({ po, onClose, onSaved }: { po: PO | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [allUsers, setAllUsers]     = useState<User[]>([]);
  const [allMerch, setAllMerch]     = useState<Merch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    requester_id: po?.requester_id ?? "",
    merchandise_id: po?.merchandise_id ?? "",
    qty: String(po?.qty ?? "1"),
    completed_qty: String(po?.completed_qty ?? "0"),
    required_price: po?.required_price != null ? String(po.required_price) : "",
    deadline: po?.deadline ? po.deadline.slice(0, 10) : "",
    warehouse_id: po?.warehouse_id ?? "",
    status: po?.status ?? "pending",
    notes: po?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/msbiz-users").then(r => r.json()),
      fetch("/api/admin/merchandise?limit=500").then(r => r.json()),
      fetch("/api/admin/msbiz-warehouses").then(r => r.json()),
    ]).then(([u, m, w]) => {
      setAllUsers(u.users ?? []);
      setAllMerch(m.items ?? []);
      setWarehouses(w.warehouses ?? []);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedMerch = allMerch.find(m => m.id === form.merchandise_id);
  const selectedWarehouse = warehouses.find(w => w.id === form.warehouse_id);

  const handleMerchChange = (id: string) => {
    const m = allMerch.find(x => x.id === id);
    setForm(f => ({
      ...f,
      merchandise_id: id,
      required_price: m ? String(Number(m.price).toFixed(2)) : f.required_price,
    }));
  };

  const submit = async () => {
    if (!form.requester_id || !form.merchandise_id) { setError("Requester and item are required"); return; }
    setSaving(true); setError("");
    const body = {
      requester_id: form.requester_id,
      merchandise_id: form.merchandise_id,
      qty: parseInt(form.qty, 10) || 1,
      completed_qty: parseInt(form.completed_qty, 10) || 0,
      required_price: form.required_price ? parseFloat(form.required_price) : null,
      deadline: form.deadline || null,
      warehouse_id: form.warehouse_id || null,
      status: form.status,
      notes: form.notes || null,
    };
    const res = await fetch(po ? `/api/admin/purchase-orders/${po.id}` : "/api/admin/purchase-orders", {
      method: po ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Bento header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => <div key={i} className="rounded-md bg-amber-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />)}
            </div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{po ? "Edit PO" : "New Purchase Order"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{po ? "Updating PO" : "Create a new purchase order"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Requester — react-select searchable */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Requester * <span className="text-gray-600 normal-case font-normal">(MS Business users)</span>
            </label>
            <Select
              styles={selectStyles}
              options={allUsers.map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={allUsers.filter(u => u.id === form.requester_id).map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))[0] ?? null}
              onChange={opt => set("requester_id", opt?.value ?? "")}
              placeholder="Search MS Business users…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </div>

          {/* Merchandise — react-select searchable */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Merchandise *</label>
            <Select
              styles={selectStyles}
              options={allMerch.map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}${m.model ? ` · ${m.model}` : ""}` }))}
              value={allMerch.filter(m => m.id === form.merchandise_id).map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}${m.model ? ` · ${m.model}` : ""}` }))[0] ?? null}
              onChange={opt => handleMerchChange(opt?.value ?? "")}
              placeholder="Search by name, UPC, model…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
            {selectedMerch && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                {selectedMerch.image_url && (
                  <img src={selectedMerch.image_url} className="w-8 h-8 object-contain rounded border border-gray-700" alt=""
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <span>List: <span className="text-green-400 font-mono">${Number(selectedMerch.price).toFixed(2)}</span></span>
                {selectedMerch.model && <span className="text-gray-600">· {selectedMerch.model}</span>}
              </div>
            )}
          </div>

          {/* Qty + Completed Qty + Required Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Qty</label>
              <input type="number" min="1" value={form.qty} onChange={e => set("qty", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Completed</label>
              <input type="number" min="0" value={form.completed_qty} onChange={e => set("completed_qty", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Required Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" inputMode="decimal" value={form.required_price}
                  onChange={e => set("required_price", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Pre-filled from list price"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          {/* Deadline + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {["pending","approved","ordered","received","cancelled"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ship To Warehouse — with full address */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ship To Warehouse</label>
            <select value={form.warehouse_id} onChange={e => set("warehouse_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              <option value="">— None —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {selectedWarehouse && selectedWarehouse.full_address && (
              <div className="mt-1.5 text-[11px] text-gray-500 flex items-start gap-1.5">
                <Package className="w-3 h-3 mt-0.5 text-gray-600 shrink-0" />
                <span>{selectedWarehouse.full_address}</span>
              </div>
            )}
          </div>

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
            {saving ? "Saving…" : po ? "Update PO" : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
}
