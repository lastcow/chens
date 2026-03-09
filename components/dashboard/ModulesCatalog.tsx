"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ModuleDef = {
  id: string; label: string; icon: string; description: string;
  is_free: boolean;
  price_one_time: string | null; price_monthly: string | null; price_annual: string | null;
  allow_one_time: boolean; allow_monthly: boolean; allow_annual: boolean;
  features: string[];
};
type UserModuleMap = Record<string, { enabled: boolean; payment_type: string | null }>;

export default function ModulesCatalog({
  modules, userModules,
}: {
  modules: ModuleDef[];
  userModules: UserModuleMap;
}) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Record<string, "one_time" | "monthly" | "annual">>({});
  const [loading, setLoading] = useState<string | null>(null);

  const getPlan = (id: string, mod: ModuleDef) =>
    selectedPlan[id] ?? (mod.allow_monthly ? "monthly" : mod.allow_annual ? "annual" : "one_time");

  const activate = async (mod: ModuleDef) => {
    setLoading(mod.id);
    const paymentType = mod.is_free ? "free" : getPlan(mod.id, mod);

    const res = await fetch("/api/user/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: mod.id, paymentType }),
    });
    const data = await res.json();

    if (data.activated) {
      router.refresh();
    } else if (data.url) {
      window.location.href = data.url;
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Available Modules</h2>
        <p className="text-gray-400 text-sm">Extend your platform with additional features.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {modules.map((mod) => {
          const userMod = userModules[mod.id];
          const enabled = userMod?.enabled ?? false;
          const plan = getPlan(mod.id, mod);
          const annualPrice = mod.price_monthly
            ? (parseFloat(mod.price_monthly) * 12 * 0.9).toFixed(2)
            : mod.price_annual;

          return (
            <div key={mod.id} className={`card border transition-colors ${enabled ? "border-amber-500/30" : "border-gray-700/50"}`}>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Icon + info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`text-3xl p-3 rounded-xl shrink-0 ${enabled ? "bg-amber-500/10" : "bg-gray-800"}`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white">{mod.label}</h3>
                      {enabled ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                          ✓ Active{userMod?.payment_type ? ` · ${userMod.payment_type.replace("_", " ")}` : ""}
                        </span>
                      ) : mod.is_free ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Free</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{mod.description}</p>
                    <ul className="space-y-1">
                      {mod.features?.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={enabled ? "text-amber-400" : "text-gray-600"}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing + CTA */}
                {!enabled && (
                  <div className="shrink-0 w-full md:w-52 space-y-3">
                    {!mod.is_free && (
                      <>
                        {/* Plan selector */}
                        <div className="flex flex-col gap-1.5 text-sm">
                          {mod.allow_one_time && (
                            <label className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${plan === "one_time" ? "border-amber-500/50 bg-amber-500/5" : "border-gray-700 hover:border-gray-600"}`}>
                              <span className="flex items-center gap-2">
                                <input type="radio" name={`plan-${mod.id}`} value="one_time" checked={plan === "one_time"}
                                  onChange={() => setSelectedPlan(p => ({ ...p, [mod.id]: "one_time" }))} className="accent-amber-500" />
                                One-time
                              </span>
                              <span className="font-bold text-white">${mod.price_one_time}</span>
                            </label>
                          )}
                          {mod.allow_monthly && (
                            <label className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${plan === "monthly" ? "border-amber-500/50 bg-amber-500/5" : "border-gray-700 hover:border-gray-600"}`}>
                              <span className="flex items-center gap-2">
                                <input type="radio" name={`plan-${mod.id}`} value="monthly" checked={plan === "monthly"}
                                  onChange={() => setSelectedPlan(p => ({ ...p, [mod.id]: "monthly" }))} className="accent-amber-500" />
                                Monthly
                              </span>
                              <span className="font-bold text-white">${mod.price_monthly}<span className="text-gray-500 font-normal text-xs">/mo</span></span>
                            </label>
                          )}
                          {mod.allow_annual && (
                            <label className={`relative flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${plan === "annual" ? "border-amber-500/50 bg-amber-500/5" : "border-gray-700 hover:border-gray-600"}`}>
                              <span className="absolute -top-2 right-2 text-xs bg-amber-500 text-black px-1.5 rounded-full font-bold">10% off</span>
                              <span className="flex items-center gap-2">
                                <input type="radio" name={`plan-${mod.id}`} value="annual" checked={plan === "annual"}
                                  onChange={() => setSelectedPlan(p => ({ ...p, [mod.id]: "annual" }))} className="accent-amber-500" />
                                Annual
                              </span>
                              <span className="font-bold text-white">${annualPrice}<span className="text-gray-500 font-normal text-xs">/yr</span></span>
                            </label>
                          )}
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => activate(mod)}
                      disabled={loading === mod.id}
                      className="w-full btn-primary py-2 text-sm disabled:opacity-50"
                    >
                      {loading === mod.id ? "Processing…" : mod.is_free ? "Activate Free" : "Purchase"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
