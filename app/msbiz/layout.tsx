import { auth } from "@/auth";
import { redirect } from "next/navigation";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY  = process.env.CHENS_API_SECRET_KEY!;

async function checkMsbizAccess(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/msbiz/dashboard`, {
      headers: { "x-api-key": API_KEY, "x-user-id": userId },
      cache: "no-store",
    });
    return res.ok;
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
        <p className="text-5xl mb-6">🏢</p>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🏢 MS Business
        </h1>
        <p className="text-gray-500 text-sm mt-1">Order & operations management</p>
      </div>
      <div className="flex gap-6">
        <MsbizSidebarWrapper />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

// Sidebar is a client component — import inline
import MsbizSidebarWrapper from "@/components/msbiz/MsbizSidebarWrapper";
