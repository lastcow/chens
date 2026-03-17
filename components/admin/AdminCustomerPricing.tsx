"use client";
import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  Tag, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, Check
} from "lucide-react";

interface CPItem {
  id: string;
  user_id: string; user_name: string | null; user_email: string;
  merchandise_id: string; merchandise_name: string; upc: string | null; model: string | null;
  image_url: string | null; list_price: number;
  custom_price: number; notes: string | null; created_at: string;
}

interface User { id: string; name: string | null; email: string; }
interface Merch { id: string; name: string; upc: string | null; model: string | null; image_url: string | null; price: number; }

const LIMIT = 20;

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

export default function AdminCustomerPricing() {
  const [items, setItems]         = useState<CPItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState<CPItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.length >= 2) p.set("search", search);
    const res = await fetch(`/api/admin/customer-merchandise?${p}`);
    const d = await res.json();
    setItems(d.items ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [search]);

  const doDelete = async (id: string) => {
    await fetch(`/api/admin/customer-merchandise/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchItems();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" /> Customer Pricing
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} custom price{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Price
        </button>
      </div>

      {/* Search */}
      <div className="sticky top-[100px] z-10 bg-gray-950/80 backdrop-blur-md py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or item… (2+ chars)"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 whitespace-nowrap">
              <th className="text-left px-4 py-3 w-12"></th>
              <th className="text-left px-3 py-3">Item</th>
              <th className="text-left px-3 py-3 w-44 shrink-0">Customer</th>
              <th className="text-right px-3 py-3 w-28 shrink-0">List Price</th>
              <th className="text-right px-3 py-3 w-28 shrink-0">Custom Price</th>
              <th className="text-right px-3 py-3 w-20 shrink-0">Discount</th>
              <th className="text-center px-3 py-3 w-16 shrink-0"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3">
                  <div className="h-5 bg-gray-800 rounded animate-pulse w-full" />
                </td></tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16">
                <Tag className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No custom prices set.</p>
              </td></tr>
            ) : items.map(item => {
              const discount = item.list_price > 0
                ? ((item.list_price - item.custom_price) / item.list_price) * 100
                : 0;
              const discountColor = discount > 20 ? "text-red-400" : discount > 0 ? "text-amber-400" : "text-gray-500";
              return (
                <tr key={item.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-4 py-2.5 w-12">
                    {item.image_url
                      ? <img src={item.image_url} alt="" className="max-h-10 max-w-[40px] w-auto h-auto rounded-md border border-gray-700 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <div className="w-8 h-8 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-gray-600" />
                        </div>}
                  </td>
                  <td className="px-3 py-2.5 w-full min-w-0 max-w-0">
                    <div className="font-medium text-white text-sm truncate" title={item.merchandise_name}>{item.merchandise_name}</div>
                    <div className="text-[10px] text-gray-600 font-mono flex gap-2">
                      {item.upc && <span>{item.upc}</span>}
                      {item.model && <span>{item.model}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 w-44 shrink-0 whitespace-nowrap">
                    <div className="text-xs text-white truncate max-w-[160px]" title={item.user_name ?? ""}>{item.user_name || "—"}</div>
                    <div className="text-[10px] text-gray-600 font-mono truncate max-w-[160px]">{item.user_email}</div>
                  </td>
                  <td className="px-3 py-2.5 w-28 shrink-0 text-right whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500">${Number(item.list_price).toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 w-28 shrink-0 text-right whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-green-400">${Number(item.custom_price).toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 w-20 shrink-0 text-right whitespace-nowrap">
                    {discount !== 0 && (
                      <span className={`text-xs font-mono ${discountColor}`}>
                        {discount > 0 ? `-${discount.toFixed(0)}%` : `+${Math.abs(discount).toFixed(0)}%`}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 w-16 shrink-0">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {total > 0 && (
          <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="px-2 text-xs text-gray-400">{page} / {pages || 1}</span>
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page>=pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(pages)} disabled={page>=pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <CPForm item={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchItems(); }} />
      )}

      {deletingId && (() => {
        const item = items.find(i => i.id === deletingId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><Trash2 className="w-4 h-4 text-red-400" /></div>
                <div><h3 className="font-bold text-white">Remove Custom Price?</h3><p className="text-xs text-gray-500 mt-0.5">Customer will revert to list price.</p></div>
              </div>
              {item && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="text-sm text-white">{item.merchandise_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.user_name || item.user_email} · <span className="text-green-400 font-mono">${Number(item.custom_price).toFixed(2)}</span></div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDeletingId(null)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
                <button onClick={() => doDelete(deletingId!)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CPForm({ item, onClose, onSaved }: { item: CPItem | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allMerch, setAllMerch] = useState<Merch[]>([]);
  const [form, setForm] = useState({
    user_id: item?.user_id ?? "",
    merchandise_id: item?.merchandise_id ?? "",
    custom_price: item?.custom_price != null ? String(item.custom_price) : "",
    notes: item?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/msbiz-users").then(r => r.json()),
      fetch("/api/admin/merchandise?limit=500").then(r => r.json()),
    ]).then(([u, m]) => {
      setAllUsers(u.users ?? []);
      setAllMerch(m.items ?? []);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedMerch = allMerch.find(m => m.id === form.merchandise_id);
  const discount = selectedMerch && form.custom_price
    ? ((selectedMerch.price - parseFloat(form.custom_price)) / selectedMerch.price) * 100
    : null;

  const submit = async () => {
    if (!form.user_id) { setError("Customer is required"); return; }
    if (!form.merchandise_id) { setError("Item is required"); return; }
    if (!form.custom_price) { setError("Custom price is required"); return; }
    setSaving(true); setError("");
    const body = {
      user_id: form.user_id,
      merchandise_id: form.merchandise_id,
      custom_price: parseFloat(form.custom_price),
      notes: form.notes || null,
    };
    const res = await fetch(item ? `/api/admin/customer-merchandise/${item.id}` : "/api/admin/customer-merchandise", {
      method: item ? "PUT" : "POST",
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
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Tag className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{item ? "Edit Custom Price" : "Add Custom Price"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{item ? `${item.merchandise_name} · ${item.user_name || item.user_email}` : "Set individual pricing for a customer"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Customer */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Customer *</label>
            <Select
              styles={selectStyles}
              isDisabled={!!item}
              options={allUsers.map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={allUsers.filter(u => u.id === form.user_id).map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))[0] ?? null}
              onChange={opt => set("user_id", opt?.value ?? "")}
              placeholder="Search customers…"
              isClearable={!item}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </div>

          {/* Merchandise */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Item *</label>
            <Select
              styles={selectStyles}
              isDisabled={!!item}
              options={allMerch.map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}` }))}
              value={allMerch.filter(m => m.id === form.merchandise_id).map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}` }))[0] ?? null}
              onChange={opt => {
                set("merchandise_id", opt?.value ?? "");
                const m = allMerch.find(x => x.id === opt?.value);
                if (m && !form.custom_price) set("custom_price", String(Number(m.price).toFixed(2)));
              }}
              placeholder="Search items…"
              isClearable={!item}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
            {selectedMerch && (
              <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-2">
                {selectedMerch.image_url && <img src={selectedMerch.image_url} className="w-7 h-7 object-contain rounded border border-gray-700" alt="" />}
                <span>List: <span className="text-gray-400 font-mono">${Number(selectedMerch.price).toFixed(2)}</span></span>
              </div>
            )}
          </div>

          {/* Custom Price */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Custom Price ($) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" inputMode="decimal" value={form.custom_price}
                onChange={e => set("custom_price", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            {discount != null && !isNaN(discount) && (
              <p className={`text-[11px] mt-1 font-mono ${discount > 0 ? "text-amber-400" : discount < 0 ? "text-red-400" : "text-gray-600"}`}>
                {discount > 0 ? `${discount.toFixed(1)}% below list` : discount < 0 ? `${Math.abs(discount).toFixed(1)}% above list` : "Same as list price"}
              </p>
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
            {saving ? "Saving…" : item ? "Update" : "Save Price"}
          </button>
        </div>
      </div>
    </div>
  );
}
