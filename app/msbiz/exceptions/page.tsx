"use client";
import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Plus, Search, CheckCircle, X, ExternalLink } from "lucide-react";

interface Exception {
  id: string; type: string; ref_id: string; ref_type: string; severity: string;
  status: string; title: string; description: string | null; resolved_by: string | null;
  resolved_at: string | null; created_at: string; order_number?: string;
}

const SEV_COLORS: Record<string, string> = {
  critical: "bg-red-900/40 text-red-400 border-red-700/40",
  high:     "bg-orange-900/30 text-orange-400 border-orange-700/30",
  medium:   "bg-amber-900/30 text-amber-400 border-amber-700/30",
  low:      "bg-gray-800 text-gray-400 border-gray-700",
};

const SEV_DOT: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-gray-500",
};

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [page, setPage] = useState(1);
  const [resolvingId, setResolvingId] = useState("");
  const [addForm, setAddForm] = useState(false);
  const limit = 20;

  const fetchEx = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set("search", search);
    if (sevFilter !== "all") p.set("severity", sevFilter);
    if (statusFilter !== "all") p.set("status", statusFilter);
    const res = await fetch(`/api/msbiz/exceptions?${p}`);
    const d = await res.json();
    setExceptions(d.exceptions ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [page, search, sevFilter, statusFilter]);

  useEffect(() => { fetchEx(); }, [fetchEx]);
  useEffect(() => { setPage(1); }, [search, sevFilter, statusFilter]);

  const resolve = async (id: string) => {
    await fetch(`/api/msbiz/exceptions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setResolvingId("");
    fetchEx();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Exceptions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} {statusFilter === "open" ? "open" : ""} exceptions</p>
        </div>
        <button onClick={() => setAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Log Exception
        </button>
      </div>

      {/* Severity summary pills */}
      <div className="flex gap-2 flex-wrap">
        {["all","critical","high","medium","low"].map(s => (
          <button key={s} onClick={() => setSevFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              sevFilter === s
                ? s === "all" ? "bg-gray-700 text-white border-gray-600" : SEV_COLORS[s]
                : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700"
            }`}>
            {s !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[s]}`} />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setStatusFilter(statusFilter === "open" ? "all" : "open")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === "open"
                ? "bg-amber-500/20 text-amber-400 border-amber-700/30"
                : "bg-gray-900 text-gray-500 border-gray-800"
            }`}>
            {statusFilter === "open" ? "Showing: Open" : "Showing: All"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or description…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />)
        ) : exceptions.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No exceptions found</p>
          </div>
        ) : exceptions.map(ex => (
          <div key={ex.id} className={`bg-gray-900 border rounded-xl p-5 ${ex.status === "resolved" ? "border-gray-800 opacity-60" : "border-gray-800 hover:border-gray-700"} transition-colors`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full mt-2 ${SEV_DOT[ex.severity] ?? "bg-gray-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{ex.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SEV_COLORS[ex.severity] ?? ""}`}>
                      {ex.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-800 text-gray-500 border-gray-700 capitalize">{ex.type}</span>
                    {ex.status === "resolved" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-900/20 text-green-400 border-green-700/20 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> resolved
                      </span>
                    )}
                  </div>
                  {ex.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ex.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                    <span>{ex.ref_type} #{ex.ref_id.slice(0, 8)}…</span>
                    <span>{new Date(ex.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {ex.resolved_by && <span>Resolved by {ex.resolved_by}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a href={`/msbiz/orders/${ex.ref_id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {ex.status !== "resolved" && (
                  <button onClick={() => setResolvingId(ex.id)}
                    className="px-3 py-1 rounded-lg text-xs bg-green-900/20 text-green-400 border border-green-700/20 hover:bg-green-900/40 transition-colors">
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve confirm */}
      {resolvingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Mark as Resolved?</h3>
            <p className="text-sm text-gray-400 mb-6">This will move the exception to resolved state. You can still view it in history.</p>
            <div className="flex gap-3">
              <button onClick={() => setResolvingId("")} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => resolve(resolvingId)} className="flex-1 px-4 py-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-white text-sm font-medium">Resolve</button>
            </div>
          </div>
        </div>
      )}

      {addForm && <ExceptionForm onClose={() => setAddForm(false)} onSaved={() => { setAddForm(false); fetchEx(); }} />}
    </div>
  );
}

function ExceptionForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ref_id: "", ref_type: "order", type: "shipment", severity: "medium", title: "", description: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.ref_id || !form.title) { setError("Order ID and title required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/msbiz/exceptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Log Exception</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "type", label: "Type", opts: ["shipment","payment","inventory","system","other"] },
              { k: "severity", label: "Severity", opts: ["low","medium","high","critical"] },
              { k: "ref_type", label: "Ref Type", opts: ["order","inbound","outbound"] },
            ].map(({ k, label, opts }) => (
              <div key={k} className={k === "ref_type" ? "col-span-2" : ""}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <select value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Reference ID *</label>
            <input value={form.ref_id} onChange={e => set("ref_id", e.target.value)} placeholder="Order / inbound / outbound ID"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none" />
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Log Exception"}
          </button>
        </div>
      </div>
    </div>
  );
}
