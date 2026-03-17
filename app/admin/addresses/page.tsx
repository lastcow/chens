"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Search, Edit2, Trash2, X, Copy, Check, ExternalLink } from "lucide-react";

interface Address {
  id: string; label: string | null; full_address: string; street: string | null;
  city: string | null; state: string | null; zip: string | null; country: string | null;
  name: string | null; phone: string | null; created_at: string;
}

export default function AdminAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAddr, setEditAddr] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAddresses = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/msbiz/addresses${q}`)
      .then(r => r.json())
      .then(d => { setAddresses(d.addresses ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, [search]);

  const doDelete = async (id: string) => {
    await fetch(`/api/msbiz/addresses/${id}`, { method: "DELETE" });
    setDeletingId("");
    fetchAddresses();
  };

  const filtered = addresses.filter(a =>
    !search || a.full_address.toLowerCase().includes(search.toLowerCase()) || (a.label?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-400" /> Addresses</h2>
        <button onClick={() => { setEditAddr(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search addresses…"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_,i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-600">No addresses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(addr => (
            <div key={addr.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    {addr.label && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-amber-400">{addr.label}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(addr.full_address);
                            setCopiedId(addr.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          title="Copy address"
                          className="text-gray-600 hover:text-green-400 transition-colors">
                          {copiedId === addr.id
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.full_address)}`}
                          target="_blank" rel="noopener noreferrer"
                          title="Open in Google Maps"
                          className="text-gray-600 hover:text-blue-400 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="text-sm text-white leading-snug">{addr.full_address}</div>
                    {(addr.name || addr.phone) && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        {addr.name && <span>{addr.name}</span>}
                        {addr.name && addr.phone && <span className="text-gray-700">·</span>}
                        {addr.phone && <span className="font-mono">{addr.phone}</span>}
                      </div>
                    )}
                    {!addr.label && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(addr.full_address);
                            setCopiedId(addr.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          title="Copy address"
                          className="text-gray-600 hover:text-green-400 transition-colors">
                          {copiedId === addr.id
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.full_address)}`}
                          target="_blank" rel="noopener noreferrer"
                          title="Open in Google Maps"
                          className="text-gray-600 hover:text-blue-400 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <button onClick={() => { setEditAddr(addr); setShowForm(true); }}
                    className="w-7 h-7 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 flex items-center justify-center">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(addr.id)}
                    className="w-7 h-7 rounded-md hover:bg-red-900/20 text-gray-500 hover:text-red-400 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddressForm
          address={editAddr}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setEditAddr(null); fetchAddresses(); }}
        />
      )}

      {deletingId && (() => {
        const addr = addresses.find(a => a.id === deletingId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Delete Address?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This cannot be undone.</p>
                </div>
              </div>
              {addr && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-1">
                  {addr.label && <div className="text-xs font-semibold text-amber-400">{addr.label}</div>}
                  <div className="text-sm text-white">{addr.full_address}</div>
                  {(addr.city || addr.state || addr.zip) && (
                    <div className="text-xs text-gray-500">
                      {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {(addr.name || addr.phone) && (
                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                      {addr.name && <span>{addr.name}</span>}
                      {addr.phone && <span className="font-mono">{addr.phone}</span>}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500">This may affect warehouses or orders linked to this address.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingId("")} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
                <button onClick={() => doDelete(deletingId)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium">Delete</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AddressForm({ address, onClose, onSaved }: { address: Address | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQ, setSearchQ] = useState(address?.full_address ?? "");
  const [suggestions, setSuggestions] = useState<{ place_id: string; description: string }[]>([]);
  const [form, setForm] = useState({
    label: address?.label ?? "",
    name: address?.name ?? "",
    phone: address?.phone ?? "",
    full_address: address?.full_address ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    zip: address?.zip ?? "",
    country: address?.country ?? "US",
  });

  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (searchQ.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/msbiz/addresses/lookup?q=${encodeURIComponent(searchQ)}`);
        const d = await res.json();
        if (d.google_error || d.error) {
          setGoogleError(d.google_error || d.error);
          setSuggestions([]);
        } else {
          setGoogleError("");
          setSuggestions(d.predictions ?? []);
        }
      } catch { setGoogleError("Search unavailable"); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const selectPlace = async (pred: { place_id: string; description: string }) => {
    setSearchQ(pred.description);
    setSuggestions([]);
    const res = await fetch("/api/msbiz/addresses/lookup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: pred.place_id }),
    });
    const d = await res.json();
    if (d.place) {
      setForm(f => ({ ...f, full_address: d.place.full_address, street: d.place.street ?? f.street,
        city: d.place.city ?? f.city, state: d.place.state ?? f.state,
        zip: d.place.zip ?? f.zip, country: d.place.country ?? f.country }));
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_address) { setError("Address required"); return; }
    setSaving(true); setError("");
    const method = address ? "PUT" : "POST";
    const url = address ? `/api/msbiz/addresses/${address.id}` : "/api/msbiz/addresses";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Bento grid header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="rounded-md bg-emerald-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />
              ))}
            </div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{address ? "Edit Address" : "Add Address"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{address ? (address.label ?? address.full_address) : "Add a new address"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Label</label>
            <input value={form.label} onChange={e => set("label", e.target.value)} placeholder="e.g., Warehouse A, HQ, Customer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Contact Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (xxx) xxx-xxxx"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Search Address
              <span className="text-gray-600 normal-case font-normal ml-1">(Google Places)</span>
            </label>
            <div className="relative">
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setGoogleError(""); }}
                placeholder="Start typing to search…"
                className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${
                  googleError ? "border-red-700 focus:border-red-500" : "border-gray-700 focus:border-amber-500"
                }`} />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.place_id} onClick={() => selectPlace(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {googleError ? (
              <p className="text-[10px] text-red-400 mt-1">⚠ {googleError} — fill in the fields manually below.</p>
            ) : (
              <p className="text-[10px] text-gray-600 mt-1">Type 3+ characters to search. Select a result to auto-fill fields below.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Full Address *</label>
            <input value={form.full_address} onChange={e => set("full_address", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["street","Street"],["city","City"],["state","State"],["zip","ZIP"]].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{l}</label>
                <input value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
