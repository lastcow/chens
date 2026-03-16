"use client";
import { useEffect, useState, useCallback } from "react";
import { DollarSign, Plus, TrendingDown, TrendingUp, X } from "lucide-react";

interface Cost {
  id: string; type: string; ref_id: string | null; ref_type: string | null;
  amount: number; currency: string; description: string | null; occurred_at: string;
  created_at: string;
}

interface Summary {
  by_type: { type: string; total: number; count: number }[];
  grand_total: number;
  monthly: { month: string; total: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  order_cost:        "text-amber-400",
  inbound_handling:  "text-blue-400",
  outbound_shipping: "text-indigo-400",
  pm_refund:         "text-green-400",
  other:             "text-gray-400",
};

const TYPE_LABELS: Record<string, string> = {
  order_cost:        "Order Cost",
  inbound_handling:  "Inbound Handling",
  outbound_shipping: "Outbound Shipping",
  pm_refund:         "PM Refund",
  other:             "Other",
};

export default function CostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const limit = 25;

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (typeFilter !== "all") p.set("type", typeFilter);
    const [costsRes, summaryRes] = await Promise.all([
      fetch(`/api/msbiz/costs?${p}`),
      fetch("/api/msbiz/costs/summary"),
    ]);
    const costsData = await costsRes.json();
    const summaryData = await summaryRes.json();
    setCosts(costsData.costs ?? []);
    setTotal(costsData.total ?? 0);
    setSummary(summaryData);
    setLoading(false);
  }, [page, typeFilter]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);
  useEffect(() => { setPage(1); }, [typeFilter]);

  const maxMonth = summary?.monthly?.reduce((m, r) => Math.max(m, Number(r.total)), 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Costs</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Log Cost
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Grand Total</div>
            <div className="text-3xl font-bold font-mono text-white">${Number(summary.grand_total).toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">{total} entries</div>
          </div>
          {(summary.by_type ?? []).slice(0, 2).map(row => (
            <div key={row.type} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{TYPE_LABELS[row.type] ?? row.type}</div>
              <div className={`text-2xl font-bold font-mono ${TYPE_COLORS[row.type] ?? "text-white"}`}>${Number(row.total).toFixed(0)}</div>
              <div className="text-xs text-gray-600 mt-1">{row.count} entries</div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly bar chart */}
      {summary?.monthly && summary.monthly.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Monthly Costs</div>
          <div className="flex items-end gap-2 h-24">
            {summary.monthly.slice(-12).map(m => {
              const pct = maxMonth > 0 ? (Number(m.total) / maxMonth) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-gray-600 font-mono">${(Number(m.total)/1000).toFixed(0)}k</div>
                  <div className="w-full bg-amber-500/20 rounded-sm relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute inset-0 bg-amber-500 rounded-sm opacity-70" />
                  </div>
                  <div className="text-[9px] text-gray-600 font-mono">{m.month.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By type breakdown */}
      {summary?.by_type && summary.by_type.length > 2 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">By Type</div>
          <div className="space-y-3">
            {summary.by_type.map(row => {
              const pct = summary.grand_total > 0 ? (Number(row.total) / Number(summary.grand_total)) * 100 : 0;
              return (
                <div key={row.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${TYPE_COLORS[row.type] ?? "text-gray-400"}`}>{TYPE_LABELS[row.type] ?? row.type}</span>
                    <span className="text-xs font-mono text-gray-300">${Number(row.total).toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full">
                    <div className={`h-full rounded-full ${TYPE_COLORS[row.type]?.replace("text-","bg-") ?? "bg-gray-500"} opacity-70`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex gap-2 flex-wrap">
        {["all", ...Object.keys(TYPE_LABELS)].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              typeFilter === t
                ? t === "all" ? "bg-gray-700 text-white border-gray-600" : `${TYPE_COLORS[t]?.replace("text-","bg-")?.replace("400","900/30") ?? "bg-gray-800"} ${TYPE_COLORS[t] ?? "text-white"} border-gray-700`
                : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700"
            }`}>
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Ledger */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Type / Description</th>
              <th className="text-left px-3 py-3">Reference</th>
              <th className="text-center px-3 py-3">Date</th>
              <th className="text-right px-5 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={4} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : costs.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-600 py-10">No costs logged yet.</td></tr>
            ) : costs.map(cost => (
              <tr key={cost.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className={`text-xs font-medium ${TYPE_COLORS[cost.type] ?? "text-gray-400"}`}>{TYPE_LABELS[cost.type] ?? cost.type}</div>
                  {cost.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-56">{cost.description}</div>}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-gray-500 truncate max-w-32">{cost.ref_id ? `${cost.ref_type} ${cost.ref_id.slice(0,8)}…` : "—"}</td>
                <td className="px-3 py-3 text-center text-xs text-gray-500 font-mono">
                  {new Date(cost.occurred_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                </td>
                <td className="px-5 py-3 text-right font-mono font-bold text-white">${Number(cost.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > limit && (
          <div className="border-t border-gray-800 px-5 py-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">{(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p-1)} disabled={page === 1} className="px-3 py-1 rounded text-xs text-gray-400 hover:bg-gray-800 disabled:text-gray-700">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*limit >= total} className="px-3 py-1 rounded text-xs text-gray-400 hover:bg-gray-800 disabled:text-gray-700">Next</button>
            </div>
          </div>
        )}
      </div>

      {showForm && <CostForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchCosts(); }} />}
    </div>
  );
}

function CostForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "order_cost", ref_id: "", ref_type: "order", amount: "", description: "",
    occurred_at: new Date().toISOString().split("T")[0],
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount) { setError("Amount required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/msbiz/costs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), ref_id: form.ref_id || null, occurred_at: form.occurred_at || null }),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Log Cost</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Amount ($) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ref Type</label>
              <select value={form.ref_type} onChange={e => set("ref_type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                {["order","inbound","outbound"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ref ID</label>
              <input value={form.ref_id} onChange={e => set("ref_id", e.target.value)} placeholder="Optional"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
            <input type="date" value={form.occurred_at} onChange={e => set("occurred_at", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
            <input value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Log Cost"}
          </button>
        </div>
      </div>
    </div>
  );
}
