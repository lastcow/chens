"use client";
import { useEffect, useState, Suspense } from "react";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number;
}

interface StudentGroup {
  name: string; canvas_uid: number; email: string;
  courses: {
    course_name: string; course_canvas_id: number;
    attendance: number; missing_count: number;
    avg_grade: number | null;
  }[];
  total_missing: number;
  min_attendance: number;
}

function StudentsContent() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "missing" | "attendance">("name");

  useEffect(() => {
    fetch("/api/professor/students")
      .then(r => r.json())
      .then(d => { setRows(d.students ?? []); setLoading(false); });
  }, []);

  // Group rows by student
  const grouped = Object.values(
    rows.reduce<Record<number, StudentGroup>>((acc, r) => {
      if (!acc[r.canvas_uid]) {
        acc[r.canvas_uid] = {
          name: r.name, canvas_uid: r.canvas_uid, email: r.email,
          courses: [], total_missing: 0, min_attendance: 100,
        };
      }
      acc[r.canvas_uid].courses.push({
        course_name: r.course_name,
        course_canvas_id: r.course_canvas_id,
        attendance: Number(r.attendance),
        missing_count: Number(r.missing_count),
        avg_grade: r.avg_grade,
      });
      acc[r.canvas_uid].total_missing += Number(r.missing_count);
      acc[r.canvas_uid].min_attendance = Math.min(
        acc[r.canvas_uid].min_attendance, Number(r.attendance)
      );
      return acc;
    }, {})
  );

  // Filter + sort
  const filtered = grouped
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) ||
                 s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "missing")    return b.total_missing - a.total_missing;
      if (sort === "attendance") return a.min_attendance - b.min_attendance;
      return a.name.localeCompare(b.name);
    });

  const riskLevel = (s: StudentGroup) => {
    if (s.total_missing >= 4 || s.min_attendance < 30) return "critical";
    if (s.total_missing >= 2 || s.min_attendance < 60) return "high";
    if (s.total_missing >= 1 || s.min_attendance < 75) return "watch";
    return "ok";
  };

  const riskBadge: Record<string, string> = {
    critical: "bg-red-900/30 text-red-400 border-red-700/30",
    high:     "bg-amber-900/30 text-amber-400 border-amber-700/30",
    watch:    "bg-yellow-900/20 text-yellow-500 border-yellow-700/20",
    ok:       "bg-green-900/20 text-green-600 border-green-800/20",
  };
  const riskLabel: Record<string, string> = {
    critical: "At Risk", high: "Watch", watch: "Monitor", ok: "Good",
  };

  const attColor = (v: number) =>
    v < 50 ? "text-red-400" : v < 75 ? "text-amber-400" : "text-green-400";
  const gradeColor = (v: number | null) =>
    v === null ? "text-gray-600" : v >= 90 ? "text-green-400" : v >= 70 ? "text-amber-400" : "text-red-400";

  // Short course code
  const shortCode = (name: string) => {
    const m = name.match(/(ITEC|SCIA)\s[\d]+/);
    return m ? m[0] : name.split(" ").slice(0, 2).join(" ");
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white flex-1 min-w-48 focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex gap-1 text-xs">
          {(["name", "missing", "attendance"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-2 rounded-lg border transition-colors capitalize ${
                sort === s
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
              }`}>
              Sort: {s}
            </button>
          ))}
        </div>
        {!loading && (
          <span className="text-xs text-gray-600">{filtered.length} students</span>
        )}
      </div>

      {/* Student cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(s => {
            const risk = riskLevel(s);
            return (
              <div key={s.canvas_uid}
                className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors hover:border-gray-700 ${
                  risk === "critical" ? "border-red-800/60" :
                  risk === "high"     ? "border-amber-800/50" :
                  "border-gray-800"
                }`}>
                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-start border-b border-gray-800/70">
                  <div>
                    <div className="text-white font-semibold text-sm leading-tight">{s.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{s.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${riskBadge[risk]}`}>
                      {riskLabel[risk]}
                    </span>
                    {s.total_missing > 0 && (
                      <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-2 py-0.5">
                        {s.total_missing} missing
                      </span>
                    )}
                  </div>
                </div>

                {/* Course rows */}
                <div className="divide-y divide-gray-800/50">
                  {s.courses.map(c => (
                    <div key={c.course_canvas_id}
                      className="px-4 py-2.5 flex items-center gap-3">
                      {/* Course badge */}
                      <span className="text-xs font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded px-1.5 py-0.5 shrink-0 w-24 text-center">
                        {shortCode(c.course_name)}
                      </span>

                      {/* Attendance */}
                      <div className="flex items-center gap-1 min-w-[60px]">
                        <span className="text-xs text-gray-600">Att</span>
                        <span className={`text-sm font-mono font-semibold ${attColor(c.attendance)}`}>
                          {Number(c.attendance).toFixed(0)}%
                        </span>
                      </div>

                      {/* Grade */}
                      <div className="flex items-center gap-1 min-w-[60px]">
                        <span className="text-xs text-gray-600">Avg</span>
                        <span className={`text-sm font-mono font-semibold ${gradeColor(c.avg_grade)}`}>
                          {c.avg_grade !== null ? `${c.avg_grade}%` : "—"}
                        </span>
                      </div>

                      {/* Missing */}
                      <div className="ml-auto flex items-center gap-1">
                        {c.missing_count > 0
                          ? <span className="text-xs text-red-400 font-semibold">{c.missing_count} missing</span>
                          : <span className="text-xs text-green-700">✓ complete</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <StudentsContent />
    </Suspense>
  );
}
