import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session.user?.name || session.user?.email}
        </p>
      </div>
      <div className="flex gap-6">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
