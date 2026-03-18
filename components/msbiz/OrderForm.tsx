"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import { X, Package, Plus, Trash2, Save } from "lucide-react";

interface Account { id: string; email: string; display_name: string | null; balance: number | null; }
interface Merch   { id: string; name: string; upc: string | null; model: string | null; image_url: string | null; price: number; }

interface OrderItem {
  _key: string;           // local-only UUID for React keys
  merchandise_id: string;
  name: string;
  qty: number;
  unit_price: string;
}

interface Props { onClose: () => void; onSaved: () => void; orderId?: string; }

// ─── react-select dark styles ─────────────────────────────────────────────────
const selectStyles = {
  control: (b: object) => ({ ...b, backgroundColor: "#1f2937", borderColor: "#374151", minHeight: "38px", boxShadow: "none", "&:hover": { borderColor: "#6b7280" } }),
  menu: (b: object) => ({ ...b, backgroundColor: "#111827", border: "1px solid #374151", zIndex: 9999 }),
  menuList: (b: object) => ({ ...b, maxHeight: "200px" }),
  option: (b: object, s: { isFocused: boolean; isSelected: boolean }) => ({
    ...b, backgroundColor: s.isSelected ? "#d97706" : s.isFocused ? "#1f2937" : "transparent",
    color: s.isSelected ? "#fff" : "#e5e7eb", fontSize: "13px", cursor: "pointer",
    "&:active": { backgroundColor: "#92400e" },
  }),
  singleValue: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  input: (b: object) => ({ ...b, color: "#f3f4f6", fontSize: "13px" }),
  placeholder: (b: object) => ({ ...b, color: "#6b7280", fontSize: "13px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b: object) => ({ ...b, color: "#6b7280", padding: "0 6px" }),
  clearIndicator: (b: object) => ({ ...b, color: "#6b7280" }),
};

let _keyCounter = 0;
const newKey = () => `item_${++_keyCounter}_${Date.now()}`;

const emptyItem = (): OrderItem => ({ _key: newKey(), merchandise_id: "", name: "", qty: 1, unit_price: "" });

export default function OrderForm({ onClose, onSaved, orderId }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [merch, setMerch]       = useState<Merch[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [form, setForm] = useState({
    account_id: "", ms_order_number: "",
    order_date: new Date().toISOString().split("T")[0],
    subtotal: "", tax: "", total: "",
    notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);

  useEffect(() => {
    Promise.all([
      fetch("/api/msbiz/accounts").then(r => r.json()),
      fetch("/api/msbiz/merchandise?limit=500").then(r => r.json()),
    ]).then(([a, m]) => {
      setAccounts(a.accounts ?? []);
      setMerch(m.items ?? []);
    });

    if (orderId) {
      fetch(`/api/msbiz/orders/${orderId}`).then(r => r.json()).then(d => {
        const o = d.order;
        if (!o) return;
        setForm({
          account_id: o.account_id, ms_order_number: o.ms_order_number,
          order_date: o.order_date?.split("T")[0] ?? "",
          subtotal: o.subtotal ?? "", tax: o.tax ?? "",
          total: o.total ?? "",
          notes: o.notes ?? "",
        });
        if (Array.isArray(o.items) && o.items.length > 0) {
          setItems(o.items.map((it: Record<string, unknown>) => ({
            _key: newKey(),
            merchandise_id: String(it.merchandise_id ?? ""),
            name: String(it.name ?? ""),
            qty: Number(it.qty ?? 1),
            unit_price: String(it.unit_price ?? ""),
          })));
        }
      });
    }
  }, [orderId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── auto-recalc subtotal + total from items ──────────────────────────────
  const recalcFromItems = (updatedItems: OrderItem[]) => {
    const sub = updatedItems.reduce((acc, i) => acc + (parseFloat(i.unit_price) || 0) * (i.qty || 1), 0);
    setForm(f => {
      const total = sub + (parseFloat(f.tax) || 0);
      return { ...f, subtotal: sub.toFixed(2), total: total.toFixed(2) };
    });
  };

  // recalc when tax changes
  const autoTotal = () => {
    const sub = parseFloat(form.subtotal) || 0;
    const total = sub + (parseFloat(form.tax) || 0);
    setForm(f => ({ ...f, total: total.toFixed(2) }));
  };

  // ── items helpers ─────────────────────────────────────────────────────────
  const addItem = () => {
    const next = (prev: OrderItem[]) => [...prev, emptyItem()];
    setItems(prev => { const n = next(prev); recalcFromItems(n); return n; });
  };

  const removeItem = (key: string) => {
    setItems(prev => {
      if (prev.length <= 1) return prev;
      const n = prev.filter(i => i._key !== key);
      recalcFromItems(n);
      return n;
    });
  };

  const updateItem = (key: string, patch: Partial<OrderItem>) => {
    setItems(prev => {
      const n = prev.map(i => i._key === key ? { ...i, ...patch } : i);
      recalcFromItems(n);
      return n;
    });
  };

  const handleMerchChange = (key: string, merchandiseId: string) => {
    const m = merch.find(x => x.id === merchandiseId);
    setItems(prev => {
      const n = prev.map(i => i._key === key ? {
        ...i,
        merchandise_id: merchandiseId,
        name: m?.name ?? "",
        unit_price: m ? String(Number(m.price).toFixed(2)) : "",
      } : i);
      recalcFromItems(n);
      return n;
    });
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.account_id) { setError("MS Account is required"); return; }
    if (!form.ms_order_number) { setError("Order number is required"); return; }
    if (!form.order_date) { setError("Order date is required"); return; }
    const validItems = items.filter(i => i.merchandise_id);
    if (validItems.length === 0) { setError("At least one merchandise item is required"); return; }

    setSaving(true); setError("");
    const payload = {
      ...form,
      subtotal: parseFloat(form.subtotal) || 0,
      tax: parseFloat(form.tax) || 0,
      shipping_cost: 0,
      total: parseFloat(form.total) || 0,
      shipping_address_id: null,
      tracking_number: null,
      carrier: null,
      items: validItems.map(({ _key, ...rest }) => ({
        ...rest,
        qty: Number(rest.qty) || 1,
        unit_price: parseFloat(rest.unit_price) || 0,
      })),
    };

    const res = await fetch(orderId ? `/api/msbiz/orders/${orderId}` : "/api/msbiz/orders", {
      method: orderId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { onSaved(); }
    else { const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false); }
  };

  const merchOptions = merch.map(m => ({
    value: m.id,
    label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}${m.model ? ` · ${m.model}` : ""}`,
    price: m.price,
  }));

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: a.display_name
      ? `${a.display_name} · ${a.email}${a.balance != null ? ` · $${Number(a.balance).toFixed(2)}` : ""}`
      : `${a.email}${a.balance != null ? ` · $${Number(a.balance).toFixed(2)}` : ""}`,
  }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
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

          {/* MS Account — searchable */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">MS Account *</label>
            <Select
              styles={selectStyles}
              options={accountOptions}
              value={accountOptions.find(o => o.value === form.account_id) ?? null}
              onChange={opt => set("account_id", opt?.value ?? "")}
              placeholder="Search accounts…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </div>

          {/* Order number + date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order Number *</label>
              <input value={form.ms_order_number} onChange={e => set("ms_order_number", e.target.value)}
                placeholder="e.g., 1234567890"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Order Date *</label>
              <input type="date" value={form.order_date} onChange={e => set("order_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* ── Merchandise items ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Items *</label>
              <button onClick={addItem}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-md px-2 py-1 transition-colors">
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const selectedMerch = merch.find(m => m.id === item.merchandise_id);
                return (
                  <div key={item._key} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 w-4 shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Select
                          styles={selectStyles}
                          options={merchOptions}
                          value={merchOptions.find(o => o.value === item.merchandise_id) ?? null}
                          onChange={opt => handleMerchChange(item._key, opt?.value ?? "")}
                          placeholder="Search merchandise…"
                          isClearable
                          menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                        />
                      </div>
                      <button onClick={() => removeItem(item._key)} disabled={items.length === 1}
                        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image + price preview */}
                    {selectedMerch && (
                      <div className="flex items-center gap-2 pl-6 text-[11px] text-gray-500">
                        {selectedMerch.image_url && (
                          <img src={selectedMerch.image_url} className="w-7 h-7 object-contain rounded border border-gray-700 shrink-0" alt=""
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-green-400 font-mono">List ${Number(selectedMerch.price).toFixed(2)}</span>
                        {selectedMerch.model && <span className="text-gray-600">· {selectedMerch.model}</span>}
                      </div>
                    )}

                    {/* Qty + unit price */}
                    <div className="flex items-center gap-3 pl-6">
                      <div className="w-20">
                        <label className="text-[10px] text-gray-600 mb-0.5 block">Qty</label>
                        <input type="number" min="1" value={item.qty}
                          onChange={e => updateItem(item._key, { qty: parseInt(e.target.value) || 1 })}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-600 mb-0.5 block">Unit Price ($)</label>
                        <input type="text" inputMode="decimal" value={item.unit_price}
                          onChange={e => updateItem(item._key, { unit_price: e.target.value.replace(/[^0-9.]/g, "") })}
                          placeholder={selectedMerch ? Number(selectedMerch.price).toFixed(2) : "0.00"}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
                      </div>
                      {item.unit_price && item.qty > 0 && (
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] text-gray-600 mb-0.5">Line total</div>
                          <div className="text-sm font-mono text-white">
                            ${(parseFloat(item.unit_price) * item.qty).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financials — subtotal auto-computed from items, tax manual, total = subtotal + tax */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Subtotal</label>
              <input type="number" step="0.01" value={form.subtotal} readOnly
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 font-mono cursor-default" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tax</label>
              <input type="number" step="0.01" value={form.tax}
                onChange={e => set("tax", e.target.value)} onBlur={autoTotal}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Total</label>
              <input type="number" step="0.01" value={form.total} readOnly
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 font-mono cursor-default" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : orderId ? "Update Order" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
