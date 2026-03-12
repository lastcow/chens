"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTerm } from "./TermProvider";
import { LayoutDashboard, Users, ClipboardList, BarChart3, AlertTriangle } from "lucide-react";

const NAV = [
  { href: "/canvas/overview",    label: "Overview",    icon: LayoutDashboard },
  { href: "/canvas/students",    label: "Students",    icon: Users, countKey: "students" },
  { href: "/canvas/assignments", label: "Assignments", icon: ClipboardList, countKey: "ungraded" },
  { href: "/canvas/grades",      label: "Grades",      icon: BarChart3, countKey: "pending" },
  { href: "/canvas/atrisk",      label: "At-Risk",     icon: AlertTriangle, countKey: "atrisk" },
  // { href: "/canvas/agent",        label: "AI Agent",    icon: Wand2 },  // temporarily disabled
];

export default function CanvasSidebar() {
  const path = usePathname();
  const { termParam, activeTerm } = useTerm();
  const [studentCount, setStudentCount]   = useState<number | null>(null);
  const [ungradedCount, setUngradedCount] = useState<number | null>(null);
  const [stagingCount, setStagingCount]   = useState<number | null>(null);
  const [pendingCount, setPendingCount]   = useState<number | null>(null);
  const [atRiskCount, setAtRiskCount]     = useState<number | null>(null);

  useEffect(() => {
    if (!activeTerm) return;
    const q = termParam ? `?${termParam}` : "";

    fetch(`/api/professor/students/count${q}`)
      .then(r => r.json())
      .then(d => setStudentCount(d.count ?? null))
      .catch(() => {});

    fetch(`/api/professor/assignments${q}`)
      .then(r => r.json())
      .then(d => {
        const assignments = d.assignments ?? [];
        const totalUngraded = assignments.reduce((s: number, a: { ungraded_count: number }) => s + Number(a.ungraded_count), 0);
        const totalStaging = assignments.reduce((s: number, a: { staging_count: number }) => s + Number(a.staging_count), 0);
        setUngradedCount(totalUngraded);
        setStagingCount(totalStaging);
        setPendingCount(totalUngraded);
      })
      .catch(() => {});

    fetch(`/api/professor/atrisk${q}`)
      .then(r => r.json())
      .then(d => setAtRiskCount((d.students ?? []).length))
      .catch(() => {});
  }, [termParam, activeTerm]);

  return (
    <aside className="w-48 shrink-0">
      <nav className="space-y-1 sticky top-24">
        {NAV.map((item) => {
          const active = path.startsWith(item.href);
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
              <span className="flex-1">{item.label}</span>
              {item.countKey === "students" && studentCount !== null && (
                <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                  active ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-500"
                }`}>
                  {studentCount}
                </span>
              )}
              {item.countKey === "ungraded" && (stagingCount !== null || ungradedCount !== null) && (stagingCount ?? 0) + (ungradedCount ?? 0) > 0 && (
                <div className="flex gap-1 items-center">
                  {stagingCount !== null && stagingCount > 0 && (
                    <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                      active ? "bg-purple-500/30 text-purple-300" : "bg-purple-900/30 text-purple-400"
                    }`}>{stagingCount}s</span>
                  )}
                  {ungradedCount !== null && ungradedCount > 0 && (
                    <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                      active ? "bg-red-500/20 text-red-400" : "bg-red-900/30 text-red-500"
                    }`}>{ungradedCount}</span>
                  )}
                </div>
              )}
              {item.countKey === "pending" && pendingCount !== null && pendingCount > 0 && (
                <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                  active ? "bg-amber-500/20 text-amber-400" : "bg-amber-900/30 text-amber-500"
                }`}>{pendingCount}</span>
              )}
              {item.countKey === "atrisk" && atRiskCount !== null && atRiskCount > 0 && (
                <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${
                  active ? "bg-red-500/20 text-red-400" : "bg-red-900/30 text-red-500"
                }`}>{atRiskCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
