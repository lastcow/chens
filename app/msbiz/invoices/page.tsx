"use client";
import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, RefreshCw, ExternalLink, CheckCircle, Clock, AlertCircle, X } from "lucide-react";

interface Invoice {
  id: string; qb_customer_name: string | null; order_ids: string[];
  subtotal: number; tax: number; total: number; status: string;
  issued_at: string | null; due_at: string | null; paid_at: string | null;
  qb_invoice_id: string | null; qb_synced_at: string | null; qb_error: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-gray-800 text-gray-400 border-gray-700",
  sent:     "bg-blue-900/30 text-blue-400 border-blue-700/30",
  paid:     "bg-green-900/30 text-green-400 border-green-700/30",
  overdue:  "bg-red-900/30 text-red-400 border-red-700/30",
  cancelled:"bg-gray-900/50 text-gray-500 border-gray-800",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft:   <Clock className="w-3.5 h-3.5" />,
  sent:    <RefreshCw className="w-3.5 h-3.5" />,
  paid:    <CheckCircle className="w-3.5 h-3.5" />,
  overdue: <AlertCircle className="w-3.5 h-3.5" />,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qbConnected, setQbConnected] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const p = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/msbiz/invoices${p}`);
    const d = await res.json();
    setInvoices(d.invoices ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const syncQB = async (id: string, action: "create" | "status") => {
    setSyncing(id);
    await fetch("/api/msbiz/invoices/qb/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: id, action }),
    });
    setSyncing(null);
    fetchInvoices();
  };

  const connectQB = async () => {
    const res = await fetch("/api/msbiz/invoices/qb/auth");
    const d = await res.json();
    if (d.auth_url) window.open(d.auth_url, "_blank");
  };

  const totalsByStatus = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + Number(inv.total);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Invoices</h2>
          <div className="flex gap-5 mt-2 text-xs">
            {[["paid","green"],["sent","blue"],["overdue","red"],["draft","gray"]].map(([s, c]) => (
              totalsByStatus[s] ? (
                <span key={s} className={`text-${c}-400`}>
                  ${totalsByStatus[s].toFixed(0)} {s}
                </span>
              ) : null
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={connectQB}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-xs transition-colors">
            🔗 Connect QB
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2">
        {["all","draft","sent","paid","overdue"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? s === "all" ? "bg-gray-700 text-white border-gray-600" : STATUS_COLORS[s]
                : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700"
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-clip">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Customer / Orders</th>
              <th className="text-center px-3 py-3">Issued</th>
              <th className="text-center px-3 py-3">Due</th>
              <th className="text-right px-3 py-3">Total</th>
              <th className="text-center px-3 py-3">Status</th>
              <th className="text-center px-3 py-3">QuickBooks</th>
              <th className="text-center px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-600 py-10 animate-pulse">Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-600 py-10">No invoices found.</td></tr>
            ) : invoices.map(inv => {
              const isOverdue = inv.status === "sent" && inv.due_at && new Date(inv.due_at) < new Date();
              return (
                <tr key={inv.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white text-sm">{inv.qb_customer_name || "Unnamed"}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{(inv.order_ids as string[]).length} order(s)</div>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-gray-500 font-mono">
                    {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    <span className={isOverdue ? "text-red-400 font-semibold" : "text-gray-500"}>
                      {inv.due_at ? new Date(inv.due_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-white">
                    ${Number(inv.total).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[inv.status] ?? ""}`}>
                      {STATUS_ICON[inv.status]}
                      {isOverdue && inv.status === "sent" ? "overdue" : inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {inv.qb_invoice_id ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] text-green-400 font-mono">#{inv.qb_invoice_id}</span>
                        <button onClick={() => syncQB(inv.id, "status")} disabled={syncing === inv.id}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <RefreshCw className={`w-3 h-3 ${syncing === inv.id ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    ) : inv.qb_error ? (
                      <span className="text-[10px] text-red-400">Error</span>
                    ) : (
                      <button onClick={() => syncQB(inv.id, "create")} disabled={syncing === inv.id}
                        className="text-[10px] px-2 py-1 rounded bg-blue-900/20 text-blue-400 border border-blue-700/20 hover:bg-blue-900/40 transition-colors disabled:opacity-50">
                        {syncing === inv.id ? "Syncing…" : "Push to QB"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <a href={`/msbiz/invoices/${inv.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateInvoiceForm onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchInvoices(); }} />}
    </div>
  );
}

function CreateInvoiceForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    qb_customer_name: "", order_ids: "", subtotal: "", tax: "", issued_at: new Date().toISOString().split("T")[0],
    due_at: "", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.subtotal) { setError("Subtotal required"); return; }
    setSaving(true); setError("");
    const order_ids = form.order_ids.split(",").map(s => s.trim()).filter(Boolean);
    const subtotal = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    const res = await fetch("/api/msbiz/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qb_customer_name: form.qb_customer_name || null, order_ids, subtotal, tax,
        issued_at: form.issued_at || null, due_at: form.due_at || null, notes: form.notes || null }),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New Invoice</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Customer Name</label>
            <input value={form.qb_customer_name} onChange={e => set("qb_customer_name", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order IDs (comma separated)</label>
            <input value={form.order_ids} onChange={e => set("order_ids", e.target.value)} placeholder="id1, id2, id3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Subtotal *</label>
              <input type="number" step="0.01" value={form.subtotal} onChange={e => set("subtotal", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tax</label>
              <input type="number" step="0.01" value={form.tax} onChange={e => set("tax", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["issued_at","Issue Date"],["due_at","Due Date"]].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <input type="date" value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
