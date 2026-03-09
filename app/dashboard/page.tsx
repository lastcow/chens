import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Account Status</p>
          <p className="text-2xl font-bold text-green-400">Active</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Role</p>
          <p className="text-2xl font-bold text-amber-400 capitalize">
            {(session.user as { role?: string })?.role?.toLowerCase() || "user"}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Member Since</p>
          <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-4 py-2 border-b border-gray-800">
            <span className="text-gray-400 w-28">Name</span>
            <span>{session.user?.name || "—"}</span>
          </div>
          <div className="flex gap-4 py-2 border-b border-gray-800">
            <span className="text-gray-400 w-28">Email</span>
            <span>{session.user?.email}</span>
          </div>
          <div className="flex gap-4 py-2">
            <span className="text-gray-400 w-28">Role</span>
            <span className="capitalize">
              {(session.user as { role?: string })?.role?.toLowerCase() || "user"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
