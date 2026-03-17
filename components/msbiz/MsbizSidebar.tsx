"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, CreditCard, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  Truck, AlertTriangle, DollarSign, FileText
} from "lucide-react";

interface DashboardCounts {
  orders_total?: number;
  price_matches?: { urgent?: number; total_pending?: number };
  exceptions?: { severity: string; count: number }[];
  reminders_due?: number;
}

const NAV_MAIN = [
  { href: "/msbiz",              label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/msbiz/orders",       label: "Orders",        icon: Package,         countKey: "orders" },
  { href: "/msbiz/price-matches",label: "Price Match",   icon: CreditCard,      countKey: "pm" },
  { href: "/msbiz/inbound",      label: "Inbound",       icon: ArrowDownToLine },
  { href: "/msbiz/outbound",     label: "Outbound",      icon: ArrowUpFromLine },
  { href: "/msbiz/invoices",     label: "Invoices",      icon: FileText },
  { href: "/msbiz/tracking",     label: "Tracking",      icon: Truck },
  { href: "/msbiz/exceptions",   label: "Exceptions",    icon: AlertTriangle,   countKey: "exceptions" },
  { href: "/msbiz/costs",        label: "Costs",         icon: DollarSign },
];

const NAV_SETTINGS = [
  { href: "/msbiz/warehouse",    label: "Warehouse",     icon: Warehouse },
];

export default function MsbizSidebar() {
  const path = usePathname();
  const [counts, setCounts] = useState<DashboardCounts>({});

  useEffect(() => {
    fetch("/api/msbiz/dashboard")
      .then(r => r.json())
      .then(d => { setCounts(d); })
      .catch(() => {});
  }, []);

  const isActive = (href: string, exact = false) =>
    exact ? path === href : path.startsWith(href);

  const urgentPm = counts.price_matches?.urgent ?? 0;
  const totalPm = counts.price_matches?.total_pending ?? 0;
  const openExceptions = counts.exceptions?.reduce((s, e) => s + Number(e.count), 0) ?? 0;

  const badge = (text: string | number, variant: "amber" | "red" | "purple" = "amber", active = false) => (
    <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
      active
        ? variant === "red"    ? "bg-red-500/20 text-red-400"
        : variant === "purple" ? "bg-purple-500/30 text-purple-300"
                               : "bg-amber-500/20 text-amber-400"
        : variant === "red"    ? "bg-red-900/30 text-red-500"
        : variant === "purple" ? "bg-purple-900/30 text-purple-400"
                               : "bg-gray-800 text-gray-500"
    }`}>{text}</span>
  );

  const navItem = (item: typeof NAV_MAIN[0]) => {
    const active = isActive(item.href, (item as { exact?: boolean }).exact);
    return (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          active
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}>
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.countKey === "orders"     && counts.orders_total ? badge(counts.orders_total, "amber", active) : null}
        {item.countKey === "pm"         && urgentPm > 0        ? badge(`${urgentPm} urgent`, "red", active) : item.countKey === "pm" && totalPm > 0 ? badge(totalPm, "amber", active) : null}
        {item.countKey === "exceptions" && openExceptions > 0  ? badge(openExceptions, "red", active) : null}
      </Link>
    );
  };

  return (
    <aside className="w-52 shrink-0">
      <nav className="space-y-1 sticky top-[110px]">
        {NAV_MAIN.map(navItem)}

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Settings</p>
        </div>
        {NAV_SETTINGS.map(navItem)}
      </nav>
    </aside>
  );
}
