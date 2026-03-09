"use client";
import { useEffect, useState } from "react";

type ModuleRow = {
  id: string; label: string; icon: string; description: string;
  is_free: boolean;
  price_one_time: string | null; price_monthly: string | null; price_annual: string | null;
  allow_one_time: boolean; allow_monthly: boolean; allow_annual: boolean;
};

export default function AdminPricing() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [editing, setEditing] = useState<ModuleRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/modules-catalog").then(r => r.json()).then(d => {
      setModules(d.modules || []); setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const annual = !editing.is_free && editing.allow_annual && editing.price_monthly
      ? (parseFloat(editing.price_monthly) * 12 * 0.9).toFixed(2)
      : editing.price_annual;

    const res = await fetch("/api/admin/modules-catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, price_annual: annual }),
    });
    if (res.ok) {
      const { module: updated } = await res.json();
      setModules(prev => prev.map(m => m.id === updated.id ? updated : m));
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {modules.map((mod) => (
          <div key={mod.id} className="card border border-gray-700/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mod.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{mod.label}</h3>
                  <p className="text-xs text-gray-500">{mod.id}</p>
                </div>
                {mod.is_free
                  ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Free</span>
                  : <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Paid</span>
                }
              </div>
              <button onClick={() => setEditing({ ...mod })} className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1 rounded">
                Edit Pricing
              </button>
            </div>

            {!mod.is_free && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {mod.allow_one_time && <div className="bg-gray-800 px-3 py-2 rounded-lg"><p className="text-gray-400 text-xs">One-time</p><p className="font-bold text-white">${mod.price_one_time}</p></div>}
                {mod.allow_monthly && <div className="bg-gray-800 px-3 py-2 rounded-lg"><p className="text-gray-400 text-xs">Monthly</p><p className="font-bold text-white">${mod.price_monthly}<span className="text-gray-500 font-normal">/mo</span></p></div>}
                {mod.allow_annual && <div className="bg-gray-800 px-3 py-2 rounded-lg relative"><span className="absolute -top-1.5 -right-1.5 text-xs bg-amber-500 text-black px-1.5 rounded-full font-bold">10% off</span><p className="text-gray-400 text-xs">Annual</p><p className="font-bold text-white">${mod.price_annual}<span className="text-gray-500 font-normal">/yr</span></p></div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing.icon} {editing.label} — Pricing</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Free toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setEditing(e => e ? { ...e, is_free: !e.is_free } : e)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_free ? "bg-green-500" : "bg-gray-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_free ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-medium">{editing.is_free ? "Free module" : "Paid module"}</span>
            </label>

            {!editing.is_free && (
              <div className="space-y-4">
                {/* One-time */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editing.allow_one_time} onChange={e => setEditing(v => v ? { ...v, allow_one_time: e.target.checked } : v)} className="accent-amber-500" />
                    One-time purchase
                  </label>
                  {editing.allow_one_time && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={editing.price_one_time ?? ""} onChange={e => setEditing(v => v ? { ...v, price_one_time: e.target.value } : v)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-amber-500" placeholder="0.00" />
                    </div>
                  )}
                </div>

                {/* Monthly */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editing.allow_monthly} onChange={e => setEditing(v => v ? { ...v, allow_monthly: e.target.checked } : v)} className="accent-amber-500" />
                    Monthly subscription
                  </label>
                  {editing.allow_monthly && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={editing.price_monthly ?? ""} onChange={e => setEditing(v => v ? { ...v, price_monthly: e.target.value } : v)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-amber-500" placeholder="0.00" />
                      <span className="text-gray-500 text-xs">/month</span>
                    </div>
                  )}
                </div>

                {/* Annual */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editing.allow_annual} onChange={e => setEditing(v => v ? { ...v, allow_annual: e.target.checked } : v)} className="accent-amber-500" />
                    Annual subscription <span className="text-amber-400 text-xs font-medium">10% off auto</span>
                  </label>
                  {editing.allow_annual && editing.price_monthly && (
                    <p className="ml-5 text-xs text-gray-500">
                      Auto-calculated: ${(parseFloat(editing.price_monthly) * 12 * 0.9).toFixed(2)}/yr
                      {" "}(= ${editing.price_monthly}/mo × 12 × 0.9)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
