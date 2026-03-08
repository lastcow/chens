"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/canvas/overview",    label: "Overview",    icon: "⊞" },
  { href: "/canvas/students",    label: "Students",    icon: "👥", countKey: "students" },
  { href: "/canvas/assignments", label: "Assignments", icon: "📋" },
  { href: "/canvas/grades",      label: "Grades",      icon: "📊" },
  { href: "/canvas/atrisk",      label: "At-Risk",     icon: "⚠️" },
  { href: "/canvas",             label: "AI Agent",    icon: "🤖" },
];

export default function CanvasSidebar() {
  const path = usePathname();
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/professor/students/count")
      .then(r => r.json())
      .then(d => setStudentCount(d.count ?? null))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-48 shrink-0">
      <nav className="space-y-1 sticky top-24">
        {NAV.map((item) => {
          const active = item.href === "/canvas"
            ? path === "/canvas"
            : path.startsWith(item.href);
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
              <span className="flex-1">{item.label}</span>
              {item.countKey === "students" && studentCount !== null && (
                <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                  active ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-500"
                }`}>
                  {studentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
