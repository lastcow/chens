"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag
} from "lucide-react";

interface Item {
  id: string; name: string; upc: string | null; model: string | null;
  description: string | null; price: number; cost: number | null;
  stock: number; unit: string; status: string; image_url: string | null;
  tags: string[]; created_at: string; updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:       "bg-green-900/30 text-green-400 border-green-700/30",
  inactive:     "bg-gray-800 text-gray-500 border-gray-700",
  discontinued: "bg-red-900/20 text-red-500 border-red-900/30",
  out_of_stock: "bg-amber-900/30 text-amber-400 border-amber-700/30",
};


export default function AdminMerchandise() {
  const [items, setItems]         = useState<Item[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search)       p.set("search", search);
    if (statusFilter) p.set("status", statusFilter);
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Item
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
              <th className="text-left px-5 py-3">Item</th>
              <th className="text-left px-3 py-3">Image</th>
              <th className="text-center px-3 py-3">UPC</th>
              <th className="text-center px-3 py-3">Model</th>
              <th className="text-right px-3 py-3">Price</th>
              <th className="text-right px-3 py-3">Cost</th>
              <th className="text-center px-3 py-3">Stock</th>
              <th className="text-center px-3 py-3">Status</th>
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
                <td className="px-5 py-3">
                  <div className="font-medium text-white text-sm">{item.name}</div>
                  {item.description && <div className="text-[10px] text-gray-600 truncate max-w-48">{item.description}</div>}
                  {item.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {item.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] bg-gray-800 text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-700" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-gray-600" /></div>}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs font-mono text-gray-400">{item.upc || "—"}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs text-gray-400">{item.model || "—"}</span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-white font-medium">
                  ${Number(item.price).toFixed(2)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-gray-500">
                  {item.cost != null ? `$${Number(item.cost).toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`font-mono text-sm font-bold ${item.stock === 0 ? "text-red-400" : item.stock < 10 ? "text-amber-400" : "text-gray-300"}`}>
                    {item.stock}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-0.5">{item.unit}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[item.status] ?? "bg-gray-800 text-gray-500 border-gray-700"}`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
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
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    name: item?.name ?? "", upc: item?.upc ?? "", model: item?.model ?? "",
    description: item?.description ?? "", price: item?.price != null ? String(item.price) : "",
    cost: item?.cost != null ? String(item.cost) : "", stock: item?.stock != null ? String(item.stock) : "0",
    unit: item?.unit ?? "unit", status: item?.status ?? "active",
    image_url: item?.image_url ?? "", tags: item?.tags ?? [],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };
  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const submit = async () => {
    if (!form.name) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const body = {
      name: form.name, upc: form.upc || null, model: form.model || null,
      description: form.description || null, price: parseFloat(form.price) || 0,
      cost: form.cost ? parseFloat(form.cost) : null, stock: parseInt(form.stock, 10) || 0,
      unit: form.unit, status: form.status, image_url: form.image_url || null, tags: form.tags,
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
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">{item ? "Edit Item" : "Add Item"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
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

          {/* Image URL with preview */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Image URL</label>
            <input value={form.image_url} onChange={e => set("image_url", e.target.value)}
              placeholder="https://…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            {form.image_url && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.image_url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-[10px] text-gray-600">Preview</span>
              </div>
            )}
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
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag… (Enter)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              <button onClick={addTag} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors">
                Add
              </button>
            </div>
          </div>
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
