"use client";
import { useEffect, useState, useCallback } from "react";
import { Package, Plus, Search, Filter, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import OrderForm from "@/components/msbiz/OrderForm";

interface Order {
  id: string; ms_order_number: string; order_date: string; status: string;
  total: number; pm_status: string; pm_deadline_at: string | null;
  account_email: string; account_name: string | null;
  tracking_number: string | null; inbound_status: string; exception_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-gray-800 text-gray-400 border-gray-700",
  processing: "bg-blue-900/30 text-blue-400 border-blue-700/30",
  shipped:    "bg-amber-900/30 text-amber-400 border-amber-700/30",
  delivered:  "bg-green-900/30 text-green-400 border-green-700/30",
  cancelled:  "bg-gray-900 text-gray-600 border-gray-800",
  exception:  "bg-red-900/30 text-red-400 border-red-700/30",
};

const PM_COLORS: Record<string, string> = {
  unpmed:    "bg-amber-900/20 text-amber-400 border-amber-700/20",
  submitted: "bg-blue-900/20 text-blue-400 border-blue-700/20",
  approved:  "bg-green-900/20 text-green-400 border-green-700/20",
  rejected:  "bg-red-900/20 text-red-400 border-red-700/20",
  ineligible:"bg-gray-800 text-gray-500 border-gray-700",
  expired:   "bg-red-900/10 text-red-600 border-red-900/30",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pmFilter, setPmFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const limit = 25;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search)             p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (pmFilter !== "all")     p.set("pm_status", pmFilter);
    const res = await fetch(`/api/msbiz/orders?${p}`);
    const d = await res.json();
    setOrders(d.orders ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, statusFilter, pmFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search, statusFilter, pmFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const pmDeadlineBadge = (o: Order) => {
    if (!o.pm_deadline_at || o.pm_status !== "unpmed") return null;
    const days = Math.ceil((new Date(o.pm_deadline_at).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="text-[10px] text-red-500">Expired</span>;
    if (days <= 3) return <span className="text-[10px] text-red-400 font-medium">{days}d left!</span>;
    if (days <= 7) return <span className="text-[10px] text-amber-400">{days}d left</span>;
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
          <option value="all">All Status</option>
          {["pending","processing","shipped","delivered","cancelled","exception"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <select value={pmFilter} onChange={e => setPmFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50">
          <option value="all">All PM</option>
          {["unpmed","submitted","approved","rejected","ineligible","expired"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="sticky top-[140px] z-[9] bg-gray-900 border-b border-gray-800">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Order #</th>
              <th className="text-left px-3 py-3">Account</th>
              <th className="text-center px-3 py-3">Date</th>
              <th className="text-center px-3 py-3">Total</th>
              <th className="text-center px-3 py-3">Status</th>
              <th className="text-center px-3 py-3">PM</th>
              <th className="text-center px-3 py-3">Tracking</th>
              <th className="text-center px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-600 py-10">No orders found.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-mono text-amber-400 text-sm font-medium">{o.ms_order_number}</div>
                  {o.exception_count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> {o.exception_count} exception{o.exception_count > 1 ? "s" : ""}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-400 text-xs truncate max-w-32">{o.account_name || o.account_email}</td>
                <td className="px-3 py-3 text-center text-xs text-gray-500 font-mono">
                  {new Date(o.order_date).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit" })}
                </td>
                <td className="px-3 py-3 text-center font-mono text-gray-300">${Number(o.total).toFixed(2)}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status] ?? "bg-gray-800 text-gray-500 border-gray-700"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PM_COLORS[o.pm_status] ?? ""}`}>
                      {o.pm_status}
                    </span>
                    {pmDeadlineBadge(o)}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {o.tracking_number
                    ? <span className="font-mono text-xs text-blue-400">{o.tracking_number}</span>
                    : <span className="text-gray-700 text-xs">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  <a href={`/msbiz/orders/${o.id}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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

      {showForm && <OrderForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchOrders(); }} />}
    </div>
  );
}
