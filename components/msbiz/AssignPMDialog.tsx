"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import { X, Save, Tag, RefreshCw } from "lucide-react";

interface PMUser { id: string; name: string | null; email: string; }
interface OrderItem { id: string; name: string; qty: number; unit_price: number; merchandise_id?: string; }

interface Props {
  order: {
    id: string;
    ms_order_number: string;
    order_date: string;
    pm_status: string | null;
    pm_deadline_at: string | null;
    items: OrderItem[];
    total: number;
  };
  onClose: () => void;
  onSaved: () => void;
}

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

export default function AssignPMDialog({ order, onClose, onSaved }: Props) {
  const [pmers, setPmers]       = useState<PMUser[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const deadline = order.pm_deadline_at ? order.pm_deadline_at.slice(0, 10) : null;
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    // Fetch users with pm.manage permission (pmer role)
    fetch("/api/msbiz/users?role=pmer")
      .then(r => r.json())
      .then(d => setPmers(d.users ?? []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSaving(true); setError("");

    // 1. Set order pm_status = 'unpmed' + pm_deadline_at
    const res = await fetch(`/api/msbiz/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pm_status: "pm.submitted",
        pm_deadline_at: deadline || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to update order");
      setSaving(false); return;
    }

    // 2. Create PM entries for each item
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      await fetch("/api/msbiz/price-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id:       order.id,
          original_price: Number(item.unit_price),
          match_price:    Number(item.unit_price),  // placeholder, pmer will update
          expires_at:     deadline || null,
          notes:          assignedTo ? `Assigned to: ${pmers.find(u => u.id === assignedTo)?.name ?? assignedTo}` : null,
        }),
      });
    }

    onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col">

        {/* Bento header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
            <div className="absolute -top-8 -left-8 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 right-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Tag className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Assign to PM Queue</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{order.ms_order_number}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Order summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 space-y-1.5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Order Items</div>
            {Array.isArray(order.items) && order.items.length > 0 ? order.items.map((it, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-gray-400 truncate">{it.qty}× {it.name}</span>
                <span className="text-gray-500 font-mono shrink-0">${(Number(it.unit_price) * it.qty).toFixed(2)}</span>
              </div>
            )) : <span className="text-xs text-gray-600">No items</span>}
            <div className="flex justify-between pt-1 border-t border-gray-700/50 text-xs">
              <span className="text-gray-600">Total</span>
              <span className="font-mono text-white font-medium">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Assign to pmer */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Assign To <span className="normal-case font-normal text-gray-600">(PM role user, optional)</span>
            </label>
            <Select
              styles={selectStyles}
              options={pmers.map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))}
              value={pmers.filter(u => u.id === assignedTo).map(u => ({ value: u.id, label: u.name ? `${u.name} · ${u.email}` : u.email }))[0] ?? null}
              onChange={opt => setAssignedTo(opt?.value ?? "")}
              placeholder="Select PM handler…"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </div>


        </div>

        <div className="border-t border-gray-800 px-5 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-40 transition-colors">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Assigning…" : "Add to PM Queue"}
          </button>
        </div>
      </div>
    </div>
  );
}
