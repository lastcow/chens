"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",          label: "Overview", icon: "🏠", exact: true },
  { href: "/admin/users",    label: "Users",    icon: "👥" },
  { href: "/admin/modules",  label: "Modules",  icon: "🧩" },
  { href: "/admin/pricing",  label: "Pricing",  icon: "💲" },
];

export default function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="w-48 shrink-0">
      <nav className="space-y-1 sticky top-24">
        {NAV.map((item) => {
          const active = item.exact ? path === item.href : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
