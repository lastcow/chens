"use client";
import { useEffect, useState } from "react";
import { ALL_MODULES } from "@/lib/modules";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  modules: Record<string, boolean>;
};

type ModuleCatalogRow = {
  id: string; label: string; icon: string; description: string;
  is_free: boolean;
  price_one_time: string | null; price_monthly: string | null; price_annual: string | null;
  allow_one_time: boolean; allow_monthly: boolean; allow_annual: boolean;
};

type ProfConfigRow = { key: string; value: string; label: string };

export default function AdminModules() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Pricing edit state
  const [editing, setEditing] = useState<ModuleCatalogRow | null>(null);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);

  // Prof config (AI grading cost etc.)
  const [profConfig, setProfConfig] = useState<ProfConfigRow[]>([]);
  const [configEdits, setConfigEdits] = useState<Record<string, string>>({});
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/modules").then((r) => r.json()),
      fetch("/api/admin/modules-catalog").then((r) => r.json()),
      fetch("/api/admin/prof-config").then((r) => r.json()),
    ]).then(([usersData, catalogData, configData]) => {
      setUsers(usersData.users || []);
      setCatalog(catalogData.modules || []);
      setProfConfig(configData.config || []);
      setLoading(false);
    });
  }, []);

  const toggle = async (userId: string, module: string, current: boolean) => {
    const key = `${userId}:${module}`;
    setSaving(key);
    const res = await fetch("/api/admin/modules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, module, enabled: !current }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, modules: { ...u.modules, [module]: !current } } : u
        )
      );
    }
    setSaving(null);
  };

  const savePricing = async () => {
    if (!editing) return;
    setPriceSaving(true);
    const annual =
      !editing.is_free && editing.allow_annual && editing.price_monthly
        ? (parseFloat(editing.price_monthly) * 12 * 0.9).toFixed(2)
        : editing.price_annual;

    const res = await fetch("/api/admin/modules-catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, price_annual: annual }),
    });
    if (res.ok) {
      const { module: updated } = await res.json();
      setCatalog((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    }
    setPriceSaving(false);
    setEditing(null);
  };

  const saveConfig = async (key: string) => {
    const value = configEdits[key];
    if (value === undefined) return;
    setConfigSaving(true);
    const res = await fetch("/api/admin/prof-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      setProfConfig((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
      setConfigEdits((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setConfigSaved(true); setTimeout(() => setConfigSaved(false), 2000);
    }
    setConfigSaving(false);
  };

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading…</div>;

  // Build catalog map for quick lookup
  const catalogMap = Object.fromEntries(catalog.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      {/* ── Module Catalog & Pricing ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Module Catalog &amp; Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ALL_MODULES.map((m) => {
            const cat = catalogMap[m.id];
            return (
              <div key={m.id} className="card border border-gray-700/50 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.id}</p>
                    </div>
                  </div>
                  {m.id === "msbiz" ? (
                    <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full shrink-0">🔒 Invite Only</span>
                  ) : cat && !cat.is_free && cat.price_monthly ? (
                    <span className="text-xs text-gray-500 shrink-0">${cat.price_monthly}/mo</span>
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed">{m.description}</p>

                {/* Pricing tiers — hidden for invite-only modules */}
                {m.id !== "msbiz" && cat && !cat.is_free && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {cat.allow_one_time && (
                      <div className="bg-gray-800 px-2.5 py-1.5 rounded-lg">
                        <p className="text-gray-500">One-time</p>
                        <p className="font-bold text-white">${cat.price_one_time}</p>
                      </div>
                    )}
                    {cat.allow_monthly && (
                      <div className="bg-gray-800 px-2.5 py-1.5 rounded-lg">
                        <p className="text-gray-500">Monthly</p>
                        <p className="font-bold text-white">${cat.price_monthly}<span className="text-gray-500 font-normal">/mo</span></p>
                      </div>
                    )}
                    {cat.allow_annual && (
                      <div className="bg-gray-800 px-2.5 py-1.5 rounded-lg relative">
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black px-1.5 rounded-full font-bold" style={{fontSize:"10px"}}>10%</span>
                        <p className="text-gray-500">Annual</p>
                        <p className="font-bold text-white">${cat.price_annual}<span className="text-gray-500 font-normal">/yr</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit pricing button — hidden for invite-only modules */}
                {m.id !== "msbiz" && cat && (
                  <button
                    onClick={() => setEditing({ ...cat })}
                    className="mt-auto text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-lg transition-colors self-start"
                  >
                    Edit Pricing
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Grading Settings ── */}
      {profConfig.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            🪄 AI Grading Settings
          </h2>
          <div className="card border border-gray-700/50 space-y-4">
            {profConfig.map((cfg) => {
              const editVal = configEdits[cfg.key] ?? cfg.value;
              const isDirty = configEdits[cfg.key] !== undefined && configEdits[cfg.key] !== cfg.value;
              return (
                <div key={cfg.key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">{cfg.label || cfg.key}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Key: <code className="text-gray-600">{cfg.key}</code></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editVal}
                      onChange={(e) => setConfigEdits((prev) => ({ ...prev, [cfg.key]: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      onClick={() => saveConfig(cfg.key)}
                      disabled={!isDirty || configSaving}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        isDirty
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                          : "text-gray-700 border border-gray-800 cursor-not-allowed"
                      }`}
                    >
                      {configSaving ? "…" : configSaved ? "✓" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-600 border-t border-gray-800 pt-3">
              Cost is charged per ungraded submission processed by the AI grading agent. Users see an estimated total before confirming.
            </p>
          </div>
        </div>
      )}

      {/* ── User Access Matrix ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          User Access
        </h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                {ALL_MODULES.map((m) => (
                  <th key={m.id} className="text-center px-4 py-3 text-gray-400 font-medium whitespace-nowrap">
                    {m.icon} {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img src={user.image} className="w-7 h-7 rounded-full" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-200">{user.name || "—"}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {ALL_MODULES.map((m) => {
                    const enabled = user.modules[m.id] ?? false;
                    const key = `${user.id}:${m.id}`;
                    return (
                      <td key={m.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggle(user.id, m.id, enabled)}
                          disabled={saving === key}
                          title={enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            enabled ? "bg-amber-500" : "bg-gray-700"
                          } ${saving === key ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pricing Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing.icon} {editing.label} — Pricing</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Free toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setEditing((e) => e ? { ...e, is_free: !e.is_free } : e)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${editing.is_free ? "bg-green-500" : "bg-gray-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_free ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-medium">{editing.is_free ? "Free module" : "Paid module"}</span>
            </label>

            {!editing.is_free && (
              <div className="space-y-4">
                {/* One-time */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={editing.allow_one_time}
                      onChange={(e) => setEditing((v) => v ? { ...v, allow_one_time: e.target.checked } : v)}
                      className="accent-amber-500" />
                    One-time purchase
                  </label>
                  {editing.allow_one_time && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={editing.price_one_time ?? ""}
                        onChange={(e) => setEditing((v) => v ? { ...v, price_one_time: e.target.value } : v)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-amber-500"
                        placeholder="0.00" />
                    </div>
                  )}
                </div>

                {/* Monthly */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={editing.allow_monthly}
                      onChange={(e) => setEditing((v) => v ? { ...v, allow_monthly: e.target.checked } : v)}
                      className="accent-amber-500" />
                    Monthly subscription
                  </label>
                  {editing.allow_monthly && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={editing.price_monthly ?? ""}
                        onChange={(e) => setEditing((v) => v ? { ...v, price_monthly: e.target.value } : v)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-amber-500"
                        placeholder="0.00" />
                      <span className="text-gray-500 text-xs">/month</span>
                    </div>
                  )}
                </div>

                {/* Annual */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={editing.allow_annual}
                      onChange={(e) => setEditing((v) => v ? { ...v, allow_annual: e.target.checked } : v)}
                      className="accent-amber-500" />
                    Annual subscription <span className="text-amber-400 text-xs font-medium">10% off auto</span>
                  </label>
                  {editing.allow_annual && editing.price_monthly && (
                    <p className="ml-5 text-xs text-gray-500">
                      Auto: ${(parseFloat(editing.price_monthly) * 12 * 0.9).toFixed(2)}/yr
                      {" "}= ${editing.price_monthly} × 12 × 0.9
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={savePricing} disabled={priceSaving}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                {priceSaving ? "Saving…" : priceSaved ? "✓ Saved" : "Save"}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
