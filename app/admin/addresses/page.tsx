"use client";
import { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import {
  MapPin, Plus, Search, Edit2, Trash2, X, Save, Copy, Check,
  ExternalLink, Globe, Lock, Warehouse, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, User, Users
} from "lucide-react";

interface SharedUser { id: string; name: string | null; email: string; }
interface Address {
  id: string; label: string | null; full_address: string;
  street1: string | null; city: string | null; state: string | null;
  zip: string | null; country: string | null;
  contact_name: string | null; contact_phone: string | null;
  is_warehouse: boolean; is_shared: boolean;
  user_id: string | null; owner_name: string | null; owner_email: string | null;
  shared_users: SharedUser[];
  created_at: string;
}

interface MsbizUser { id: string; name: string | null; email: string; }

const selectStyles = {
  control: (b: object) => ({ ...b, backgroundColor: "#1f2937", borderColor: "#374151", minHeight: "38px", boxShadow: "none", "&:hover": { borderColor: "#6b7280" } }),
  menu: (b: object) => ({ ...b, backgroundColor: "#111827", border: "1px solid #374151", zIndex: 9999 }),
  menuList: (b: object) => ({ ...b, maxHeight: "200px" }),
  option: (b: object, s: { isFocused: boolean; isSelected: boolean }) => ({
    ...b, backgroundColor: s.isSelected ? "#059669" : s.isFocused ? "#1f2937" : "transparent",
    color: s.isSelected ? "#fff" : "#e5e7eb", fontSize: "13px", cursor: "pointer",
    "&:active": { backgroundColor: "#065f46" },
  }),
  singleValue: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  input: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  placeholder: (b: object) => ({ ...b, color: "#6b7280", fontSize: "13px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b: object) => ({ ...b, color: "#6b7280", padding: "0 6px" }),
  clearIndicator: (b: object) => ({ ...b, color: "#6b7280" }),
};

export default function AdminAddressesPage() {
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [sharedFilter, setShared]   = useState("");   // "" | "true" | "false"
  const [showForm, setShowForm]     = useState(false);
  const [editAddr, setEditAddr]     = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [shareAddr, setShareAddr]   = useState<Address | null>(null);
  const [msbizUsers, setMsbizUsers] = useState<MsbizUser[]>([]);

  const fetchAddresses = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search.length >= 3) p.set("search", search);
    if (sharedFilter) p.set("shared", sharedFilter);
    fetch(`/api/admin/addresses?${p}`)
      .then(r => r.json())
      .then(d => { setAddresses(d.addresses ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, search, sharedFilter]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);
  useEffect(() => { setPage(1); }, [search, sharedFilter]);

  useEffect(() => {
    fetch("/api/admin/msbiz-users")
      .then(r => r.json())
      .then(d => setMsbizUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  const doDelete = async (id: string) => {
    await fetch(`/api/admin/addresses/${id}`, { method: "DELETE" });
    setDeletingId("");
    fetchAddresses();
  };

  const copy = (addr: Address) => {
    const parts = [addr.full_address, addr.contact_name, addr.contact_phone].filter(Boolean).join(", ");
    navigator.clipboard.writeText(parts);
    setCopiedId(addr.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800">
        <div className="absolute inset-0 bg-gray-950">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: `linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl" />
        </div>
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Addresses</h1>
              <p className="text-xs text-gray-500">{total} address{total !== 1 ? "es" : ""} · owner-scoped visibility</p>
            </div>
          </div>
          <button onClick={() => { setEditAddr(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search addresses, label, contact…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
        </div>
        <select value={sharedFilter} onChange={e => setShared(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50">
          <option value="">All visibility</option>
          <option value="true">Shared (public)</option>
          <option value="false">Private</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-2"></th>
                <th className="px-3 py-3 text-left">Address</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">Contact</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">Owner</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Visibility</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Type</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
                ))
              ) : addresses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-600">No addresses found.</td></tr>
              ) : addresses.map(addr => (
                <tr key={addr.id} className="hover:bg-gray-800/40 group transition-colors">
                  {/* visibility bar */}
                  <td className="px-2 py-3">
                    <div className={`w-1 h-7 rounded-full mx-auto ${addr.is_shared ? "bg-emerald-500" : "bg-gray-600"}`} />
                  </td>
                  {/* Address */}
                  <td className="px-3 py-3 w-full min-w-0 max-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="min-w-0">
                        {addr.label && (
                          <div className="text-xs font-semibold text-emerald-400 mb-0.5 truncate">{addr.label}</div>
                        )}
                        <div className="text-white text-sm truncate" title={addr.full_address}>{addr.full_address}</div>
                        {(addr.city || addr.state || addr.zip) && (
                          <div className="text-[10px] text-gray-500 font-mono">
                            {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {(addr.contact_name || addr.contact_phone) ? (
                      <div>
                        {addr.contact_name && <div className="text-gray-300 text-xs">{addr.contact_name}</div>}
                        {addr.contact_phone && <div className="text-gray-500 font-mono text-[11px]">{addr.contact_phone}</div>}
                      </div>
                    ) : <span className="text-gray-700">—</span>}
                  </td>
                  {/* Owner + Shared Users */}
                  <td className="px-3 py-3 whitespace-nowrap max-w-[180px]">
                    {addr.owner_name || addr.owner_email ? (
                      <div className="text-xs text-gray-300 truncate" title={addr.owner_email ?? ""}>
                        {addr.owner_name ?? addr.owner_email}
                      </div>
                    ) : <span className="text-gray-600 text-xs italic">No owner</span>}
                    {addr.shared_users?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {addr.shared_users.slice(0, 3).map(u => (
                          <span key={u.id} title={u.email}
                            className="inline-block text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-1.5 py-0.5 truncate max-w-[80px]">
                            {u.name ?? u.email.split("@")[0]}
                          </span>
                        ))}
                        {addr.shared_users.length > 3 && (
                          <span className="text-[10px] text-gray-600">+{addr.shared_users.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Visibility */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {addr.is_shared ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5">
                        <Globe className="w-2.5 h-2.5" /> Shared
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-800 border border-gray-700 text-gray-500 rounded-full px-2 py-0.5">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </td>
                  {/* Type */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {addr.is_warehouse ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5">
                        <Warehouse className="w-2.5 h-2.5" /> Warehouse
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-800 border border-gray-700 text-gray-500 rounded-full px-2 py-0.5">
                        <User className="w-2.5 h-2.5" /> Address
                      </span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copy(addr)} title="Copy"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                        {copiedId === addr.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.full_address)}`}
                        target="_blank" rel="noopener noreferrer" title="Google Maps"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => setShareAddr(addr)} title="Manage shared users"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditAddr(addr); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(addr.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
          <span>{total} total · page {page} of {pages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-800 disabled:opacity-30"><ChevronsLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-800 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page >= pages} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-800 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPage(pages)} disabled={page >= pages} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-800 disabled:opacity-30"><ChevronsRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <AddressForm
          address={editAddr}
          msbizUsers={msbizUsers}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setEditAddr(null); fetchAddresses(); }}
        />
      )}

      {/* Share modal */}
      {shareAddr && (
        <ShareModal
          address={shareAddr}
          msbizUsers={msbizUsers}
          onClose={() => setShareAddr(null)}
          onSaved={(updated) => {
            setAddresses(prev => prev.map(a => a.id === updated.id ? { ...a, shared_users: updated.shared_users } : a));
            setShareAddr(null);
          }}
        />
      )}

      {/* Delete confirm */}
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
                  {addr.label && <div className="text-xs font-semibold text-emerald-400">{addr.label}</div>}
                  <div className="text-sm text-white">{addr.full_address}</div>
                  {addr.owner_email && <div className="text-xs text-gray-500">Owner: {addr.owner_name ?? addr.owner_email}</div>}
                </div>
              )}
              <p className="text-xs text-gray-500">May affect warehouses or orders linked to this address.</p>
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

// ─── Address Form ─────────────────────────────────────────────────────────────

function AddressForm({
  address, msbizUsers, onClose, onSaved
}: {
  address: Address | null;
  msbizUsers: MsbizUser[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [searchQ, setSearchQ] = useState(address?.full_address ?? "");
  const [suggestions, setSuggestions] = useState<{ place_id: string; description: string }[]>([]);
  const [googleError, setGoogleError] = useState("");
  const [sharedUserIds, setSharedUserIds] = useState<string[]>(
    address?.shared_users?.map(u => u.id) ?? []
  );
  const [form, setForm] = useState({
    label:        address?.label ?? "",
    contact_name: address?.contact_name ?? "",
    contact_phone: address?.contact_phone ?? "",
    full_address: address?.full_address ?? "",
    street1:      address?.street1 ?? "",
    city:         address?.city ?? "",
    state:        address?.state ?? "",
    zip:          address?.zip ?? "",
    country:      address?.country ?? "US",
    is_warehouse: address?.is_warehouse ?? false,
    is_shared:    address?.is_shared ?? false,
    owner_id:     address?.user_id ?? "",
  });

  useEffect(() => {
    if (searchQ.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/msbiz/addresses/lookup?q=${encodeURIComponent(searchQ)}`);
        const d = await res.json();
        if (d.google_error || d.error) { setGoogleError(d.google_error || d.error); setSuggestions([]); }
        else { setGoogleError(""); setSuggestions(d.predictions ?? []); }
      } catch { setGoogleError("Search unavailable"); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const selectPlace = async (pred: { place_id: string; description: string }) => {
    setSearchQ(pred.description); setSuggestions([]);
    const res = await fetch("/api/msbiz/addresses/lookup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: pred.place_id }),
    });
    const d = await res.json();
    if (d.place) {
      setForm(f => ({ ...f,
        full_address: d.place.full_address,
        street1: d.place.street ?? f.street1,
        city: d.place.city ?? f.city,
        state: d.place.state ?? f.state,
        zip: d.place.zip ?? f.zip,
        country: d.place.country ?? f.country,
      }));
    }
  };

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_address) { setError("Address required"); return; }
    setSaving(true); setError("");
    const body = {
      ...form,
      user_id: form.owner_id || null,
      shared_user_ids: sharedUserIds.filter(id => id !== form.owner_id),
    };
    const res = await fetch(address ? `/api/admin/addresses/${address.id}` : "/api/admin/addresses", {
      method: address ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { onSaved(); } else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Bento header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
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
                <p className="text-[11px] text-gray-500 mt-0.5">{address ? (address.label ?? address.full_address) : "New address with owner + visibility"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Label */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Label</label>
            <input value={form.label} onChange={e => set("label", e.target.value)} placeholder="e.g., Warehouse A, HQ, Home"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Owner */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Owner <span className="text-gray-600 normal-case font-normal">(MS Business user)</span>
            </label>
            <Select
              styles={selectStyles}
              options={msbizUsers.map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={msbizUsers.filter(u => u.id === form.owner_id).map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))[0] ?? null}
              onChange={opt => set("owner_id", opt?.value ?? "")}
              placeholder="No owner (unassigned)…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
            <p className="text-[10px] text-gray-600 mt-1">If set, only this user can see it (unless shared). Leave blank for admin-only.</p>
          </div>

          {/* Shared with users */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Shared With <span className="text-gray-600 normal-case font-normal">(specific users, excluding owner)</span>
            </label>
            <Select
              isMulti
              styles={{
                ...selectStyles,
                multiValue: (b: object) => ({ ...b, backgroundColor: "#1e3a5f", borderRadius: "4px" }),
                multiValueLabel: (b: object) => ({ ...b, color: "#93c5fd", fontSize: "12px" }),
                multiValueRemove: (b: object) => ({ ...b, color: "#93c5fd", ":hover": { backgroundColor: "#2563eb", color: "#fff" } }),
              }}
              options={msbizUsers
                .filter(u => u.id !== form.owner_id)
                .map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={msbizUsers
                .filter(u => sharedUserIds.includes(u.id) && u.id !== form.owner_id)
                .map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              onChange={opts => setSharedUserIds(opts.map((o: { value: string }) => o.value))}
              placeholder="Add users who can see this address…"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
            <p className="text-[10px] text-gray-600 mt-1">These users can see this address even if it's private. Owner is excluded automatically.</p>
          </div>

          {/* Visibility + Type toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 cursor-pointer hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Shared (public)</span>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.is_shared} onChange={e => set("is_shared", e.target.checked)} />
                <div className={`w-9 h-5 rounded-full transition-colors ${form.is_shared ? "bg-emerald-500" : "bg-gray-700"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_shared ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            </label>
            <label className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 cursor-pointer hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Warehouse</span>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.is_warehouse} onChange={e => set("is_warehouse", e.target.checked)} />
                <div className={`w-9 h-5 rounded-full transition-colors ${form.is_warehouse ? "bg-blue-500" : "bg-gray-700"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_warehouse ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            </label>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Contact Name</label>
              <input value={form.contact_name} onChange={e => set("contact_name", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Phone</label>
              <input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* Google Places search */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Search Address <span className="text-gray-600 normal-case font-normal">(Google Places)</span>
            </label>
            <div className="relative">
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setGoogleError(""); }}
                placeholder="Start typing to search…"
                className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${
                  googleError ? "border-red-700" : "border-gray-700 focus:border-emerald-500"}`} />
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
            {googleError && <p className="text-[10px] text-red-400 mt-1">⚠ {googleError} — fill in manually below.</p>}
          </div>

          {/* Fields */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Full Address *</label>
            <input value={form.full_address} onChange={e => set("full_address", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([["street1","Street"], ["city","City"], ["state","State"], ["zip","ZIP"]] as [string, string][]).map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{l}</label>
                <input value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : address ? "Update" : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({
  address, msbizUsers, onClose, onSaved,
}: {
  address: Address;
  msbizUsers: MsbizUser[];
  onClose: () => void;
  onSaved: (updated: { id: string; shared_users: SharedUser[] }) => void;
}) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [ids, setIds]         = useState<string[]>(address.shared_users?.map(u => u.id) ?? []);

  // users eligible to share: not the owner
  const eligible = msbizUsers.filter(u => u.id !== address.user_id);

  const toggle = (uid: string) =>
    setIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const submit = async () => {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/addresses/${address.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared_user_ids: ids, owner_id: address.user_id }),
    });
    if (res.ok) {
      const newSharedUsers = eligible
        .filter(u => ids.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email }));
      onSaved({ id: address.id, shared_users: newSharedUsers });
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#a855f7 1px, transparent 1px), linear-gradient(90deg, #a855f7 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Shared Access</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[220px]">{address.label ?? address.full_address}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Owner info */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Owner</span>
              <div className="text-xs text-gray-300 truncate">
                {address.owner_name ?? address.owner_email ?? <span className="text-gray-600 italic">No owner</span>}
              </div>
            </div>
          </div>
        </div>

        {/* User list */}
        <div className="px-5 pb-1 shrink-0">
          <p className="text-xs text-gray-500 mb-2">
            {ids.length === 0 ? "No users have access yet." : `${ids.length} user${ids.length !== 1 ? "s" : ""} with access`}
          </p>
        </div>

        {error && <div className="mx-5 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 shrink-0">{error}</div>}

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
          {eligible.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-sm">No MS Business users available.</div>
          ) : eligible.map(u => {
            const checked = ids.includes(u.id);
            return (
              <button key={u.id} onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                  checked
                    ? "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
                }`}>
                {/* checkbox */}
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? "bg-purple-500 border-purple-500" : "border-gray-600"
                }`}>
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  {u.name && <div className="text-sm text-white truncate">{u.name}</div>}
                  <div className={`text-[11px] truncate ${u.name ? "text-gray-500" : "text-gray-300"}`}>{u.email}</div>
                </div>
                {checked && (
                  <span className="text-[10px] text-purple-400 shrink-0">✓ shared</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-5 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500/90 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save Access"}
          </button>
        </div>
      </div>
    </div>
  );
}
