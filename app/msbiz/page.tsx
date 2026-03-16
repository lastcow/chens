"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, CreditCard, AlertTriangle, Warehouse, Bell, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface Dashboard {
  orders?: Record<string, number>;
  orders_total?: number;
  price_matches?: { total_pending: number; urgent: number; expired: number; total_savings: number };
  exceptions?: { severity: string; count: number }[];
  reminders_due?: number;
  inventory?: { sku_count: number; total_units: number };
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; href?: string;
}) {
  const inner = (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${color.replace("text-", "bg-").replace("400", "500/10")} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function MsbizDashboard() {
  const [data, setData] = useState<Dashboard>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/msbiz/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const orders = data.orders ?? {};
  const pm = data.price_matches ?? { total_pending: 0, urgent: 0, expired: 0, total_savings: 0 };
  const exceptions = data.exceptions ?? [];
  const openExceptions = exceptions.reduce((s, e) => s + Number(e.count), 0);
  const criticalExceptions = exceptions.find(e => e.severity === "critical")?.count ?? 0;

  const orderStatusGroups = [
    { label: "Pending",   value: orders.pending ?? 0,   color: "text-gray-400" },
    { label: "Processing",value: orders.processing ?? 0, color: "text-blue-400" },
    { label: "Shipped",   value: orders.shipped ?? 0,    color: "text-amber-400" },
    { label: "Delivered", value: orders.delivered ?? 0,  color: "text-green-400" },
    { label: "Exception", value: orders.exception ?? 0,  color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package} label="Total Orders" href="/msbiz/orders"
          value={loading ? "…" : data.orders_total ?? 0}
          color="text-amber-400"
        />
        <StatCard
          icon={CreditCard} label="PM Pending" href="/msbiz/price-matches"
          value={loading ? "…" : pm.total_pending ?? 0}
          sub={pm.urgent ? `${pm.urgent} urgent` : pm.total_savings ? `$${Number(pm.total_savings).toFixed(0)} saved` : undefined}
          color={pm.urgent ? "text-red-400" : "text-blue-400"}
        />
        <StatCard
          icon={AlertTriangle} label="Open Exceptions" href="/msbiz/exceptions"
          value={loading ? "…" : openExceptions}
          sub={criticalExceptions ? `${criticalExceptions} critical` : undefined}
          color={openExceptions > 0 ? "text-red-400" : "text-green-400"}
        />
        <StatCard
          icon={Warehouse} label="Inventory SKUs" href="/msbiz/warehouse"
          value={loading ? "…" : data.inventory?.sku_count ?? 0}
          sub={data.inventory?.total_units ? `${data.inventory.total_units} units` : undefined}
          color="text-purple-400"
        />
      </div>

      {/* Order Status Breakdown + PM Urgency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" /> Orders by Status
          </h3>
          <div className="space-y-3">
            {orderStatusGroups.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{s.label}</span>
                <span className={`text-sm font-mono font-semibold ${s.color}`}>{loading ? "…" : s.value}</span>
              </div>
            ))}
          </div>
          <Link href="/msbiz/orders" className="mt-4 block text-xs text-amber-400 hover:text-amber-300 transition-colors">
            View all orders →
          </Link>
        </div>

        {/* PM urgency */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> Price Match Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Pending submission</span>
              <span className="text-sm font-mono text-amber-400">{loading ? "…" : pm.total_pending ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Urgent (≤3 days)</span>
              <span className="text-sm font-mono text-red-400">{loading ? "…" : pm.urgent ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Expired (missed)</span>
              <span className="text-sm font-mono text-gray-500">{loading ? "…" : pm.expired ?? 0}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-3">
              <span className="text-sm text-gray-400">Total savings approved</span>
              <span className="text-sm font-mono text-green-400">${loading ? "…" : Number(pm.total_savings ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <Link href="/msbiz/price-matches?status=pending" className="mt-4 block text-xs text-blue-400 hover:text-blue-300 transition-colors">
            View price matches →
          </Link>
        </div>
      </div>

      {/* Exceptions breakdown */}
      {openExceptions > 0 && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Open Exceptions by Severity
          </h3>
          <div className="flex gap-4">
            {[["critical","text-red-400"],["high","text-orange-400"],["medium","text-amber-400"],["low","text-gray-400"]].map(([sev, color]) => {
              const count = exceptions.find(e => e.severity === sev)?.count ?? 0;
              if (!count) return null;
              return (
                <div key={sev} className="text-center">
                  <div className={`text-xl font-bold font-mono ${color}`}>{count}</div>
                  <div className="text-xs text-gray-500 capitalize">{sev}</div>
                </div>
              );
            })}
          </div>
          <Link href="/msbiz/exceptions" className="mt-3 block text-xs text-red-400 hover:text-red-300 transition-colors">
            Review exceptions →
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/msbiz/orders",        label: "New Order",    icon: Package,       color: "text-amber-400" },
          { href: "/msbiz/price-matches",  label: "Add PM",       icon: CreditCard,    color: "text-blue-400" },
          { href: "/msbiz/exceptions",     label: "Exceptions",   icon: AlertTriangle, color: "text-red-400" },
          { href: "/msbiz/costs",          label: "Log Cost",     icon: TrendingUp,    color: "text-green-400" },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors group">
            <q.icon className={`w-5 h-5 ${q.color}`} />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
