"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: "🏠" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-800 mb-8 pb-0">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
