"use client";
import { useEffect, useState } from "react";
import { Truck, Search, RefreshCw, Package, MapPin, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface TrackingEvent {
  id: string; ref_id: string; ref_type: string; tracking_number: string;
  carrier: string | null; status: string; event_type: string | null;
  description: string | null; location: string | null; event_at: string | null;
  created_at: string;
}

interface TrackGroup {
  tracking_number: string; carrier: string | null; ref_type: string; ref_id: string;
  status: string; events: TrackingEvent[];
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  delivered:          <CheckCircle className="w-4 h-4 text-green-400" />,
  out_for_delivery:   <Truck className="w-4 h-4 text-blue-400" />,
  in_transit:         <Truck className="w-4 h-4 text-amber-400" />,
  pre_transit:        <Package className="w-4 h-4 text-gray-400" />,
  failure:            <AlertTriangle className="w-4 h-4 text-red-400" />,
  return_to_sender:   <AlertTriangle className="w-4 h-4 text-red-400" />,
  unknown:            <Clock className="w-4 h-4 text-gray-500" />,
};

const STATUS_LABEL: Record<string, string> = {
  delivered: "Delivered", out_for_delivery: "Out for Delivery",
  in_transit: "In Transit", pre_transit: "Pre-Transit",
  failure: "Failed", return_to_sender: "Return to Sender", unknown: "Unknown",
};

export default function TrackingPage() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [groups, setGroups] = useState<TrackGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState("");

  const doSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/msbiz/tracking?ref_type=order&ref_id=${encodeURIComponent(search.trim())}`);
    const d = await res.json();
    setEvents(d.events ?? []);

    // Group by tracking_number
    const grouped: Record<string, TrackGroup> = {};
    for (const evt of d.events ?? []) {
      if (!grouped[evt.tracking_number]) {
        grouped[evt.tracking_number] = { tracking_number: evt.tracking_number, carrier: evt.carrier, ref_type: evt.ref_type, ref_id: evt.ref_id, status: evt.status, events: [] };
      }
      grouped[evt.tracking_number].events.push(evt);
      grouped[evt.tracking_number].status = evt.status; // latest
    }
    setGroups(Object.values(grouped));
    setLoading(false);
  };

  const refresh = async (tracking_number: string, carrier: string | null, ref_id: string, ref_type: string) => {
    setRefreshing(tracking_number);
    await fetch("/api/msbiz/tracking", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id, ref_type, tracking_number, carrier, refresh: true }),
    });
    setRefreshing("");
    await doSearch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Truck className="w-5 h-5 text-blue-400" /> Tracking</h2>
        <button onClick={() => setAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          + Add Tracking
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Paste order ID or tracking number…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono" />
        </div>
        <button onClick={doSearch} className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 text-sm transition-colors">
          Search
        </button>
      </div>

      {loading && <div className="text-center text-gray-600 animate-pulse py-8">Fetching tracking data…</div>}

      {!loading && groups.length === 0 && events.length === 0 && search && (
        <div className="text-center py-10 text-gray-600">No tracking events found for that reference.</div>
      )}

      {/* Grouped tracking results */}
      {groups.map(group => (
        <div key={group.tracking_number} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {STATUS_ICON[group.status] ?? STATUS_ICON.unknown}
              <div>
                <div className="font-mono text-sm font-semibold text-white">{group.tracking_number}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  {group.carrier && <span>{group.carrier}</span>}
                  <span>•</span>
                  <span className="capitalize">{STATUS_LABEL[group.status] ?? group.status}</span>
                  <span>•</span>
                  <span>{group.ref_type} {group.ref_id.slice(0,8)}…</span>
                </div>
              </div>
            </div>
            <button onClick={() => refresh(group.tracking_number, group.carrier, group.ref_id, group.ref_type)}
              disabled={refreshing === group.tracking_number}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-700/20 hover:bg-blue-900/40 text-xs transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${refreshing === group.tracking_number ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Events timeline */}
          <div className="px-5 py-4">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-800" />
              <div className="space-y-4">
                {group.events.map((evt, i) => (
                  <div key={evt.id} className="flex gap-4 relative">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                      i === 0 ? "bg-blue-900/50 border-blue-500" : "bg-gray-900 border-gray-700"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-400" : "bg-gray-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm text-gray-300">{evt.description || evt.event_type || "Status update"}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-600">
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {evt.location}
                          </span>
                        )}
                        {evt.event_at && <span>{new Date(evt.event_at).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {addForm && <AddTrackingForm onClose={() => setAddForm(false)} onSaved={() => { setAddForm(false); if (search) doSearch(); }} />}
    </div>
  );
}

function AddTrackingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ref_id: "", ref_type: "order", tracking_number: "", carrier: "UPS" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.ref_id || !form.tracking_number) { setError("Reference ID and tracking number required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/msbiz/tracking", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Tracking</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-500 flex items-center justify-center">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ref Type</label>
              <select value={form.ref_type} onChange={e => set("ref_type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="order">Order</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Carrier</label>
              <select value={form.carrier} onChange={e => set("carrier", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {["UPS","FedEx","USPS","DHL","Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Reference ID *</label>
            <input value={form.ref_id} onChange={e => set("ref_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tracking Number *</label>
            <input value={form.tracking_number} onChange={e => set("tracking_number", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
          </div>
          <p className="text-[10px] text-gray-600">Will fetch events from EasyPost (UPS/FedEx/USPS/DHL).</p>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add & Fetch"}
          </button>
        </div>
      </div>
    </div>
  );
}
