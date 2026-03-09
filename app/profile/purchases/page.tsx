"use client";
import { useEffect, useState } from "react";

type Payment = {
  id: string; module_id: string; payment_type: string;
  amount: string | null; currency: string; status: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  createdAt?: string; created_at?: string;
};

type UserModule = {
  module: string; payment_type: string | null;
  expires_at: string | null; activated_at: string | null;
};

const MODULE_LABELS: Record<string, string> = {
  canvas_lms: "🎓 Canvas LMS",
};
const TYPE_LABELS: Record<string, string> = {
  one_time: "One-time", monthly: "Monthly", annual: "Annual", free: "Free",
};

function StatusCell({ payment, userMod }: { payment: Payment; userMod?: UserModule }) {
  if (payment.status === "pending") {
    return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Pending</span>;
  }
  if (payment.status === "failed") {
    return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Failed</span>;
  }
  // Completed
  const pt = payment.payment_type;
  if (pt === "one_time") {
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Purchased</span>;
  }
  if (pt === "free") {
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Free</span>;
  }
  // Subscription
  const exp = userMod?.expires_at ? new Date(userMod.expires_at) : null;
  const expired = exp && exp < new Date();
  if (pt === "monthly") {
    return expired
      ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
      : <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
          ✓ Monthly{exp ? ` · until ${exp.toLocaleDateString()}` : ""}
        </span>;
  }
  if (pt === "annual") {
    return expired
      ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
      : <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
          ✓ Annual{exp ? ` · until ${exp.toLocaleDateString()}` : ""}
        </span>;
  }
  return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Active</span>;
}

export default function PurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/payments").then(r => r.json()),
      fetch("/api/user/modules").then(r => r.json()),
    ]).then(([pd, md]) => {
      setPayments(pd.payments ?? []);
      setUserModules(md.modules ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
  );

  const modMap = userModules.reduce((acc, m) => { acc[m.module] = m; return acc; }, {} as Record<string, UserModule>);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Purchase History</h2>
        <p className="text-gray-500 text-sm">All module purchases and subscriptions.</p>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-3xl mb-3">🛒</p>
          <p className="text-sm">No purchases yet.</p>
          <p className="text-xs mt-2 text-gray-600">Head to <span className="text-amber-400">Dashboard → Modules</span> to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Module</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Amount</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const dateStr = p.created_at ?? p.createdAt ?? "";
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-200">
                      {MODULE_LABELS[p.module_id] ?? p.module_id}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{TYPE_LABELS[p.payment_type] ?? p.payment_type}</td>
                    <td className="px-4 py-3">
                      <StatusCell payment={p} userMod={modMap[p.module_id]} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {p.amount ? `$${parseFloat(p.amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {dateStr ? new Date(dateStr).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
