"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Puzzle, ShoppingBag, Building2, MapPin } from "lucide-react";

const NAV = [
  {
    section: null,
    items: [
      { href: "/admin",         label: "Overview", icon: Home,   exact: true },
      { href: "/admin/users",   label: "Users",    icon: Users },
      { href: "/admin/modules", label: "Modules",  icon: Puzzle },
    ],
  },
  {
    section: "MS Business",
    icon: Building2,
    items: [
      { href: "/admin/merchandise", label: "Merchandise", icon: ShoppingBag },
      { href: "/admin/addresses",   label: "Addresses",   icon: MapPin },
    ],
  },
];

export default function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="w-48 shrink-0">
      <nav className="sticky top-24 space-y-4">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div className="flex items-center gap-1.5 px-3 mb-1">
                {group.icon && <group.icon className="w-3 h-3 text-gray-600" />}
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                  {group.section}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = "exact" in item && item.exact ? path === item.href : path.startsWith(item.href);
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
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
