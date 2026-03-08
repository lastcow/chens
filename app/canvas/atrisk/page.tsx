"use client";
import { useEffect, useState } from "react";
import { useTerm } from "@/components/canvas/TermProvider";

interface AtRiskStudent {
  name: string; canvas_uid: number;
  course_name: string; course_canvas_id: number;
  attendance: number; missing_count: number; avg_grade: number | null;
}

export default function AtRiskPage() {
  const { termParam, activeTerm } = useTerm();
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTerm) return;
    setLoading(true);
    fetch(`/api/professor/atrisk?${termParam}`).then(r => r.json()).then(d => { setStudents(d.students ?? []); setLoading(false); });
  }, [termParam, activeTerm]);

  const level = (s: AtRiskStudent) => {
    if (Number(s.missing_count) >= 4 || Number(s.attendance) < 30) return "critical";
    if (Number(s.missing_count) >= 2 || Number(s.attendance) < 60) return "high";
    return "watch";
  };

  const levelStyle: Record<string, string> = {
    critical: "border-red-600/50 bg-red-900/10",
    high: "border-amber-600/40 bg-amber-900/10",
    watch: "border-gray-700 bg-gray-900",
  };
  const levelBadge: Record<string, string> = {
    critical: "bg-red-900/40 text-red-400 border-red-700/40",
    high: "bg-amber-900/40 text-amber-400 border-amber-700/40",
    watch: "bg-gray-800 text-gray-400 border-gray-700",
  };
  const levelLabel: Record<string, string> = { critical: "Critical", high: "At Risk", watch: "Watch" };

  const grouped = students.reduce<Record<string, AtRiskStudent[]>>((acc, s) => {
    const l = level(s);
    if (!acc[l]) acc[l] = [];
    acc[l].push(s);
    return acc;
  }, {});

  const ORDER = ["critical", "high", "watch"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {ORDER.map(l => (
          <div key={l} className={`border rounded-xl p-4 text-center ${levelStyle[l]}`}>
            <div className={`text-2xl font-bold ${l === "critical" ? "text-red-400" : l === "high" ? "text-amber-400" : "text-gray-400"}`}>
              {loading ? "…" : grouped[l]?.length ?? 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">{levelLabel[l]}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse">Loading…</div>
      ) : students.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          ✅ No at-risk students found.
        </div>
      ) : (
        ORDER.map(l => {
          if (!grouped[l]?.length) return null;
          return (
            <div key={l}>
              <div className={`text-xs font-mono uppercase tracking-widest mb-2 ${l === "critical" ? "text-red-400" : l === "high" ? "text-amber-400" : "text-gray-500"}`}>
                {levelLabel[l]} ({grouped[l].length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grouped[l].map(s => (
                  <div key={`${s.canvas_uid}-${s.course_canvas_id}`}
                    className={`border rounded-xl p-4 ${levelStyle[l]}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-white font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.course_name}</div>
                      </div>
                      <span className={`text-xs border rounded-full px-2 py-0.5 ${levelBadge[l]}`}>
                        {levelLabel[l]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className={`text-lg font-bold font-mono ${Number(s.attendance) < 50 ? "text-red-400" : Number(s.attendance) < 75 ? "text-amber-400" : "text-gray-300"}`}>
                          {Number(s.attendance).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Attendance</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${Number(s.missing_count) > 0 ? "text-red-400" : "text-gray-600"}`}>
                          {s.missing_count}
                        </div>
                        <div className="text-xs text-gray-600">Missing</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold font-mono ${s.avg_grade !== null ? (Number(s.avg_grade) >= 70 ? "text-green-400" : "text-red-400") : "text-gray-600"}`}>
                          {s.avg_grade !== null ? `${s.avg_grade}%` : "—"}
                        </div>
                        <div className="text-xs text-gray-600">Avg Grade</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
