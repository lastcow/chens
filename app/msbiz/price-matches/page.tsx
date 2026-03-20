"use client";
import { useEffect, useState, useCallback } from "react";
import { CreditCard, Plus, Search, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign } from "lucide-react";
import PriceMatchForm from "@/components/msbiz/PriceMatchForm";
import RecordPMDialog from "@/components/msbiz/RecordPMDialog";

interface PMItem {
  name: string;
  qty: number;
  unit_price: number;
}

interface PriceMatch {
  id: string;
  order_id: string;
  ms_order_number: string;
  status: string;
  status_value: string;
  status_label: string;
  status_color: string;
  original_price: number;
  refund_amount: number | null;
  refund_type: string | null;
  reward_amount: number | null;
  account_email: string | null;
  account_name: string | null;
  order_item_id: string | null;
  items: PMItem[] | null;
  expires_at: string | null;
  urgent: boolean;
  rewarded_to: string | null;
  notes: string | null;
}

// PM progress bar: pending→submitted→approved, rejected/expired = all red
const PM_STEPS = ["pending", "submitted", "approved"];
const PM_STEP_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  submitted: "#3b82f6",
  approved:  "#22c55e",
};

function PmProgressBar({ status }: { status: string }) {
  const val = status.includes(".") ? status.split(".").slice(1).join(".") : status;
  const isRejected = val === "rejected" || val === "expired";
  const stepIdx = PM_STEPS.indexOf(val);
  return (
    <div className="flex w-full h-[3px]">
      {PM_STEPS.map((step, i) => {
        let color = "#1f2937";
        if (isRejected) color = "#ef4444";
        else if (i <= stepIdx) color = PM_STEP_COLORS[step];
        return <div key={step} className="flex-1" style={{ backgroundColor: color }} />;
      })}
    </div>
  );
}

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
  const [recordPM, setRecordPM] = useState<PriceMatch | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Price Matches</h2>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-gray-500">
            <span>{total} total</span>
          </div>
        </div>
        <button
          onClick={() => { setEditId(""); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add PM
        </button>
      </div>

      {/* Filters */}
      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order number…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="all">All Status</option>
          {["draft","pending","submitted","approved","rejected","expired"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={() => setUrgentOnly(!urgentOnly)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${urgentOnly ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700"}`}
        >
          ⏰ Urgent only
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="sticky top-[140px] z-[9] bg-gray-900 border-b border-gray-800">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Order</th>
              <th className="text-left px-4 py-3">Items</th>
              <th className="text-right px-4 py-3">Subtotal</th>
              <th className="w-12 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : pms.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-600 py-10">No price matches found.</td></tr>
            ) : pms.map(pm => {
              const items = pm.items ?? [];
              const isHovered = hoveredRow === pm.id;
              return (
                <>
                  <tr
                    key={pm.id}
                    className="border-t border-gray-800/50 transition-colors"
                    style={{ backgroundColor: isHovered ? "#1f2937" : "transparent" }}
                    onMouseEnter={() => setHoveredRow(pm.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Col 1: Order info */}
                    <td className="px-5 py-3">
                      <div>
                        <div className="font-mono font-semibold text-amber-400 text-sm">
                          {pm.ms_order_number}
                        </div>
                        {pm.account_email && (
                          <div className="text-[11px] text-gray-500 mt-0.5">{pm.account_email}</div>
                        )}
                        {pm.urgent && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Col 2: Items */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {items.length > 0 ? items.map((item, i) => (
                          <div key={i} className="text-xs text-gray-300">
                            <span className="font-mono text-amber-500/80 font-medium">{item.qty}×</span>{" "}
                            <span className="text-gray-400">{item.name}</span>
                          </div>
                        )) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>
                    </td>

                    {/* Col 3: Subtotal */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono font-semibold text-gray-200 text-sm">
                        ${Number(pm.original_price).toFixed(2)}
                      </div>
                      {pm.refund_amount != null && (
                        <div className="text-[11px] font-mono text-green-400 mt-0.5">
                          −${Number(pm.refund_amount).toFixed(2)} refund
                        </div>
                      )}
                    </td>

                    {/* Col 4: Actions (Gmail-style hover overlay) */}
                    <td className="px-3 py-3 text-center">
                      <div
                        style={{
                          opacity: isHovered ? 1 : 0,
                          transition: "opacity 0.15s",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => setRecordPM(pm)}
                          title="Record PM"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "#1c1608",
                            border: "1px solid #92400e",
                            color: "#f59e0b",
                            cursor: "pointer",
                          }}
                        >
                          <DollarSign style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Progress bar row */}
                  <tr key={`${pm.id}-bar`}>
                    <td colSpan={4} className="p-0">
                      <PmProgressBar status={pm.status_value ?? pm.status} />
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit, total)} of ${total}` : "0 results"}
          </span>
          <div className="flex items-center gap-1">
            {[
              { icon: ChevronsLeft,  action: () => setPage(1),              disabled: page === 1 },
              { icon: ChevronLeft,   action: () => setPage(p => p-1),       disabled: page === 1 },
              { icon: ChevronRight,  action: () => setPage(p => p+1),       disabled: page === totalPages },
              { icon: ChevronsRight, action: () => setPage(totalPages),     disabled: page === totalPages },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${disabled ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:bg-gray-800"}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <PriceMatchForm
          pmId={editId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchPMs(); }}
        />
      )}

      {recordPM && (
        <RecordPMDialog
          pm={recordPM}
          onClose={() => setRecordPM(null)}
          onSaved={() => { setRecordPM(null); fetchPMs(); }}
        />
      )}
    </div>
  );
}
