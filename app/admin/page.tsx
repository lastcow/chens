import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminUsers from "@/components/AdminUsers";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-gray-400">Manage users and system settings</p>
      </div>
      <AdminUsers />
    </div>
  );
}
