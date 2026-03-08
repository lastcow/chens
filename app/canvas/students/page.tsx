"use client";
import { useEffect, useState, Suspense } from "react";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number; course_count: number;
}

function StudentsContent() {
  const [rows, setRows]       = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/professor/students")
      .then(r => r.json())
      .then(d => {
        const students: StudentRow[] = d.students ?? [];
        setRows(students);
        // Open all accordions by default
        const ids = Array.from(new Set(students.map(s => s.course_canvas_id)));
        setOpen(Object.fromEntries(ids.map(id => [id, true])));
        setLoading(false);
      });
  }, []);

  const courses = Array.from(
    new Map(rows.map(r => [r.course_canvas_id, r.course_name])).entries()
  );

  const toggle = (cid: number) => setOpen(p => ({ ...p, [cid]: !p[cid] }));

  const attColor  = (v: number) => v < 50 ? "text-red-400" : v < 75 ? "text-amber-400" : "text-green-400";
  const gradeColor = (v: number | null) =>
    v === null ? "text-gray-600" : v >= 90 ? "text-green-400" : v >= 70 ? "text-amber-400" : "text-red-400";

  const riskBadge = (r: StudentRow) => {
    const m = Number(r.missing_count), a = Number(r.attendance);
    if (m >= 4 || a < 30) return <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-2 py-0.5">At Risk</span>;
    if (m >= 2 || a < 60) return <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">Watch</span>;
    if (m >= 1 || a < 75) return <span className="text-xs bg-yellow-900/20 text-yellow-500 border border-yellow-700/20 rounded-full px-2 py-0.5">Monitor</span>;
    return <span className="text-xs text-green-700">✓</span>;
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search students…"
        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />

      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-16 animate-pulse" />
        ))
      ) : courses.map(([cid, courseName]) => {
        const courseRows = rows.filter(r =>
          r.course_canvas_id === cid &&
          (r.name.toLowerCase().includes(search.toLowerCase()) ||
           r.email.toLowerCase().includes(search.toLowerCase()))
        );
        if (search && courseRows.length === 0) return null;

        const allRows = rows.filter(r => r.course_canvas_id === cid);
        const atRisk  = allRows.filter(r => Number(r.missing_count) >= 4 || Number(r.attendance) < 30).length;
        const watch   = allRows.filter(r => (Number(r.missing_count) >= 2 || Number(r.attendance) < 60) && !(Number(r.missing_count) >= 4 || Number(r.attendance) < 30)).length;
        const avgAtt  = allRows.length ? (allRows.reduce((s, r) => s + Number(r.attendance), 0) / allRows.length).toFixed(0) : "—";
        const avgGrade = (() => {
          const valid = allRows.filter(r => r.avg_grade !== null);
          return valid.length ? (valid.reduce((s, r) => s + Number(r.avg_grade), 0) / valid.length).toFixed(1) : null;
        })();
        const totalMissing = allRows.reduce((s, r) => s + Number(r.missing_count), 0);
        const isOpen = open[cid] ?? true;

        return (
          <div key={cid} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Accordion header */}
            <button onClick={() => toggle(cid)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-800/30 transition-colors text-left">

              {/* Chevron */}
              <span className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                ▶
              </span>

              {/* Course name */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{courseName}</div>
                <div className="text-xs text-gray-600 mt-0.5">{allRows.length} students</div>
              </div>

              {/* Summary pills */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Avg attendance */}
                <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">Att</span>
                  <span className={`text-sm font-mono font-semibold ${attColor(Number(avgAtt))}`}>{avgAtt}%</span>
                </div>
                {/* Avg grade */}
                <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">Avg</span>
                  <span className={`text-sm font-mono font-semibold ${gradeColor(avgGrade !== null ? Number(avgGrade) : null)}`}>
                    {avgGrade !== null ? `${avgGrade}%` : "—"}
                  </span>
                </div>
                {/* Missing */}
                {totalMissing > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-gray-500">Missing</span>
                    <span className="text-sm font-mono font-semibold text-red-400">{totalMissing}</span>
                  </div>
                )}
                {/* At-risk count */}
                {atRisk > 0 && (
                  <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-2.5 py-1">
                    {atRisk} at risk
                  </span>
                )}
                {watch > 0 && (
                  <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2.5 py-1">
                    {watch} watch
                  </span>
                )}
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-950/40">
                      <th className="text-left px-5 py-2.5">Student</th>
                      <th className="text-center px-3 py-2.5">Attendance</th>
                      <th className="text-center px-3 py-2.5">Avg Grade</th>
                      <th className="text-center px-3 py-2.5">Missing</th>
                      <th className="text-center px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {courseRows.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-6 text-gray-600">No students match.</td></tr>
                    ) : courseRows.map(r => (
                      <tr key={r.canvas_uid}
                        className={`hover:bg-gray-800/30 transition-colors border-l-2 ${
                          Number(r.missing_count) >= 4 || Number(r.attendance) < 30 ? "border-l-red-600" :
                          Number(r.missing_count) >= 2 || Number(r.attendance) < 60 ? "border-l-amber-500" :
                          "border-l-transparent"
                        }`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{r.name}</span>
                            {Number(r.course_count) > 1 && (
                              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30 rounded-full px-1.5 py-0.5 shrink-0">
                                {r.course_count} courses
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{r.email}</div>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`font-mono font-semibold ${attColor(Number(r.attendance))}`}>
                            {Number(r.attendance).toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`font-mono font-semibold ${gradeColor(r.avg_grade)}`}>
                            {r.avg_grade !== null ? `${r.avg_grade}%` : "—"}
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          {Number(r.missing_count) > 0
                            ? <span className="text-red-400 font-semibold">{r.missing_count}</span>
                            : <span className="text-gray-700">0</span>}
                        </td>
                        <td className="text-center px-3 py-3">{riskBadge(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
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
