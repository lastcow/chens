"use client";
import { useEffect, useState, useCallback } from "react";
import { ArrowDownToLine, Plus, Search, X, CheckCircle } from "lucide-react";

interface Inbound {
  id: string; order_id: string | null; ms_order_number: string | null;
  warehouse_id: string; warehouse_name: string; expected_date: string | null;
  received_date: string | null; status: string; items: Item[];
  notes: string | null; created_at: string;
}

interface Item { sku: string; description?: string; quantity: number; unit_cost?: number; }

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-900/30 text-amber-400 border-amber-700/30",
  received:  "bg-green-900/30 text-green-400 border-green-700/30",
  cancelled: "bg-gray-900/50 text-gray-500 border-gray-800",
  partial:   "bg-blue-900/30 text-blue-400 border-blue-700/30",
};

export default function InboundPage() {
  const [records, setRecords] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [markingId, setMarkingId] = useState("");
  const limit = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    const res = await fetch(`/api/msbiz/inbound?${p}`);
    const d = await res.json();
    setRecords(d.inbound ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const markReceived = async (id: string) => {
    await fetch(`/api/msbiz/inbound/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "received", received_date: new Date().toISOString().split("T")[0] }),
    });
    setMarkingId("");
    fetchRecords();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Inbound</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} shipments</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/90 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Log Inbound
        </button>
      </div>

      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50" />
        </div>
        {["all","pending","partial","received","cancelled"].map(s => (
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
          <div className="text-center py-10 text-gray-600">No inbound records found.</div>
        ) : records.map(rec => (
          <div key={rec.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {rec.ms_order_number && (
                    <span className="font-mono text-amber-400 text-sm font-semibold">{rec.ms_order_number}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[rec.status] ?? ""}`}>{rec.status}</span>
                  <span className="text-xs text-gray-500">{rec.warehouse_name}</span>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {((rec.items as Item[]) || []).map((item, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                      <span className="font-mono text-blue-400">{item.sku}</span>
                      <span className="text-gray-500 mx-1">×</span>
                      <span className="text-white font-medium">{item.quantity}</span>
                      {item.unit_cost ? <span className="text-gray-500 ml-1">@ ${Number(item.unit_cost).toFixed(2)}</span> : null}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-gray-600">
                  {rec.expected_date && <span>Expected: {new Date(rec.expected_date).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>}
                  {rec.received_date && <span className="text-green-500">Received: {new Date(rec.received_date).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>}
                  {rec.notes && <span className="text-gray-500 truncate max-w-48">{rec.notes}</span>}
                </div>
              </div>

              <div className="shrink-0">
                {rec.status === "pending" && (
                  <button onClick={() => setMarkingId(rec.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 border border-green-700/20 hover:bg-green-900/40 text-xs transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Received
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {markingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Mark as Received?</h3>
            <p className="text-sm text-gray-400 mb-6">This will update inventory levels at the warehouse and mark received date as today.</p>
            <div className="flex gap-3">
              <button onClick={() => setMarkingId("")} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => markReceived(markingId)} className="flex-1 px-4 py-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-white text-sm font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showForm && <InboundForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchRecords(); }} />}
    </div>
  );
}

function InboundForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState([{ sku: "", quantity: "", unit_cost: "" }]);
  const [form, setForm] = useState({ order_id: "", warehouse_id: "", expected_date: "", notes: "" });

  useEffect(() => {
    fetch("/api/msbiz/warehouses?limit=100").then(r => r.json()).then(d => setWarehouses(d.warehouses ?? []));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i: number, k: string, v: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => setItems(prev => [...prev, { sku: "", quantity: "", unit_cost: "" }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!form.warehouse_id || !items[0].sku) { setError("Warehouse and at least one item required"); return; }
    setSaving(true); setError("");
    const parsedItems = items.filter(i => i.sku).map(i => ({
      sku: i.sku, quantity: parseInt(i.quantity, 10) || 1, unit_cost: parseFloat(i.unit_cost) || null,
    }));
    const res = await fetch("/api/msbiz/inbound", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: form.order_id || null, warehouse_id: form.warehouse_id,
        expected_date: form.expected_date || null, notes: form.notes || null, items: parsedItems }),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">Log Inbound Shipment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order ID</label>
              <input value={form.order_id} onChange={e => set("order_id", e.target.value)} placeholder="Optional"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Warehouse *</label>
              <select value={form.warehouse_id} onChange={e => set("warehouse_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                <option value="">Select…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Expected Date</label>
            <input type="date" value={form.expected_date} onChange={e => set("expected_date", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Items *</label>
              <button onClick={addItem} className="text-xs text-teal-400 hover:text-teal-300">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input value={item.sku} onChange={e => setItem(i, "sku", e.target.value)} placeholder="SKU"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500" />
                  <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} placeholder="Qty"
                    className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-teal-500" />
                  <input type="number" step="0.01" value={item.unit_cost} onChange={e => setItem(i, "unit_cost", e.target.value)} placeholder="$/unit"
                    className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="w-8 h-full flex items-center justify-center text-gray-600 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <input value={form.notes} onChange={e => set("notes", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-teal-500/90 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Log Inbound"}
          </button>
        </div>
      </div>
    </div>
  );
}
