import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ALL_MODULES } from "@/lib/modules";
import ModulesCatalog from "@/components/dashboard/ModulesCatalog";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

async function getModuleCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/modules`, {
      headers: { "x-api-key": API_KEY }, cache: "no-store",
    });
    return (await res.json()).modules ?? [];
  } catch { return []; }
}

async function getUserModules(userId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/user/modules`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId }, cache: "no-store",
    });
    const data = await res.json();
    return (data.modules ?? []).reduce(
      (acc: Record<string, { enabled: boolean; payment_type: string | null }>, m: { module: string; enabled: boolean; payment_type: string | null }) => {
        acc[m.module] = { enabled: m.enabled, payment_type: m.payment_type };
        return acc;
      }, {}
    );
  } catch { return {}; }
}

export default async function DashboardModulesPage({ searchParams }: { searchParams: Promise<{ success?: string; cancelled?: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const params = await searchParams;

  const userId = (session.user as { id?: string })?.id ?? "";

  // Merge DB catalog with local feature definitions
  const [dbModules, userModules] = await Promise.all([getModuleCatalog(), getUserModules(userId)]);
  const merged = dbModules.map((dbMod: { id: string }) => ({
    ...ALL_MODULES.find(m => m.id === dbMod.id),
    ...dbMod,
  }));

  return (
    <div className="space-y-4">
      {params.success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">
          ✓ Payment successful! Your module has been activated.
        </div>
      )}
      {params.cancelled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg text-sm">
          Payment cancelled. You can try again anytime.
        </div>
      )}
      <ModulesCatalog modules={merged} userModules={userModules} />
    </div>
  );
}
