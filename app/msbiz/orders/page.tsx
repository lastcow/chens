"use client";
import { useEffect, useState, useCallback } from "react";
import { Package, Plus, Search, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, Truck, Tag } from "lucide-react";
import OrderForm from "@/components/msbiz/OrderForm";
import ShippingDialog from "@/components/msbiz/ShippingDialog";
import AssignPMDialog from "@/components/msbiz/AssignPMDialog";

interface OrderItem { merchandise_id: string; name: string; qty: number; unit_price: number; }
interface Order {
  id: string; ms_order_number: string; order_date: string; status: string;
  items: OrderItem[]; total: number; pm_status: string; pm_deadline_at: string | null;
  account_email: string; account_name: string | null;
  tracking_number: string | null; carrier: string | null; inbound_status: string; exception_count: number;
}

// 5-bar stacked status indicator
// bars from bottom→top: placed, processing, shipped, delivered, confirmed
// exception: all red; cancelled: all gray
const STATUS_STEP: Record<string, number> = {
  pending:    1,
  processing: 2,
  shipped:    3,
  delivered:  4,
  confirmed:  5,
  cancelled:  0,
  exception:  -1, // special: all red
};
const STATUS_BAR_COLORS = [
  "bg-amber-400",   // bar 1 — placed
  "bg-blue-400",    // bar 2 — processing
  "bg-blue-500",    // bar 3 — shipped
  "bg-green-500",   // bar 4 — delivered
  "bg-green-400",   // bar 5 — confirmed
];

function StatusBars({ status }: { status: string }) {
  const step = STATUS_STEP[status] ?? 1;
  const isException = step === -1;
  return (
    <div className="flex flex-col-reverse gap-[2px] items-center" title={status}>
      {STATUS_BAR_COLORS.map((color, i) => {
        const filled = isException || i < step;
        const barColor = isException ? "bg-red-500" : (filled ? color : "bg-gray-800");
        return (
          <div key={i} className={`w-[5px] h-[5px] rounded-sm ${barColor}`} />
        );
      })}
    </div>
  );
}
// 3-bar stacked PM indicator (bottom→top): pending, in-progress, done
const PM_STEP: Record<string, number> = {
  unpmed:    1,
  submitted: 2,
  approved:  3,
  rejected:  -1, // all red
  expired:   -1,
  ineligible: 0, // all gray
};
const PM_BAR_COLORS = ["bg-amber-400", "bg-blue-400", "bg-green-500"];

function PmBars({ status }: { status: string }) {
  const step = PM_STEP[status] ?? 1;
  const isError = step === -1;
  return (
    <div className="flex flex-col-reverse gap-[2px] items-center" title={status}>
      {PM_BAR_COLORS.map((color, i) => {
        const filled = isError || i < step;
        const barColor = isError ? "bg-red-500" : (filled ? color : "bg-gray-800");
        return <div key={i} className={`w-[5px] h-[7px] rounded-sm ${barColor}`} />;
      })}
    </div>
  );
}

function relDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 30)  return `${diff} days ago`;
  if (diff < 365) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

// Shipping progress — steps with labels
const SHIPPING_STEPS = ["pending", "ordered", "in_transit", "out_for_delivery", "delivered"];
const INBOUND_LABEL: Record<string, string> = {
  pending:           "Pending",
  ordered:           "Ordered",
  in_transit:        "In Transit",
  out_for_delivery:  "Out for Delivery",
  delivered:         "Delivered",
};

const CARRIER_COLOR: Record<string, string> = {
  UPS:   "text-amber-400",
  FedEx: "text-purple-400",
  USPS:  "text-blue-400",
};



export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pmFilter, setPmFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm]       = useState(false);
  const [editOrder, setEditOrder]     = useState<Order | null>(null);
  const [shippingOrder, setShipping]  = useState<Order | null>(null);
  const [pmOrder, setPmOrder]         = useState<Order | null>(null);
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
          <thead className="sticky top-[140px] z-[9] bg-gray-900">
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b-2 border-gray-700">
              <th className="text-left px-3 py-3 w-6"></th>
              <th className="text-left px-3 py-3 whitespace-nowrap">Order</th>
              <th className="text-left px-3 py-3">Items</th>
              <th className="text-left px-3 py-3 whitespace-nowrap">Shipping</th>
              <th className="text-center px-3 py-3 whitespace-nowrap">PM</th>
              <th className="text-center px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-600 py-10">No orders found.</td></tr>
            ) : orders.map(o => {
              const itemList: OrderItem[] = Array.isArray(o.items) ? o.items : [];
              const shipStep = SHIPPING_STEPS.indexOf(o.inbound_status);
              const shipPct  = shipStep < 0 ? 0 : Math.round((shipStep / (SHIPPING_STEPS.length - 1)) * 100);
              const hasShipping = !!(o.tracking_number || (o.inbound_status && o.inbound_status !== "pending"));
              const shipColor =
                !hasShipping               ? "bg-gray-700" :
                o.inbound_status === "delivered" ? "bg-green-500" :
                shipStep >= 2              ? "bg-blue-500" :
                shipStep >= 1              ? "bg-amber-500" :
                                             "bg-gray-600";

              return (
              <>
              <tr key={o.id} className="hover:bg-gray-800/30 transition-colors group">
                {/* Status bars — narrow, full height */}
                <td className="pl-3 pr-1 py-3 w-5 align-middle">
                  <StatusBars status={o.status} />
                </td>

                {/* Order # + relative date + account — no wrap */}
                <td className="pl-1 pr-3 py-3 whitespace-nowrap">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-amber-400 text-sm font-semibold leading-tight">{o.ms_order_number}</span>
                    <span className="text-[11px] text-gray-500">{relDate(o.order_date)}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{o.account_name || o.account_email}</div>
                  {o.exception_count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> {o.exception_count}
                    </div>
                  )}
                </td>

                {/* Items */}
                <td className="px-3 py-3 w-full min-w-0 max-w-0">
                  <div className="space-y-0.5">
                    {itemList.length === 0 ? (
                      <span className="text-gray-600 text-xs">—</span>
                    ) : itemList.map((it, idx) => (
                      <div key={idx} className="flex items-baseline gap-1.5 text-xs">
                        <span className="text-gray-500 font-mono shrink-0">{it.qty}×</span>
                        <span className="text-gray-300 truncate">{it.name}</span>
                        <span className="text-gray-600 shrink-0 font-mono">${Number(it.unit_price).toFixed(2)}/ea</span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Shipping label */}
                <td className="px-3 py-3 whitespace-nowrap">
                  {hasShipping ? (
                    <div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        {o.carrier && (
                          <span className={`font-semibold ${CARRIER_COLOR[o.carrier] ?? "text-gray-400"}`}>{o.carrier}:</span>
                        )}
                        <span>{INBOUND_LABEL[o.inbound_status] ?? o.inbound_status}</span>
                      </div>
                      {o.tracking_number && (
                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">{o.tracking_number}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-700 text-xs">—</span>
                  )}
                </td>

                {/* PM indicator — 3-bar vertical */}
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    <PmBars status={o.pm_status} />
                    {pmDeadlineBadge(o)}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(() => {
                      const pmActive = ["submitted","approved","rejected"].includes(o.pm_status);
                      return (
                        <button
                          onClick={() => !pmActive && setPmOrder(o)}
                          disabled={pmActive}
                          title={pmActive ? `PM already ${o.pm_status}` : "Assign to PM Queue"}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            pmActive
                              ? "text-gray-700 cursor-not-allowed opacity-40"
                              : o.pm_status === "unpmed"
                                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-gray-600 hover:text-amber-400 hover:bg-amber-500/10"
                          }`}>
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                    <button onClick={() => setShipping(o)} title="Add/Edit Shipping"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                      <Truck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditOrder(o)} title="Edit Order"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a href={`/msbiz/orders/${o.id}`} title="View Detail"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>

              {/* Full-width shipping progress bar — same style as admin PO */}
              <tr key={`${o.id}-bar`}>
                <td colSpan={6} className="px-0 pt-0 pb-3">
                  <div className="h-[3px] w-full bg-gray-800"
                    title={hasShipping ? `${INBOUND_LABEL[o.inbound_status] ?? o.inbound_status} (${shipPct}%)` : "No shipping info"}>
                    <div className={`h-full transition-all duration-500 ${shipColor}`} style={{ width: `${hasShipping ? Math.max(shipPct, 4) : 0}%` }} />
                  </div>
                </td>
              </tr>
              </>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{total > 0 ? `${(page-1)*limit+1}–${Math.min(page*limit,total)} of ${total} orders` : "0 results"}</span>
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

      {editOrder && (
        <OrderForm
          orderId={editOrder.id}
          onClose={() => setEditOrder(null)}
          onSaved={() => { setEditOrder(null); fetchOrders(); }}
        />
      )}

      {pmOrder && (
        <AssignPMDialog
          order={pmOrder}
          onClose={() => setPmOrder(null)}
          onSaved={() => {
            // Optimistic update — flip pm_status immediately
            setOrders(prev => prev.map(o => o.id === pmOrder.id ? { ...o, pm_status: "submitted" } : o));
            setPmOrder(null);
            fetchOrders(); // then confirm from server
          }}
        />
      )}

      {shippingOrder && (
        <ShippingDialog
          orderId={shippingOrder.id}
          initialTracking={shippingOrder.tracking_number}
          initialCarrier={shippingOrder.carrier}
          onClose={() => setShipping(null)}
          onSaved={(tracking, carrier) => {
            setOrders(prev => prev.map(o => o.id === shippingOrder.id
              ? { ...o, tracking_number: tracking, carrier }
              : o));
            setShipping(null);
            fetchOrders(); // refresh inbound_status from DB
          }}
        />
      )}
    </div>
  );
}
