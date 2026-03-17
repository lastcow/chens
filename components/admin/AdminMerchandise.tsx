"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, Copy, Check
} from "lucide-react";

interface Item {
  id: string; name: string; upc: string | null; model: string | null;
  description: string | null; price: number; cost: number | null;
  stock: number; unit: string; status: string; image_url: string | null;
  item_url: string | null; created_at: string; updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:       "bg-green-900/30 text-green-400 border-green-700/30",
  inactive:     "bg-gray-800 text-gray-500 border-gray-700",
  discontinued: "bg-red-900/20 text-red-500 border-red-900/30",
  out_of_stock: "bg-amber-900/30 text-amber-400 border-amber-700/30",
};

const STATUS_BAR: Record<string, string> = {
  active:       "bg-green-500",
  inactive:     "bg-gray-600",
  discontinued: "bg-red-500",
  out_of_stock: "bg-amber-500",
};


export default function AdminMerchandise() {
  const [items, setItems]         = useState<Item[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [copiedId, setCopiedId]   = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.length >= 3) p.set("search", search);
    if (statusFilter)       p.set("status", statusFilter);
    const res = await fetch(`/api/admin/merchandise?${p}`);
    const d = await res.json();
    setItems(d.items ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const doDelete = async (id: string) => {
    await fetch(`/api/admin/merchandise/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchItems();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" /> Merchandise
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} item{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Merchandise
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 sticky top-0 z-10 bg-gray-950/95 backdrop-blur-md py-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
          <option value="">All Status</option>
          {["active","inactive","out_of_stock","discontinued"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-900">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="w-4 pl-2"></th>
              <th className="px-4 py-3 w-12"></th>
              <th className="text-left px-3 py-3">Item</th>
              <th className="text-center px-3 py-3">UPC</th>
              <th className="text-center px-3 py-3">Model</th>
              <th className="text-left px-3 py-3 w-36">Price / Cost</th>
              <th className="text-center px-3 py-3">Stock</th>
              <th className="text-center px-3 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-600 animate-pulse">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-600">No items found.</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-800/30 transition-colors group">
                {/* Status bar */}
                <td className="pl-2 pr-0 py-0 w-1.5">
                  <div className={`w-1 rounded-full h-8 mx-auto ${STATUS_BAR[item.status] ?? "bg-gray-600"}`} title={item.status.replace(/_/g, " ")} />
                </td>
                {/* Image — natural aspect ratio, max 48px tall */}
                <td className="px-4 py-2.5">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name}
                        className="max-h-12 max-w-[48px] w-auto h-auto rounded-md border border-gray-700 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-gray-600" />
                      </div>}
                </td>
                {/* Name — takes all remaining space */}
                <td className="px-3 py-2.5 w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-white text-sm truncate shrink min-w-0" title={item.name}>{item.name}</span>

                    {item.item_url && (
                      <>
                        <a href={item.item_url} target="_blank" rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-400 transition-colors shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${item.name}: ${item.item_url}, price: $${Number(item.price).toFixed(2)}`
                            );
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="text-gray-600 hover:text-green-400 transition-colors shrink-0"
                          title="Copy URL">
                          {copiedId === item.id
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center w-28" title={item.upc ?? ""}>
                  <span className="text-xs font-mono text-gray-400 block truncate max-w-[100px] mx-auto">{item.upc || "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-center w-28" title={item.model ?? ""}>
                  <span className="text-xs text-gray-400 block truncate max-w-[100px] mx-auto">{item.model || "—"}</span>
                </td>
                <td className="px-3 py-2.5 w-36" title={`Price: $${Number(item.price).toFixed(2)}${item.cost != null ? ` | Cost: $${Number(item.cost).toFixed(2)}` : ""}`}>
                  {(() => {
                    const price = Number(item.price);
                    const cost  = item.cost != null ? Number(item.cost) : null;
                    const margin = cost != null && price > 0 ? ((price - cost) / price) * 100 : null;
                    const costPct = cost != null && price > 0 ? (cost / price) * 100 : 0;
                    return (
                      <div className="w-28">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs font-mono font-semibold text-white">${price.toFixed(2)}</span>
                          {cost != null
                            ? <span className="text-xs font-mono text-gray-500">${cost.toFixed(2)}</span>
                            : <span className="text-[10px] text-gray-700">no cost</span>}
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full flex rounded-full overflow-hidden">
                            {cost != null ? (
                              <>
                                <div className="h-full bg-red-500/70 transition-all" style={{ width: `${Math.min(costPct, 100)}%` }} />
                                <div className="h-full bg-green-500/70 transition-all" style={{ width: `${Math.min(margin ?? 0, 100)}%` }} />
                              </>
                            ) : (
                              <div className="h-full bg-amber-500/40 w-full" />
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`font-mono text-sm font-bold ${item.stock === 0 ? "text-red-400" : item.stock < 10 ? "text-amber-400" : "text-gray-300"}`}>
                    {item.stock}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-0.5">{item.unit}</span>
                </td>
                <td className="px-3 py-3">
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
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total}` : "0 results"}
          </span>
          <div className="flex items-center gap-1">
            {[
              { icon: ChevronsLeft,  action: () => setPage(1),              disabled: page === 1 },
              { icon: ChevronLeft,   action: () => setPage(p => p-1),       disabled: page === 1 },
              { icon: ChevronRight,  action: () => setPage(p => p+1),       disabled: page === totalPages },
              { icon: ChevronsRight, action: () => setPage(totalPages),     disabled: page === totalPages },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button key={i} onClick={action} disabled={disabled}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${disabled ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:bg-gray-800"}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <MerchandiseForm item={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchItems(); }} />
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Delete Item?</h3>
            <p className="text-sm text-gray-400 mb-6">This will permanently remove the merchandise item.</p>
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

function MerchandiseForm({ item, onClose, onSaved }: { item: Item | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: item?.name ?? "", upc: item?.upc ?? "", model: item?.model ?? "",
    description: item?.description ?? "", price: item?.price != null ? String(item.price) : "",
    cost: item?.cost != null ? String(item.cost) : "", stock: item?.stock != null ? String(item.stock) : "0",
    unit: item?.unit ?? "unit", status: item?.status ?? "active",
    image_url: item?.image_url ?? "", item_url: item?.item_url ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));



  const submit = async () => {
    if (!form.name) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const body = {
      name: form.name, upc: form.upc || null, model: form.model || null,
      description: form.description || null, price: parseFloat(form.price) || 0,
      cost: form.cost ? parseFloat(form.cost) : null, stock: parseInt(form.stock, 10) || 0,
      unit: form.unit, status: form.status, image_url: form.image_url || null,
      item_url: form.item_url || null,
    };
    const res = await fetch(item ? `/api/admin/merchandise/${item.id}` : "/api/admin/merchandise", {
      method: item ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header with Bento Grid pattern */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          {/* Grid background */}
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }} />
            {/* Bento cells */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="rounded-md bg-amber-400" style={{ opacity: Math.random() > 0.5 ? 1 : 0.3 }} />
              ))}
            </div>
            {/* Amber glow */}
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{item ? "Edit Item" : "Add Item"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{item ? `Updating ${item.name}` : "Add a new merchandise item"}</p>
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
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">UPC</label>
              <input value={form.upc} onChange={e => set("upc", e.target.value)}
                placeholder="Barcode number"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Model</label>
              <input value={form.model} onChange={e => set("model", e.target.value)}
                placeholder="Model number / name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              {["active","inactive","out_of_stock","discontinued"].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Image URL with preview */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Image URL</label>
              <input value={form.image_url} onChange={e => set("image_url", e.target.value)}
                placeholder="https://…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              {form.image_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.image_url} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-700"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-[10px] text-gray-600">Preview</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Item URL</label>
              <input value={form.item_url} onChange={e => set("item_url", e.target.value)}
                placeholder="https://…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              {form.item_url && (
                <a href={form.item_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5" /> Open link
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { k: "price", label: "Price ($)" },
              { k: "cost",  label: "Cost ($)" },
              { k: "stock", label: "Stock" },
              { k: "unit",  label: "Unit" },
            ].map(({ k, label }) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <input
                  type={k === "unit" ? "text" : "text"}
                  inputMode={k === "unit" ? "text" : "decimal"}
                  value={form[k as keyof typeof form] as string}
                  onChange={e => set(k, k === "unit" ? e.target.value : e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            ))}
          </div>

          {/* Tags */}

        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : item ? "Update Item" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
