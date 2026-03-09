import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ALL_MODULES } from "@/lib/modules";
import ModulesCatalog from "@/components/dashboard/ModulesCatalog";
import StripeVerify from "@/components/dashboard/StripeVerify";

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
      (acc: Record<string, { enabled: boolean; payment_type: string | null; expires_at: string | null; activated_at: string | null }>,
       m: { module: string; enabled: boolean; payment_type: string | null; expires_at: string | null; activated_at: string | null }) => {
        acc[m.module] = { enabled: m.enabled, payment_type: m.payment_type, expires_at: m.expires_at, activated_at: m.activated_at };
        return acc;
      }, {}
    );
  } catch { return {}; }
}

export default async function DashboardModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; sid?: string; activated?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/signin");
  const params = await searchParams;
  const userId = (session.user as { id?: string })?.id ?? "";
  if (params.cancelled) redirect("/dashboard/modules?cancelled=1");

  const [dbModules, userModules] = await Promise.all([getModuleCatalog(), getUserModules(userId)]);
  const merged = dbModules.map((dbMod: { id: string }) => ({
    ...ALL_MODULES.find(m => m.id === dbMod.id),
    ...dbMod,
  }));

  return (
    <div className="space-y-4">
      {/* ?success=1&sid=xxx — verify client-side then hard-navigate to ?activated=1 */}
      {params.success && params.sid ? (
        <StripeVerify sid={params.sid} />
      ) : params.activated ? (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>✓</span><span>Module activated! Your access is now enabled.</span>
        </div>
      ) : params.cancelled ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg text-sm">
          Payment cancelled. You can try again anytime.
        </div>
      ) : null}
      <ModulesCatalog modules={merged} userModules={userModules} />
    </div>
  );
}
