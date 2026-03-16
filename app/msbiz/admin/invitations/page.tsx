"use client";
import { useEffect, useState } from "react";
import { Mail, Plus, RefreshCw, X, Copy, Check } from "lucide-react";

interface Invite {
  id: string; email: string; role: string | null; status: string;
  token: string; permissions: Record<string, boolean>;
  expires_at: string; created_at: string; accepted_at: string | null;
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState("");

  const fetchInvites = () => {
    fetch("/api/msbiz/admin/invite")
      .then(r => r.json())
      .then(d => { setInvites(d.invitations ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchInvites(); }, []);

  const revoke = async (id: string) => {
    await fetch(`/api/msbiz/admin/invite/${id}`, { method: "DELETE" });
    fetchInvites();
  };

  const resend = async (id: string) => {
    await fetch(`/api/msbiz/admin/invite/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend" }),
    });
    fetchInvites();
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/msbiz/accept-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const STATUS_COLORS: Record<string, string> = {
    pending:  "bg-amber-900/30 text-amber-400 border-amber-700/30",
    accepted: "bg-green-900/30 text-green-400 border-green-700/30",
    expired:  "bg-gray-900/50 text-gray-500 border-gray-800",
    revoked:  "bg-red-900/20 text-red-500 border-red-900/30",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mail className="w-5 h-5 text-amber-400" /> Invitations</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-10 animate-pulse">Loading…</div>
      ) : invites.length === 0 ? (
        <div className="text-center py-10">
          <Mail className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No invitations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map(inv => {
            const expired = new Date(inv.expires_at) < new Date() && inv.status === "pending";
            const displayStatus = expired ? "expired" : inv.status;
            return (
              <div key={inv.id} className={`bg-gray-900 border rounded-xl p-5 ${displayStatus === "expired" || displayStatus === "revoked" ? "border-gray-800 opacity-60" : "border-gray-800 hover:border-gray-700"} transition-colors`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{inv.email}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[displayStatus] ?? ""}`}>{displayStatus}</span>
                      {inv.role && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 capitalize">{inv.role}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-600">
                      <span>Sent {new Date(inv.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>
                      {inv.accepted_at
                        ? <span className="text-green-500">Accepted {new Date(inv.accepted_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>
                        : <span>Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>}
                      <span>{Object.values(inv.permissions || {}).filter(Boolean).length} permissions</span>
                    </div>
                  </div>

                  {displayStatus === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => copyLink(inv.token, inv.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white text-xs transition-colors">
                        {copied === inv.id ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
                      </button>
                      <button onClick={() => resend(inv.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-900/20 border border-blue-700/20 text-blue-400 hover:bg-blue-900/40 text-xs transition-colors">
                        <RefreshCw className="w-3 h-3" /> Resend
                      </button>
                      <button onClick={() => revoke(inv.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <InviteForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchInvites(); }} />}
    </div>
  );
}

function InviteForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", role: "operator" });

  const submit = async () => {
    if (!form.email) { setError("Email required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/msbiz/admin/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, role: form.role }),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Invite User</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              <option value="viewer">Viewer — read-only</option>
              <option value="operator">Operator — create/edit orders, inbound, outbound</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
          <p className="text-xs text-gray-500">
            An invitation email will be sent via Mailgun. The link expires in 7 days.
          </p>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Sending…" : "Send Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}
