import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY  = process.env.CHENS_API_SECRET_KEY!;

async function checkMsbizAccess(userId: string): Promise<boolean> {
  try {
    // Primary check: user_module_permissions (has msbiz perms granted)
    const permRes = await fetch(`${API_BASE}/api/msbiz/dashboard`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId },
      cache: "no-store",
    });
    if (permRes.ok) return true;

    // Fallback: user_modules enabled (admin toggled on but perms not yet seeded)
    const modRes = await fetch(`${API_BASE}/api/user/modules`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId },
      cache: "no-store",
    });
    if (modRes.ok) {
      const data = await modRes.json();
      const msbizMod = (data.modules ?? []).find(
        (m: { module: string; enabled: boolean }) => m.module === "msbiz" && m.enabled
      );
      return !!msbizMod;
    }

    return false;
  } catch { return false; }
}

export default async function MsbizLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  const userId = (session.user as { id?: string })?.id ?? "";
  const hasAccess = await checkMsbizAccess(userId);

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">MS Business Module</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          This module is invite-only. Contact your administrator to request access.
        </p>
        <a href="/dashboard" className="btn-primary px-6 py-2 text-sm">Back to Dashboard</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">MS Business</h1>
          <p className="text-gray-500 text-xs mt-0.5">Order & operations management</p>
        </div>
      </div>
      <div className="flex gap-6">
        <MsbizSidebarWrapper />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

import MsbizSidebarWrapper from "@/components/msbiz/MsbizSidebarWrapper";
