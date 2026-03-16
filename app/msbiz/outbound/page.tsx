"use client";
import { useEffect, useState, useCallback } from "react";
import { ArrowUpFromLine, Plus, Search, Truck, Package, X, CheckCircle } from "lucide-react";

interface Outbound {
  id: string; order_id: string | null; ms_order_number: string | null;
  warehouse_id: string; warehouse_name: string; tracking_number: string | null;
  carrier: string | null; status: string; items: Item[];
  shipped_at: string | null; delivered_at: string | null;
  shipping_address: string | null; notes: string | null; created_at: string;
}

interface Item { sku: string; quantity: number; }

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-gray-800 text-gray-400 border-gray-700",
  processing: "bg-blue-900/30 text-blue-400 border-blue-700/30",
  shipped:    "bg-amber-900/30 text-amber-400 border-amber-700/30",
  delivered:  "bg-green-900/30 text-green-400 border-green-700/30",
  exception:  "bg-red-900/30 text-red-400 border-red-700/30",
};

export default function OutboundPage() {
  const [records, setRecords] = useState<Outbound[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const limit = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    const res = await fetch(`/api/msbiz/outbound?${p}`);
    const d = await res.json();
    setRecords(d.outbound ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const refreshTracking = async (rec: Outbound) => {
    if (!rec.tracking_number) return;
    setTrackingId(rec.id);
    await fetch("/api/msbiz/tracking", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id: rec.id, ref_type: "outbound", tracking_number: rec.tracking_number, carrier: rec.carrier, refresh: true }),
    });
    setTrackingId("");
    fetchRecords();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Outbound</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} shipments</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Ship Outbound
        </button>
      </div>

      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order / tracking…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
        </div>
        {["all","pending","processing","shipped","delivered","exception"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
              statusFilter === s
                ? s === "all" ? "bg-gray-700 text-white border-gray-600" : STATUS_COLORS[s]
                : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700"
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />)
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-600">No outbound shipments found.</div>
        ) : records.map(rec => (
          <div key={rec.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {rec.ms_order_number && <span className="font-mono text-amber-400 text-sm font-semibold">{rec.ms_order_number}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[rec.status] ?? ""}`}>{rec.status}</span>
                  <span className="text-xs text-gray-500">{rec.warehouse_name}</span>
                  {rec.tracking_number && (
                    <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {rec.tracking_number}
                      {rec.carrier && <span className="text-gray-600">({rec.carrier})</span>}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {((rec.items as Item[]) || []).map((item, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-gray-500" />
                      <span className="font-mono text-blue-400">{item.sku}</span>
                      <span className="text-gray-500">×</span>
                      <span className="text-white font-medium">{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-gray-600">
                  {rec.shipped_at && <span>Shipped: {new Date(rec.shipped_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>}
                  {rec.delivered_at && <span className="text-green-500">Delivered: {new Date(rec.delivered_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>}
                  {rec.shipping_address && <span className="truncate max-w-56">{rec.shipping_address}</span>}
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                {rec.tracking_number && rec.status !== "delivered" && (
                  <button onClick={() => refreshTracking(rec)} disabled={trackingId === rec.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-700/20 hover:bg-blue-900/40 text-xs transition-colors disabled:opacity-50">
                    <Truck className={`w-3.5 h-3.5 ${trackingId === rec.id ? "animate-bounce" : ""}`} />
                    {trackingId === rec.id ? "Syncing…" : "Refresh Tracking"}
                  </button>
                )}
                {rec.status === "delivered" && (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Delivered
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && <OutboundForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchRecords(); }} />}
    </div>
  );
}

function OutboundForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState([{ sku: "", quantity: "" }]);
  const [form, setForm] = useState({
    order_id: "", warehouse_id: "", tracking_number: "", carrier: "UPS",
    shipped_at: new Date().toISOString().split("T")[0], shipping_address: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/msbiz/warehouses?limit=100").then(r => r.json()).then(d => setWarehouses(d.warehouses ?? []));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i: number, k: string, v: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const submit = async () => {
    if (!form.warehouse_id || !items[0].sku) { setError("Warehouse and at least one item required"); return; }
    setSaving(true); setError("");
    const parsedItems = items.filter(i => i.sku).map(i => ({ sku: i.sku, quantity: parseInt(i.quantity, 10) || 1 }));
    const res = await fetch("/api/msbiz/outbound", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: form.order_id || null, warehouse_id: form.warehouse_id,
        tracking_number: form.tracking_number || null, carrier: form.carrier || null,
        shipped_at: form.shipped_at || null, shipping_address: form.shipping_address || null,
        notes: form.notes || null, items: parsedItems,
      }),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">Log Outbound Shipment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order ID</label>
              <input value={form.order_id} onChange={e => set("order_id", e.target.value)} placeholder="Optional"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Warehouse *</label>
              <select value={form.warehouse_id} onChange={e => set("warehouse_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="">Select…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tracking #</label>
              <input value={form.tracking_number} onChange={e => set("tracking_number", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Carrier</label>
              <select value={form.carrier} onChange={e => set("carrier", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                {["UPS","FedEx","USPS","DHL","Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ship Date</label>
            <input type="date" value={form.shipped_at} onChange={e => set("shipped_at", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Items *</label>
              <button onClick={() => setItems(p => [...p, { sku: "", quantity: "" }])} className="text-xs text-indigo-400 hover:text-indigo-300">+ Add</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input value={item.sku} onChange={e => setItem(i, "sku", e.target.value)} placeholder="SKU"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
                  <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} placeholder="Qty"
                    className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500" />
                  {items.length > 1 && (
                    <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="w-8 flex items-center justify-center text-gray-600 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Shipping Address</label>
            <input value={form.shipping_address} onChange={e => set("shipping_address", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <input value={form.notes} onChange={e => set("notes", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Log Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}
