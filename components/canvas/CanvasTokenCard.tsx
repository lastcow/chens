"use client";
import { useEffect, useState } from "react";
import { LockOpen, KeyRound } from "lucide-react";

export default function CanvasTokenCard() {
  const [tokenMasked, setTokenMasked] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [token, setToken]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch("/api/user/canvas-token")
      .then(r => r.json())
      .then(d => { setTokenMasked(d.isSet ? d.masked : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setSaving(true); setError("");
    const res = await fetch("/api/user/canvas-token", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save token");
      setSaving(false);
    } else {
      setTokenMasked(token.slice(0, 4) + "****" + token.slice(-4));
      setToken(""); setShowForm(false); setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className={`rounded-xl border p-5 ${tokenMasked ? "border-green-500/20 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tokenMasked ? "bg-green-500/10" : "bg-amber-500/10"}`}>
            {tokenMasked
              ? <LockOpen className="w-5 h-5 text-green-400" />
              : <KeyRound className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Canvas API Token</div>
            {tokenMasked
              ? <div className="text-xs text-gray-400 mt-0.5">Saved: <code className="font-mono text-green-400">{tokenMasked}</code></div>
              : <div className="text-xs text-red-400 mt-0.5">Not set — required for AI Agent</div>}
          </div>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-3 py-1.5 transition-colors">
          {tokenMasked ? "Update" : "Add Token"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">
            Canvas → Account → Settings → Approved Integrations → New Access Token
          </p>
          {error && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-3 py-2">⚠️ {error}</div>}
          <div className="flex gap-2">
            <input type="password" value={token} onChange={e => setToken(e.target.value)}
              placeholder="Paste your Canvas API token…"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50" />
            <button type="submit" disabled={saving || !token.trim()}
              className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
