"use client";
import { useEffect, useState } from "react";

interface RunRow {
  id: number; model: string; provider: string; task_type: string;
  input_tokens: number; output_tokens: number; cost_usd: string; created_at: string;
}
interface Breakdown { model: string; total_cost: string; runs: string; }
interface CostData {
  costs: { total: number; month: number; total_runs: number; month_runs: number };
  runs: RunRow[];
  breakdown: Breakdown[];
}

export default function UsagePage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/agent-runs").then(r => r.json()).then(d => {
      setData({ costs: { total: 0, month: 0, total_runs: 0, month_runs: 0 }, ...d });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      if (d.costs) setData(prev => prev ? { ...prev, costs: d.costs } : prev);
    });
  }, []);

  if (loading) return (
    <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}</div>
  );

  const costs = data?.costs ?? { total: 0, month: 0, total_runs: 0, month_runs: 0 };
  const runs = data?.runs ?? [];
  const breakdown = data?.breakdown ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Agent Usage &amp; Cost</h2>
        <p className="text-gray-500 text-sm">AI agent token usage and cost tracking.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "This Month",   value: `$${costs.month.toFixed(4)}`,  color: "text-amber-400" },
          { label: "All Time",     value: `$${costs.total.toFixed(4)}`,  color: "text-white" },
          { label: "Runs (Month)", value: costs.month_runs,              color: "text-blue-400" },
          { label: "Runs (Total)", value: costs.total_runs,              color: "text-gray-300" },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">This Month by Model</h3>
          <div className="space-y-3">
            {breakdown.map(b => (
              <div key={b.model} className="flex items-center gap-3 text-sm">
                <div className="font-mono text-gray-400 w-44 truncate text-xs">{b.model ?? "unknown"}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (parseFloat(b.total_cost) / (costs.month || 1)) * 100)}%` }} />
                </div>
                <div className="text-gray-400 text-xs w-16 text-right">${parseFloat(b.total_cost).toFixed(4)}</div>
                <div className="text-gray-600 text-xs w-14 text-right">{b.runs} runs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Runs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600 border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left px-4 py-2.5">Date</th>
                  <th className="text-left px-4 py-2.5">Task</th>
                  <th className="text-left px-4 py-2.5">Model</th>
                  <th className="text-right px-4 py-2.5">In</th>
                  <th className="text-right px-4 py-2.5">Out</th>
                  <th className="text-right px-4 py-2.5">Cost</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 text-gray-400">
                    <td className="px-4 py-2.5 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">{r.task_type ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-500">{r.model ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">{r.input_tokens?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">{r.output_tokens?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400">${parseFloat(r.cost_usd).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-3xl mb-3">🤖</p>
          <p className="text-sm">No agent runs recorded yet.</p>
        </div>
      )}
    </div>
  );
}
