import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/signin");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Platform</p>
          <p className="text-2xl font-bold text-amber-400">Chen&apos;s</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Logged in as</p>
          <p className="text-lg font-bold truncate">{session.user?.email}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Role</p>
          <p className="text-2xl font-bold text-green-400">ADMIN</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { href: "/admin/users", label: "👥 Manage Users" },
            { href: "/canvas/overview", label: "🎓 Canvas LMS" },
            { href: "/canvas/agent", label: "🤖 AI Agent" },
            { href: "/profile", label: "👤 My Profile" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="card text-center py-3 hover:border-amber-500/40 transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
