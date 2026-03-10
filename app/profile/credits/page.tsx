"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Tx {
  id: number; type: "purchase" | "usage" | "refund" | "credit";
  amount: string; description: string | null;
  ref_id: string | null; balance_after: string | null; created_at: string;
}
interface CreditsData { balance: number; transactions: Tx[]; total: number; page: number; }

const TYPE_STYLE: Record<string, string> = {
  purchase: "text-green-400",
  usage:    "text-red-400",
  refund:   "text-blue-400",
  credit:   "text-purple-400",
};
const TYPE_LABEL: Record<string, string> = {
  purchase: "➕ Purchase",
  usage:    "➖ Usage",
  refund:   "↩ Refund",
  credit:   "🎁 Credit",
};

function CreditsContent() {
  const params = useSearchParams();
  const purchased = params.get("purchased");
  const [data, setData]   = useState<CreditsData | null>(null);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [buying, setBuying]   = useState(false);
  const [credits, setCredits] = useState(100);

  const load = (p: number) => {
    setLoading(true);
    setError(null);
    fetch(`/api/user/credits?page=${p}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load credits"); setLoading(false); });
  };

  useEffect(() => { load(page); }, [page]);

  const purchase = async () => {
    if (credits < 100) return;
    setBuying(true);
    const origin = window.location.origin;
    const res = await fetch("/api/user/credits/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credits,
        success_url: `${origin}/profile/credits?purchased=${credits}`,
        cancel_url:  `${origin}/profile/credits`,
      }),
    });
    const d = await res.json();
    setBuying(false);
    if (d.url) window.location.href = d.url;
  };

  const balance     = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];
  const total       = data?.total ?? 0;
  const totalPages  = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {purchased && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-green-400 text-sm">
          ✅ {purchased} credits added to your account!
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Balance + Purchase */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Credit Balance</p>
            <p className="text-4xl font-bold text-amber-400">
              {loading ? <span className="animate-pulse">—</span> : balance.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">1 credit = $1.00 · 0.1 credit per grading</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Credits to buy</label>
              <input
                type="number" min={100} step={100} value={credits}
                onChange={e => setCredits(Math.max(100, Number(e.target.value)))}
                className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={purchase} disabled={buying || credits < 100}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {buying ? "Redirecting…" : `Buy ${credits} credits ($${credits})`}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Transaction History</h3>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-500 text-sm animate-pulse">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No transactions yet.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-6 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 font-medium text-xs ${TYPE_STYLE[tx.type] ?? "text-gray-400"}`}>
                      {TYPE_LABEL[tx.type] ?? tx.type}
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{tx.description ?? "—"}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${TYPE_STYLE[tx.type] ?? "text-gray-400"}`}>
                      {tx.type === "usage" ? "−" : "+"}{Math.abs(parseFloat(tx.amount)).toFixed(1)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-gray-400 text-xs">
                      {tx.balance_after != null ? parseFloat(tx.balance_after).toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-800">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1 rounded border border-gray-700">← Prev</button>
                <span className="text-xs text-gray-500 px-2 py-1">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1 rounded border border-gray-700">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm animate-pulse py-10 text-center">Loading…</div>}>
      <CreditsContent />
    </Suspense>
  );
}
