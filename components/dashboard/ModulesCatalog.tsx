"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

type ModuleDef = {
  id: string; label: string; icon: string; description: string;
  is_free: boolean;
  price_one_time: string | null; price_monthly: string | null; price_annual: string | null;
  allow_one_time: boolean; allow_monthly: boolean; allow_annual: boolean;
  features: string[];
};

type UserModuleEntry = {
  enabled: boolean;
  payment_type: string | null;
  expires_at: string | null;
  activated_at: string | null;
  cancelled: boolean;
};
type UserModuleMap = Record<string, UserModuleEntry>;

function StatusBadge({ entry }: { entry: UserModuleEntry }) {
  const pt = entry.payment_type;
  const exp = entry.expires_at ? new Date(entry.expires_at) : null;
  const expired = exp && exp < new Date();

  if (expired) {
    return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Expired</span>;
  }
  if (entry.cancelled && exp) {
    return <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
      Cancelled · active until {exp.toLocaleDateString()}
    </span>;
  }
  if (pt === "one_time") {
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Purchased</span>;
  }
  if (pt === "free") {
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Active · Free</span>;
  }
  if (pt === "monthly") {
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
      ✓ Monthly{exp ? ` · renews ${exp.toLocaleDateString()}` : ""}
    </span>;
  }
  if (pt === "annual") {
    return <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
      ✓ Annual{exp ? ` · renews ${exp.toLocaleDateString()}` : ""}
    </span>;
  }
  return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Active</span>;
}

export default function ModulesCatalog({
  modules, userModules,
}: {
  modules: ModuleDef[];
  userModules: UserModuleMap;
}) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Record<string, "one_time" | "monthly" | "annual">>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null); // moduleId pending confirm

  const getPlan = (id: string, mod: ModuleDef) =>
    selectedPlan[id] ?? (mod.allow_monthly ? "monthly" : mod.allow_annual ? "annual" : "one_time");

  const activate = async (mod: ModuleDef) => {
    setLoading(mod.id); setError(null);
    const paymentType = mod.is_free ? "free" : getPlan(mod.id, mod);
    try {
      const res = await fetch("/api/user/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: mod.id, paymentType }),
      });
      const data = await res.json();
      if (data.activated) { router.refresh(); }
      else if (data.url) { window.location.href = data.url; }
      else { setError(data.error ?? "Something went wrong."); }
    } catch { setError("Network error. Please try again."); }
    setLoading(null);
  };

  const cancelSubscription = async (moduleId: string) => {
    setLoading(`cancel-${moduleId}`); setError(null); setCancelConfirm(null);
    try {
      const res = await fetch("/api/user/subscription/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (res.ok) { router.refresh(); }
      else { setError(data.error ?? "Failed to cancel subscription."); }
    } catch { setError("Network error. Please try again."); }
    setLoading(null);
  };

  const resumeSubscription = async (moduleId: string) => {
    setLoading(`resume-${moduleId}`); setError(null);
    try {
      const res = await fetch("/api/user/subscription/resume", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (res.ok) { router.refresh(); }
      else { setError(data.error ?? "Failed to resume subscription."); }
    } catch { setError("Network error. Please try again."); }
    setLoading(null);
  };

  const isSubscription = (pt: string | null) => pt === "monthly" || pt === "annual";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Available Modules</h2>
        <p className="text-gray-400 text-sm">Extend your platform with additional features.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 hover:text-red-300">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {modules.map((mod) => {
          const userMod = userModules[mod.id];
          const enabled = userMod?.enabled ?? false;
          const exp = userMod?.expires_at ? new Date(userMod.expires_at) : null;
          const expired = exp && exp < new Date();
          const cancelled = userMod?.cancelled ?? false;
          const canCancel = enabled && !cancelled && !expired && isSubscription(userMod?.payment_type ?? null);
          const canResume = enabled && cancelled && !expired && isSubscription(userMod?.payment_type ?? null);
          const plan = getPlan(mod.id, mod);
          const annualPrice = mod.price_monthly
            ? (parseFloat(mod.price_monthly) * 12 * 0.9).toFixed(2)
            : mod.price_annual;

          return (
            <div key={mod.id} className={`card border transition-colors ${
              enabled && !expired ? "border-amber-500/30" :
              expired ? "border-red-500/20 opacity-60" :
              "border-gray-700/50"
            }`}>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Icon + info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`text-3xl p-3 rounded-xl shrink-0 ${enabled && !expired ? "bg-amber-500/10" : "bg-gray-800"}`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white">{mod.label}</h3>
                      {enabled || expired
                        ? <StatusBadge entry={userMod} />
                        : mod.is_free
                          ? <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Free</span>
                          : null}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{mod.description}</p>

                    {/* Cancelled warning + Resume */}
                    {cancelled && !expired && exp && (
                      <div className="mb-3 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-3">
                        <span>⚠ Cancelled · active until <strong>{exp.toLocaleDateString()}</strong></span>
                        <button
                          onClick={() => resumeSubscription(mod.id)}
                          disabled={loading === `resume-${mod.id}`}
                          className="shrink-0 text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {loading === `resume-${mod.id}` ? "Resuming…" : "Resume"}
                        </button>
                      </div>
                    )}

                    <ul className="space-y-1">
                      {mod.features?.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={enabled && !expired ? "text-amber-400" : "text-gray-600"}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA area */}
                <div className="shrink-0 w-full md:w-52 space-y-3">
                  {/* Invite-only modules: show locked state if not already enabled */}
                  {mod.id === "msbiz" && (!enabled || expired) ? (
                    <div className="flex flex-col items-center gap-3 text-center py-2">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <LockKeyhole className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">Invite Only</p>
                        <p className="text-xs text-gray-500 mt-1">Contact your administrator to request access to this module.</p>
                      </div>
                    </div>
                  ) : !enabled || expired ? (
                    /* Purchase flow */
                    <>
                      {!mod.is_free && (
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
                      )}
                      <button onClick={() => activate(mod)} disabled={loading === mod.id}
                        className="w-full btn-primary py-2 text-sm disabled:opacity-50">
                        {loading === mod.id ? "Processing…" : mod.is_free ? "Activate Free" : expired ? "Renew" : "Purchase"}
                      </button>
                    </>
                  ) : canResume ? null : canCancel ? (
                    /* Cancel subscription */
                    cancelConfirm === mod.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 text-center">Cancel this subscription?</p>
                        <p className="text-xs text-gray-500 text-center">You keep access until {exp?.toLocaleDateString()}.</p>
                        <div className="flex gap-2">
                          <button onClick={() => cancelSubscription(mod.id)}
                            disabled={loading === `cancel-${mod.id}`}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs py-2 rounded-lg transition-colors">
                            {loading === `cancel-${mod.id}` ? "Cancelling…" : "Yes, cancel"}
                          </button>
                          <button onClick={() => setCancelConfirm(null)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-2 rounded-lg transition-colors">
                            Keep it
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setCancelConfirm(mod.id)}
                        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs py-2 rounded-lg transition-colors">
                        Cancel Subscription
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
