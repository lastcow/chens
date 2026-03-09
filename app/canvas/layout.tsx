import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";
import { TermProvider } from "@/components/canvas/TermProvider";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

async function isModuleEnabled(userId: string, module: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/user/modules`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId },
      cache: "no-store",
    });
    const data = await res.json();
    const found = (data.modules ?? []).find((m: { module: string; enabled: boolean }) => m.module === module);
    return found ? found.enabled : false;
  } catch {
    return false;
  }
}

export default async function CanvasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  const userId = (session.user as { id?: string })?.id ?? "";
  const enabled = await isModuleEnabled(userId, "canvas_lms");

  if (!enabled) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-6">🧩</p>
        <h1 className="text-2xl font-bold text-white mb-3">Canvas LMS Module Disabled</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          This module is not enabled for your account. Contact your administrator to enable Canvas LMS access.
        </p>
        <a href="/dashboard" className="btn-primary px-6 py-2 text-sm">Back to Dashboard</a>
      </div>
    );
  }

  return (
    <TermProvider>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Canvas LMS Snapshot</h1>
          <p className="text-gray-500 text-sm mt-1">Course management</p>
        </div>
        <div className="flex gap-6">
          <CanvasSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </TermProvider>
  );
}
