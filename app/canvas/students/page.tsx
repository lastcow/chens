"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number;
}

function StudentsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/professor/students")
      .then(r => r.json())
      .then(d => { setRows(d.students ?? []); setLoading(false); });
  }, []);

  // Course tabs
  const courses = Array.from(
    new Map(rows.map(r => [r.course_canvas_id, r.course_name])).entries()
  );

  const activeCourse = params.get("course_id")
    ? Number(params.get("course_id"))
    : courses[0]?.[0] ?? null;

  const filtered = rows.filter(r =>
    r.course_canvas_id === activeCourse &&
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
     r.email.toLowerCase().includes(search.toLowerCase()))
  );

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

  const shortCode = (name: string) => {
    const m = name.match(/(ITEC|SCIA)\s[\d]+/);
    return m ? m[0] : name.split(" ").slice(0,2).join(" ");
  };

  return (
    <div className="space-y-0">
      {/* Course tabs */}
      <div className="flex border-b border-gray-800 gap-0">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-800/40 animate-pulse rounded-t-lg mr-1" />
            ))
          : courses.map(([cid, name]) => {
              const isActive = cid === activeCourse;
              const courseRows = rows.filter(r => r.course_canvas_id === cid);
              const atRisk = courseRows.filter(r => Number(r.missing_count) >= 2 || Number(r.attendance) < 60).length;
              return (
                <button key={cid}
                  onClick={() => router.replace(`/canvas/students?course_id=${cid}`)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
                    ${isActive
                      ? "text-amber-400 border-b-2 border-amber-400 -mb-px bg-gray-900/50"
                      : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"}`}>
                  {shortCode(name)}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono
                    ${isActive ? "bg-gray-800 text-gray-400" : "bg-gray-800/50 text-gray-600"}`}>
                    {courseRows.length}
                  </span>
                  {atRisk > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5
                      ${isActive ? "bg-red-900/40 text-red-400" : "bg-gray-800 text-gray-600"}`}>
                      ⚠ {atRisk}
                    </span>
                  )}
                </button>
              );
            })}
      </div>

      {/* Search bar */}
      <div className="bg-gray-900 border-x border-gray-800 px-4 py-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-t-0 border-gray-800 rounded-b-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-center px-3 py-3">Attendance</th>
                <th className="text-center px-3 py-3">Avg Grade</th>
                <th className="text-center px-3 py-3">Missing</th>
                <th className="text-center px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-600">No students found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.canvas_uid}
                  className={`hover:bg-gray-800/30 transition-colors border-l-2 ${
                    Number(r.missing_count) >= 4 || Number(r.attendance) < 30 ? "border-l-red-600" :
                    Number(r.missing_count) >= 2 || Number(r.attendance) < 60 ? "border-l-amber-500" :
                    "border-l-transparent"
                  }`}>
                  <td className="px-5 py-3">
                    <div className="text-white font-medium">{r.name}</div>
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
        )}
      </div>
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
