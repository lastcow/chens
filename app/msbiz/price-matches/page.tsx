"use client";
import { useEffect, useState, useCallback } from "react";
import { CreditCard, Plus, Search, Filter, ExternalLink, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import PriceMatchForm from "@/components/msbiz/PriceMatchForm";

interface PriceMatch {
  id: string; order_id: string; ms_order_number: string; subtotal: number;
  current_unit_cost: number; matched_unit_cost: number; unit_count: number;
  savings: number; status: string; submission_date: string;
  approved_at: string | null; approved_by: string | null; notes: string | null;
  order_deadline_at: string | null; days_until_deadline: number | null;
  urgent: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-800 text-gray-400 border-gray-700",
  pending:   "bg-amber-900/30 text-amber-400 border-amber-700/30",
  submitted: "bg-blue-900/30 text-blue-400 border-blue-700/30",
  approved:  "bg-green-900/30 text-green-400 border-green-700/30",
  rejected:  "bg-red-900/30 text-red-400 border-red-700/30",
  expired:   "bg-gray-900/50 text-gray-500 border-gray-700",
};

export default function PriceMatchesPage() {
  const [pms, setPms] = useState<PriceMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState("");
  const limit = 20;

  const fetchPMs = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (urgentOnly) p.set("urgent_only", "true");
    const res = await fetch(`/api/msbiz/price-matches?${p}`);
    const d = await res.json();
    setPms(d.price_matches ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter, urgentOnly]);

  useEffect(() => { fetchPMs(); }, [fetchPMs]);
  useEffect(() => { setPage(1); }, [search, statusFilter, urgentOnly]);

  const totalPages = Math.ceil(total / limit) || 1;
  const totalSavings = pms.filter(pm => pm.status === "approved").reduce((s, pm) => s + Number(pm.savings), 0);
  const totalPending = pms.filter(pm => pm.status === "pending").reduce((s, pm) => s + Number(pm.savings), 0);

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white">Price Matches</h2>
          <div className="flex gap-6 mt-2 text-xs text-gray-500">
            <span>{total} total</span>
            <span className="text-green-400">• ${totalSavings.toFixed(2)} approved</span>
            <span className="text-amber-400">• ${totalPending.toFixed(2)} pending</span>
          </div>
        </div>
        <button onClick={() => { setEditId(""); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Price Match
        </button>
      </div>

      {/* Filters */}
      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50">
          <option value="all">All Status</option>
          {["draft","pending","submitted","approved","rejected","expired"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <button onClick={() => setUrgentOnly(!urgentOnly)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${urgentOnly ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700"}`}>
          ⏰ Urgent only
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="sticky top-[140px] z-[9] bg-gray-900 border-b border-gray-800">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Order / Status</th>
              <th className="text-center px-3 py-3">Current Cost</th>
              <th className="text-center px-3 py-3">Matched Cost</th>
              <th className="text-center px-3 py-3">Quantity</th>
              <th className="text-right px-3 py-3">Savings</th>
              <th className="text-center px-3 py-3">Deadline</th>
              <th className="text-center px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : pms.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-600 py-10">No price matches found.</td></tr>
            ) : pms.map(pm => (
              <tr key={pm.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="space-y-1">
                    <div className="font-mono text-blue-400 text-sm font-medium">{pm.ms_order_number}</div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[pm.status] ?? ""}`}>
                      {pm.status}
                    </span>
                    {pm.urgent && <div className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5"><AlertTriangle className="w-3 h-3" /> Urgent</div>}
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-mono text-gray-300">
                  ${Number(pm.current_unit_cost).toFixed(2)} <span className="text-gray-600 text-xs">ea</span>
                </td>
                <td className="px-3 py-3 text-center font-mono text-green-400">
                  ${Number(pm.matched_unit_cost).toFixed(2)} <span className="text-green-600 text-xs">ea</span>
                </td>
                <td className="px-3 py-3 text-center font-mono text-gray-300">{pm.unit_count}</td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-block font-bold text-green-400 font-mono">
                    ${Number(pm.savings).toFixed(2)}
                  </span>
                  {pm.status === "approved" && pm.approved_at && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      by {pm.approved_by || "system"}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {pm.days_until_deadline ? (
                    <div>
                      {pm.days_until_deadline <= 3 ? (
                        <div className="flex items-center justify-center gap-1 text-red-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">{pm.days_until_deadline}d</span>
                        </div>
                      ) : pm.days_until_deadline <= 7 ? (
                        <div className="text-xs text-amber-400 font-medium">{pm.days_until_deadline}d left</div>
                      ) : (
                        <div className="text-xs text-gray-500">{pm.days_until_deadline}d</div>
                      )}
                    </div>
                  ) : pm.status === "approved" ? (
                    <div className="flex items-center justify-center text-green-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <button onClick={() => { setEditId(pm.id); setShowForm(true); }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total}` : "0 results"}</span>
          <div className="flex items-center gap-1">
            {[{icon: ChevronsLeft, action: () => setPage(1), disabled: page === 1},
              {icon: ChevronLeft,  action: () => setPage(p => p-1), disabled: page === 1},
              {icon: ChevronRight, action: () => setPage(p => p+1), disabled: page === totalPages},
              {icon: ChevronsRight,action: () => setPage(totalPages), disabled: page === totalPages}
            ].map(({icon: Icon, action, disabled}, i) => (
              <button key={i} onClick={action} disabled={disabled}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${disabled ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:bg-gray-800"}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && <PriceMatchForm pmId={editId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchPMs(); }} />}
    </div>
  );
}
