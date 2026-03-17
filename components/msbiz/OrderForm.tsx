"use client";
import { useEffect, useState } from "react";
import { X, Search, Package } from "lucide-react";

interface Account { id: string; email: string; display_name: string | null; }
interface Address { id: string; label: string | null; full_address: string; }
interface AddressSuggestion { place_id: string; description: string; }

interface Props { onClose: () => void; onSaved: () => void; orderId?: string; }

export default function OrderForm({ onClose, onSaved, orderId }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addrSearch, setAddrSearch] = useState("");
  const [addrSuggestions, setAddrSuggestions] = useState<AddressSuggestion[]>([]);

  const [form, setForm] = useState({
    account_id: "", ms_order_number: "", order_date: new Date().toISOString().split("T")[0],
    subtotal: "", tax: "", shipping_cost: "", total: "",
    shipping_address_id: "", tracking_number: "", carrier: "UPS", notes: "",
  });

  useEffect(() => {
    fetch("/api/msbiz/accounts").then(r => r.json()).then(d => setAccounts(d.accounts ?? []));
    fetch("/api/msbiz/addresses").then(r => r.json()).then(d => setAddresses(d.addresses ?? []));
    if (orderId) {
      fetch(`/api/msbiz/orders/${orderId}`).then(r => r.json()).then(d => {
        const o = d.order;
        if (o) setForm({ account_id: o.account_id, ms_order_number: o.ms_order_number,
          order_date: o.order_date?.split("T")[0] ?? "", subtotal: o.subtotal ?? "",
          tax: o.tax ?? "", shipping_cost: o.shipping_cost ?? "", total: o.total ?? "",
          shipping_address_id: o.shipping_address_id ?? "", tracking_number: o.tracking_number ?? "",
          carrier: o.carrier ?? "UPS", notes: o.notes ?? "" });
      });
    }
  }, [orderId]);

  // Address autocomplete
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (addrSearch.length < 3) { setAddrSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/msbiz/addresses/lookup?q=${encodeURIComponent(addrSearch)}`);
        const d = await res.json();
        if (d.google_error || d.error) { setGoogleError(d.google_error || d.error); setAddrSuggestions([]); }
        else { setGoogleError(""); setAddrSuggestions(d.predictions ?? []); }
      } catch { setGoogleError("Search unavailable"); }
    }, 300);
    return () => clearTimeout(t);
  }, [addrSearch]);

  const handleAddrSelect = async (pred: AddressSuggestion) => {
    setAddrSearch(pred.description);
    setAddrSuggestions([]);
    // Fetch details + save as address
    const res = await fetch("/api/msbiz/addresses/lookup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: pred.place_id }),
    });
    const d = await res.json();
    if (d.place) {
      const saveRes = await fetch("/api/msbiz/addresses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d.place, label: "Shipping" }),
      });
      const saved = await saveRes.json();
      if (saved.address) {
        setAddresses(prev => [...prev, saved.address]);
        setForm(f => ({ ...f, shipping_address_id: saved.address.id }));
        setAddrSearch(saved.address.full_address);
      }
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const autoTotal = () => {
    const t = (parseFloat(form.subtotal) || 0) + (parseFloat(form.tax) || 0) + (parseFloat(form.shipping_cost) || 0);
    setForm(f => ({ ...f, total: t.toFixed(2) }));
  };

  const submit = async () => {
    if (!form.account_id || !form.ms_order_number || !form.order_date) {
      setError("Account, order number, and date are required"); return;
    }
    setSaving(true); setError("");
    const method = orderId ? "PUT" : "POST";
    const url = orderId ? `/api/msbiz/orders/${orderId}` : "/api/msbiz/orders";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, subtotal: parseFloat(form.subtotal) || 0, tax: parseFloat(form.tax) || 0,
        shipping_cost: parseFloat(form.shipping_cost) || 0, total: parseFloat(form.total) || 0,
        shipping_address_id: form.shipping_address_id || null, tracking_number: form.tracking_number || null,
        carrier: form.carrier || null }),
    });
    if (res.ok) { onSaved(); } else {
      const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Bento grid header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="rounded-md bg-blue-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />
              ))}
            </div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{orderId ? "Edit Order" : "Add Order"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{orderId ? "Update order details" : "Create a new order"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">MS Account *</label>
              <select value={form.account_id} onChange={e => set("account_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option value="">Select account…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.display_name || a.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order Number *</label>
              <input value={form.ms_order_number} onChange={e => set("ms_order_number", e.target.value)}
                placeholder="e.g., 1234567890" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order Date *</label>
            <input type="date" value={form.order_date} onChange={e => set("order_date", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[["subtotal","Subtotal"],["tax","Tax"],["shipping_cost","Shipping"]].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <input type="number" step="0.01" value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)} onBlur={autoTotal}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Total</label>
            <input type="number" step="0.01" value={form.total} onChange={e => set("total", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
          </div>

          {/* Address with Google autocomplete */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Shipping Address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search className="w-4 h-4 text-gray-500" /></div>
              <input value={addrSearch} onChange={e => { setAddrSearch(e.target.value); setGoogleError(""); }}
                placeholder="Start typing to search (Google Places)…"
                className={`w-full bg-gray-800 border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none transition-colors ${googleError ? "border-red-700" : "border-gray-700 focus:border-amber-500"}`} />
              {googleError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-400">⚠ {googleError}</p>}
              {addrSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {addrSuggestions.map(s => (
                    <button key={s.place_id} onClick={() => handleAddrSelect(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {addresses.length > 0 && (
              <select value={form.shipping_address_id} onChange={e => { set("shipping_address_id", e.target.value); setAddrSearch(addresses.find(a => a.id === e.target.value)?.full_address ?? ""); }}
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-500">
                <option value="">— Or pick saved address —</option>
                {addresses.map(a => <option key={a.id} value={a.id}>{a.label ? `[${a.label}] ` : ""}{a.full_address}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tracking Number</label>
              <input value={form.tracking_number} onChange={e => set("tracking_number", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Carrier</label>
              <select value={form.carrier} onChange={e => set("carrier", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {["UPS","FedEx","USPS","DHL","Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving…" : orderId ? "Update Order" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
