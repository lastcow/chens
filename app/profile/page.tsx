"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ProfileData {
  user: {
    id: string; name: string; email: string; role: string;
    image: string | null; has_password: boolean; created_at: string;
    providers: string[];
  };
  costs: { total: number; month: number; total_runs: number; month_runs: number };
}

interface RunRow {
  id: number; model: string; provider: string; task_type: string;
  input_tokens: number; output_tokens: number; cost_usd: string; created_at: string;
}

interface Breakdown { model: string; total_cost: string; runs: string; }

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google", github: "GitHub", credentials: "Email / Password",
};
const PROVIDER_COLORS: Record<string, string> = {
  google: "bg-blue-900/30 border-blue-700/30 text-blue-400",
  github: "bg-purple-900/30 border-purple-700/30 text-purple-400",
  credentials: "bg-gray-800 border-gray-700 text-gray-400",
};

export default function ProfilePage() {
  const [data, setData]         = useState<ProfileData | null>(null);
  const [runs, setRuns]         = useState<RunRow[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [loading, setLoading]   = useState(true);

  // Password form
  const [curPw, setCurPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confPw, setConfPw]     = useState("");
  const [pwMsg, setPwMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/profile").then(r => r.json()),
      fetch("/api/user/agent-runs").then(r => r.json()),
    ]).then(([prof, runsData]) => {
      setData(prof);
      setRuns(runsData.runs ?? []);
      setBreakdown(runsData.breakdown ?? []);
      setLoading(false);
    });
  }, []);

  const handlePasswordChange = async () => {
    if (newPw !== confPw) { setPwMsg({ ok: false, text: "Passwords don't match" }); return; }
    if (newPw.length < 8)  { setPwMsg({ ok: false, text: "Min 8 characters" }); return; }
    setPwLoading(true); setPwMsg(null);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: curPw, new_password: newPw }),
    });
    const d = await res.json();
    setPwMsg(res.ok ? { ok: true, text: "Password updated successfully" } : { ok: false, text: d.error ?? "Failed" });
    if (res.ok) { setCurPw(""); setNewPw(""); setConfPw(""); }
    setPwLoading(false);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-32 animate-pulse" />)}
    </div>
  );

  const { user, costs } = data!;
  const isOAuth = user.providers.some(p => p !== "credentials");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {/* Identity card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-5">
        {user.image ? (
          <Image src={user.image} alt="avatar" width={64} height={64} className="rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center text-2xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1">
          <div className="text-lg font-semibold text-white">{user.name}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${user.role === "ADMIN" ? "bg-amber-900/30 border-amber-700/30 text-amber-400" : "bg-gray-800 border-gray-700 text-gray-500"}`}>
              {user.role}
            </span>
            {user.providers.map(p => (
              <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[p] ?? "bg-gray-800 border-gray-700 text-gray-400"}`}>
                {PROVIDER_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-600 text-right">
          Member since<br />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Agent Cost */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Agent Usage &amp; Cost</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "This Month", value: `$${costs.month.toFixed(4)}`, color: "text-amber-400" },
            { label: "All Time",   value: `$${costs.total.toFixed(4)}`, color: "text-white" },
            { label: "Runs (Month)", value: costs.month_runs, color: "text-blue-400" },
            { label: "Runs (Total)", value: costs.total_runs, color: "text-gray-300" },
          ].map(s => (
            <div key={s.label} className="text-center bg-gray-800/50 rounded-lg p-3">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {breakdown.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 mb-2">This month by model</div>
            {breakdown.map(b => (
              <div key={b.model} className="flex items-center gap-3 text-sm">
                <div className="font-mono text-gray-400 w-40 truncate">{b.model ?? "unknown"}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (parseFloat(b.total_cost) / (costs.month || 1)) * 100)}%` }} />
                </div>
                <div className="text-gray-400 text-xs w-16 text-right">${parseFloat(b.total_cost).toFixed(4)}</div>
                <div className="text-gray-600 text-xs w-14 text-right">{b.runs} runs</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600 text-sm text-center py-4">No agent runs recorded yet</div>
        )}
      </div>

      {/* Run history */}
      {runs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Runs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-600 border-b border-gray-800">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Task</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4 text-right">Tokens</th>
                  <th className="pb-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {runs.map(r => (
                  <tr key={r.id} className="text-gray-400">
                    <td className="py-2 pr-4 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{r.task_type ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono">{r.model ?? "—"}</td>
                    <td className="py-2 pr-4 text-right">{(r.input_tokens + r.output_tokens).toLocaleString()}</td>
                    <td className="py-2 text-right text-amber-400">${parseFloat(r.cost_usd).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Password</h2>
        {isOAuth ? (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="text-lg">🔒</span>
            <span>Your account is signed in via <strong className="text-gray-300">{user.providers.filter(p => p !== "credentials").map(p => PROVIDER_LABELS[p] ?? p).join(", ")}</strong>. Password login is not available.</span>
          </div>
        ) : (
          <div className="space-y-3 max-w-sm">
            {user.has_password && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Current Password</label>
                <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Confirm Password</label>
              <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            {pwMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${pwMsg.ok ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                {pwMsg.text}
              </div>
            )}
            <button onClick={handlePasswordChange} disabled={pwLoading}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {pwLoading ? "Updating…" : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
