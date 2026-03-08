import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-400">Welcome back, {session.user?.name || session.user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Account Status</p>
          <p className="text-2xl font-bold text-green-400">Active</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Role</p>
          <p className="text-2xl font-bold text-amber-400 capitalize">
            {session.user?.role?.toLowerCase() || "user"}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Member Since</p>
          <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <div className="space-y-3">
          <div className="flex gap-4 py-3 border-b border-gray-800">
            <span className="text-gray-400 w-32">Name</span>
            <span>{session.user?.name || "—"}</span>
          </div>
          <div className="flex gap-4 py-3 border-b border-gray-800">
            <span className="text-gray-400 w-32">Email</span>
            <span>{session.user?.email}</span>
          </div>
          <div className="flex gap-4 py-3">
            <span className="text-gray-400 w-32">Role</span>
            <span className="capitalize">{session.user?.role?.toLowerCase() || "user"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
