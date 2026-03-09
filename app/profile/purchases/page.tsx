"use client";
import { useEffect, useState } from "react";

type Payment = {
  id: string; module_id: string; payment_type: string;
  amount: string | null; currency: string; status: string;
  stripe_session_id: string | null; created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending:   "bg-yellow-500/20 text-yellow-400",
  failed:    "bg-red-500/20 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  one_time: "One-time", monthly: "Monthly", annual: "Annual", free: "Free",
};

const MODULE_LABELS: Record<string, string> = {
  canvas_lms: "🎓 Canvas LMS",
};

export default function PurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/payments").then(r => r.json()).then(d => {
      setPayments(d.payments ?? []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
  );

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
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">
                    {MODULE_LABELS[p.module_id] ?? p.module_id}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{TYPE_LABELS[p.payment_type] ?? p.payment_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-700 text-gray-400"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {p.amount ? `$${parseFloat(p.amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
