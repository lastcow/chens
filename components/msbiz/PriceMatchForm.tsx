"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Order { id: string; ms_order_number: string; status: string; pm_status: string; pm_deadline_at: string | null; }

interface Props { pmId?: string; onClose: () => void; onSaved: () => void; }

export default function PriceMatchForm({ pmId, onClose, onSaved }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    order_id: "", current_unit_cost: "", matched_unit_cost: "", unit_count: "",
    notes: "", status: "draft",
  });

  useEffect(() => {
    // Fetch PM-eligible orders (status='unpmed')
    fetch("/api/msbiz/orders?pm_status=unpmed&limit=100")
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(() => {});

    if (pmId) {
      fetch(`/api/msbiz/price-matches/${pmId}`)
        .then(r => r.json())
        .then(d => {
          if (d.price_match) {
            const pm = d.price_match;
            setForm({
              order_id: pm.order_id, current_unit_cost: pm.current_unit_cost ?? "",
              matched_unit_cost: pm.matched_unit_cost ?? "", unit_count: pm.unit_count ?? "",
              notes: pm.notes ?? "", status: pm.status ?? "draft",
            });
          }
        })
        .catch(() => {});
    }
  }, [pmId]);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.order_id || !form.current_unit_cost || !form.matched_unit_cost || !form.unit_count) {
      setError("Order, current cost, matched cost, and quantity are required"); return;
    }
    const current = parseFloat(form.current_unit_cost);
    const matched = parseFloat(form.matched_unit_cost);
    if (matched >= current) { setError("Matched cost must be lower than current cost"); return; }

    setSaving(true); setError("");
    const method = pmId ? "PUT" : "POST";
    const url = pmId ? `/api/msbiz/price-matches/${pmId}` : "/api/msbiz/price-matches";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: form.order_id, current_unit_cost: current, matched_unit_cost: matched,
        unit_count: parseInt(form.unit_count, 10), notes: form.notes || null, status: form.status,
      }),
    });

    if (res.ok) { onSaved(); } else {
      const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false);
    }
  };

  const curr = parseFloat(form.current_unit_cost) || 0;
  const matched = parseFloat(form.matched_unit_cost) || 0;
  const qty = parseInt(form.unit_count, 10) || 0;
  const savingsPerUnit = (curr - matched).toFixed(2);
  const totalSavings = (qty * (curr - matched)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">{pmId ? "Edit Price Match" : "Add Price Match"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order *</label>
            <select value={form.order_id} onChange={e => set("order_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">Select order…</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.ms_order_number} (eligible until {o.pm_deadline_at ? new Date(o.pm_deadline_at).toLocaleDateString() : "—"})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-600 mt-1">Orders with pm_status=unpmed and pm_deadline_at in future</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Current Cost (per unit) *</label>
              <input type="number" step="0.01" value={form.current_unit_cost} onChange={e => set("current_unit_cost", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Matched Cost (per unit) *</label>
              <input type="number" step="0.01" value={form.matched_unit_cost} onChange={e => set("matched_unit_cost", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Quantity *</label>
              <input type="number" value={form.unit_count} onChange={e => set("unit_count", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Savings per unit</span>
              <span className="font-mono font-bold text-green-400">${savingsPerUnit}</span>
            </div>
            <div className="border-t border-gray-700/50 pt-2 flex justify-between">
              <span className="text-gray-400">Total savings</span>
              <span className="font-mono font-bold text-green-400 text-lg">${totalSavings}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              placeholder="Evidence, vendor info, references, etc."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          {pmId && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {["draft","pending","submitted","approved","rejected","expired"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving…" : pmId ? "Update" : "Create Price Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
