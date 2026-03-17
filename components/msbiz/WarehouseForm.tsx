"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Address { id: string; label: string | null; full_address: string; }

interface Props { warehouseId?: string; onClose: () => void; onSaved: () => void; }

export default function WarehouseForm({ warehouseId, onClose, onSaved }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", address_id: "", capacity_units: "",
  });

  useEffect(() => {
    fetch("/api/msbiz/addresses")
      .then(r => r.json())
      .then(d => setAddresses(d.addresses ?? []))
      .catch(() => {});

    if (warehouseId) {
      fetch(`/api/msbiz/warehouses/${warehouseId}`)
        .then(r => r.json())
        .then(d => {
          if (d.warehouse) {
            const w = d.warehouse;
            setForm({ name: w.name, address_id: w.address_id, capacity_units: w.capacity_units ?? "" });
          }
        })
        .catch(() => {});
    }
  }, [warehouseId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.address_id) {
      setError("Name and address are required"); return;
    }
    setSaving(true); setError("");
    const method = warehouseId ? "PUT" : "POST";
    const url = warehouseId ? `/api/msbiz/warehouses/${warehouseId}` : "/api/msbiz/warehouses";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, address_id: form.address_id,
        capacity_units: form.capacity_units ? parseInt(form.capacity_units, 10) : null,
      }),
    });

    if (res.ok) { onSaved(); } else {
      const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{warehouseId ? "Edit Warehouse" : "Add Warehouse"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Warehouse Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Address *</label>
            <select value={form.address_id} onChange={e => set("address_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
              <option value="">Select address…</option>
              {addresses.map(a => (
                <option key={a.id} value={a.id}>{a.label ? `[${a.label}] ` : ""}{a.full_address}</option>
              ))}
            </select>

          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Capacity (units)</label>
            <input type="number" value={form.capacity_units} onChange={e => set("capacity_units", e.target.value)}
              placeholder="e.g., 10000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono" />
          </div>
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-purple-500/90 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
