"use client";
import { useEffect, useState } from "react";
import { X, Save, Truck, RefreshCw } from "lucide-react";

interface Props {
  orderId: string;
  initialTracking: string | null;
  initialCarrier: string | null;
  onClose: () => void;
  onSaved: (tracking: string, carrier: string) => void;
}

const CARRIER_PATTERNS: [RegExp, string][] = [
  [/^1Z/i,       "UPS"],
  [/^\d{12}$|^\d{15}$|^\d{20}$/, "FedEx"],
  [/^(94|93|92|91|90)\d{18,20}$/, "USPS"],
  [/^[A-Z]{2}\d{9}US$/i, "USPS"],
];

function detectCarrier(num: string): string {
  const clean = num.replace(/\s/g, "");
  for (const [pat, carrier] of CARRIER_PATTERNS) {
    if (pat.test(clean)) return carrier;
  }
  return "";
}

export default function ShippingDialog({ orderId, initialTracking, initialCarrier, onClose, onSaved }: Props) {
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [carrier,  setCarrier]  = useState(initialCarrier  ?? "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState<{ events_count: number; easypost: boolean } | null>(null);

  // Auto-detect carrier as user types
  useEffect(() => {
    if (tracking.length >= 10) {
      const detected = detectCarrier(tracking);
      if (detected) setCarrier(detected);
    }
  }, [tracking]);

  const submit = async () => {
    if (!tracking.trim()) { setError("Tracking number is required"); return; }
    if (!carrier)          { setError("Carrier is required"); return; }
    setSaving(true); setError(""); setResult(null);

    // 1. Upsert shipping record
    const upd = await fetch(`/api/msbiz/orders/${orderId}/shipping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number: tracking.trim(), carrier }),
    });
    if (!upd.ok) {
      const d = await upd.json();
      setError(d.error || "Failed to save shipping");
      setSaving(false); return;
    }

    // 2. Call tracking endpoint to pull EasyPost data
    const tr = await fetch("/api/msbiz/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id: orderId, ref_type: "order", tracking_number: tracking.trim(), carrier, refresh: true }),
    });
    const trData = tr.ok ? await tr.json() : null;
    if (trData) setResult(trData);

    onSaved(tracking.trim(), carrier);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col">

        {/* Bento header */}
        <div className="relative overflow-hidden rounded-t-2xl shrink-0 border-b border-gray-800">
          <div className="absolute inset-0 bg-gray-950">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
            <div className="absolute -top-8 -left-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 right-8 w-28 h-28 bg-blue-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {initialTracking ? "Update Shipping" : "Add Shipping"}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Tracking + EasyPost sync</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {result && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400 space-y-0.5">
              <div className="font-medium">Tracking synced ✓</div>
              <div>{result.events_count} event{result.events_count !== 1 ? "s" : ""} pulled{result.easypost ? " via EasyPost" : " (no EasyPost key)"}</div>
            </div>
          )}

          {/* Tracking number */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tracking Number *</label>
            <input value={tracking} onChange={e => setTracking(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
          </div>

          {/* Carrier — auto-detected + manual override */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
              Carrier *
              {carrier && tracking.length >= 10 && detectCarrier(tracking) === carrier && (
                <span className="ml-2 text-[10px] text-blue-400 normal-case font-normal">auto-detected</span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["UPS","FedEx","USPS"].map(c => (
                <button key={c} onClick={() => setCarrier(c)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    carrier === c
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={submit} disabled={saving || !tracking.trim() || !carrier}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Syncing…" : initialTracking ? "Update & Sync" : "Add & Sync"}
          </button>
        </div>
      </div>
    </div>
  );
}
