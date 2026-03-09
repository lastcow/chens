import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/signin");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-gray-400 text-sm">Manage users and system settings</p>
      </div>
      <AdminSidebar />
      {children}
    </div>
  );
}
