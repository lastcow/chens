"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import {
  ShoppingCart, X, Save, DollarSign, Package
} from "lucide-react";

interface PO {
  id: string; requester_id: string; merchandise_id: string;
  qty: number; completed_qty: number; required_price: number | null;
  deadline: string | null; warehouse_id: string | null; status: string; notes: string | null;
}

interface LockedMerchandise {
  id: string; name: string; upc: string | null; model: string | null;
  image_url: string | null; price: number;
}

interface User { id: string; name: string | null; email: string; }
interface Merch { id: string; name: string; upc: string | null; model: string | null; image_url: string | null; price: number; }
interface Warehouse { id: string; name: string; full_address: string | null; city: string | null; state: string | null; zip: string | null; }

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

interface Props {
  po?: PO | null;
  lockedMerchandise?: LockedMerchandise | null; // pre-fill + lock merchandise
  onClose: () => void;
  onSaved: () => void;
}

export default function POFormDialog({ po, lockedMerchandise, onClose, onSaved }: Props) {
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [allUsers, setAllUsers]     = useState<User[]>([]);
  const [allMerch, setAllMerch]     = useState<Merch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    requester_id:  po?.requester_id ?? "",
    merchandise_id: lockedMerchandise?.id ?? po?.merchandise_id ?? "",
    qty:           String(po?.qty ?? "1"),
    completed_qty: String(po?.completed_qty ?? "0"),
    required_price: lockedMerchandise?.price != null
      ? String(Number(lockedMerchandise.price).toFixed(2))
      : po?.required_price != null ? String(po.required_price) : "",
    deadline:      po?.deadline ? po.deadline.slice(0, 10) : "",
    warehouse_id:  po?.warehouse_id ?? "",
    status:        po?.status ?? "pending",
    notes:         po?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/msbiz-users").then(r => r.json()),
      !lockedMerchandise ? fetch("/api/admin/merchandise?limit=500").then(r => r.json()) : Promise.resolve({ items: [] }),
      fetch("/api/admin/msbiz-warehouses").then(r => r.json()),
    ]).then(([u, m, w]) => {
      setAllUsers(u.users ?? []);
      setAllMerch(m.items ?? []);
      setWarehouses(w.warehouses ?? []);
    }).catch(() => {});
  }, [lockedMerchandise]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const activeMerch: LockedMerchandise | Merch | undefined =
    lockedMerchandise ?? allMerch.find(m => m.id === form.merchandise_id);
  const selectedWarehouse = warehouses.find(w => w.id === form.warehouse_id);

  const handleMerchChange = (id: string) => {
    const m = allMerch.find(x => x.id === id);
    setForm(f => ({
      ...f,
      merchandise_id: id,
      required_price: m ? String(Number(m.price).toFixed(2)) : f.required_price,
    }));
  };

  const submit = async () => {
    if (!form.requester_id)                      { setError("Requester is required"); return; }
    if (!form.merchandise_id)                    { setError("Merchandise is required"); return; }
    if (!form.qty || parseInt(form.qty) < 1)     { setError("Qty must be at least 1"); return; }
    if (!form.required_price)                    { setError("Required price is required"); return; }
    if (!form.warehouse_id)                      { setError("Ship to warehouse is required"); return; }
    setSaving(true); setError("");
    const body = {
      requester_id:   form.requester_id,
      merchandise_id: form.merchandise_id,
      qty:            parseInt(form.qty) || 1,
      completed_qty:  parseInt(form.completed_qty) || 0,
      required_price: parseFloat(form.required_price),
      deadline:       form.deadline || null,
      warehouse_id:   form.warehouse_id,
      status:         form.status,
      notes:          form.notes || null,
    };
    const res = await fetch(po ? `/api/admin/purchase-orders/${po.id}` : "/api/admin/purchase-orders", {
      method: po ? "PUT" : "POST",
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
              style={{ backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1.5 p-3 opacity-[0.06]">
              {[...Array(18)].map((_, i) => <div key={i} className="rounded-md bg-amber-400" style={{ opacity: i % 3 === 0 ? 1 : 0.3 }} />)}
            </div>
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{po ? "Edit PO" : "New Purchase Order"}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lockedMerchandise ? `For: ${lockedMerchandise.name}` : po ? "Updating PO" : "Create a new purchase order"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Requester */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Requester * <span className="text-gray-600 normal-case font-normal">(MS Business users)</span>
            </label>
            <Select
              styles={selectStyles}
              options={allUsers.map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={allUsers.filter(u => u.id === form.requester_id).map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))[0] ?? null}
              onChange={opt => set("requester_id", opt?.value ?? "")}
              placeholder="Search MS Business users…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </div>

          {/* Merchandise — locked or searchable */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Merchandise *</label>
            {lockedMerchandise ? (
              <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                {lockedMerchandise.image_url && (
                  <img src={lockedMerchandise.image_url} className="w-8 h-8 object-contain rounded border border-gray-700 shrink-0" alt=""
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">{lockedMerchandise.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono flex gap-2">
                    {lockedMerchandise.upc && <span>{lockedMerchandise.upc}</span>}
                    {lockedMerchandise.model && <span>{lockedMerchandise.model}</span>}
                    <span className="text-green-400">${Number(lockedMerchandise.price).toFixed(2)}</span>
                  </div>
                </div>
                <span className="ml-auto text-[10px] text-gray-600 shrink-0">locked</span>
              </div>
            ) : (
              <>
                <Select
                  styles={selectStyles}
                  options={allMerch.map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}${m.model ? ` · ${m.model}` : ""}` }))}
                  value={allMerch.filter(m => m.id === form.merchandise_id).map(m => ({ value: m.id, label: `${m.name}${m.upc ? ` · ${m.upc}` : ""}${m.model ? ` · ${m.model}` : ""}` }))[0] ?? null}
                  onChange={opt => handleMerchChange(opt?.value ?? "")}
                  placeholder="Search by name, UPC, model…"
                  isClearable
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
                {activeMerch && !lockedMerchandise && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                    {(activeMerch as Merch).image_url && (
                      <img src={(activeMerch as Merch).image_url!} className="w-8 h-8 object-contain rounded border border-gray-700" alt=""
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <span>List: <span className="text-green-400 font-mono">${Number(activeMerch.price).toFixed(2)}</span></span>
                    {(activeMerch as Merch).model && <span className="text-gray-600">· {(activeMerch as Merch).model}</span>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Qty + Completed + Required Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Qty *</label>
              <input type="number" min="1" value={form.qty} onChange={e => set("qty", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Completed</label>
              <input type="number" min="0" value={form.completed_qty} onChange={e => set("completed_qty", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Req. Price ($) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" inputMode="decimal" value={form.required_price}
                  onChange={e => set("required_price", e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          {/* Deadline + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                {["pending","approved","ordered","received","cancelled"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Ship To Warehouse *</label>
            <select value={form.warehouse_id} onChange={e => set("warehouse_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              <option value="">— None —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {selectedWarehouse?.full_address && (
              <div className="mt-1.5 text-[11px] text-gray-500 flex items-start gap-1.5">
                <Package className="w-3 h-3 mt-0.5 text-gray-600 shrink-0" />
                <span>{selectedWarehouse.full_address}</span>
              </div>
            )}
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
            {saving ? "Saving…" : po ? "Update PO" : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
}
