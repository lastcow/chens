import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ALL_MODULES } from "@/lib/modules";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

async function getUserModules(userId: string): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`${API_BASE}/api/user/modules`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId },
      cache: "no-store",
    });
    const data = await res.json();
    return (data.modules ?? []).reduce(
      (acc: Record<string, boolean>, m: { module: string; enabled: boolean }) => {
        acc[m.module] = m.enabled;
        return acc;
      },
      {}
    );
  } catch {
    return {};
  }
}

export default async function DashboardModulesPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  const userId = (session.user as { id?: string })?.id ?? "";
  const userModules = await getUserModules(userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Available Modules</h2>
        <p className="text-gray-400 text-sm">
          Modules extend your platform with additional features. Contact your administrator to enable or disable modules for your account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ALL_MODULES.map((mod) => {
          const enabled = userModules[mod.id] ?? false;
          return (
            <div
              key={mod.id}
              className={`card border transition-colors ${
                enabled ? "border-amber-500/30" : "border-gray-700/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`text-3xl p-3 rounded-xl ${enabled ? "bg-amber-500/10" : "bg-gray-800"}`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{mod.label}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          enabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{mod.description}</p>
                    <ul className="space-y-1">
                      {mod.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={enabled ? "text-amber-400" : "text-gray-600"}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
