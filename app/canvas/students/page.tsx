"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Student {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number;
}

function StudentsTable() {
  const params = useSearchParams();
  const courseFilter = params.get("course_id");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupByCourse, setGroupByCourse] = useState(true);

  useEffect(() => {
    const url = courseFilter ? `/api/professor/students?course_id=${courseFilter}` : "/api/professor/students";
    fetch(url).then(r => r.json()).then(d => { setStudents(d.students ?? []); setLoading(false); });
  }, [courseFilter]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by course
  const grouped = filtered.reduce<Record<string, Student[]>>((acc, s) => {
    const key = s.course_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const riskColor = (s: Student) => {
    if (Number(s.missing_count) >= 3 || Number(s.attendance) < 50) return "border-l-red-500";
    if (Number(s.missing_count) >= 1 || Number(s.attendance) < 75) return "border-l-amber-500";
    return "border-l-transparent";
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white flex-1 focus:outline-none focus:border-amber-500/50" />
        <button onClick={() => setGroupByCourse(g => !g)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
          {groupByCourse ? "Flat list" : "Group by course"}
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse">Loading students…</div>
      ) : groupByCourse ? (
        Object.entries(grouped).map(([course, studs]) => (
          <div key={course}>
            <div className="text-xs text-amber-400 font-mono uppercase tracking-widest mb-2">{course}</div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-center px-3 py-3">Attendance</th>
                    <th className="text-center px-3 py-3">Missing</th>
                    <th className="text-center px-3 py-3">Avg Grade</th>
                    <th className="text-center px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {studs.map(s => (
                    <tr key={`${s.canvas_uid}-${s.course_canvas_id}`}
                      className={`border-l-2 ${riskColor(s)} hover:bg-gray-800/30 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{s.name}</div>
                        <div className="text-xs text-gray-600">{s.email}</div>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`text-sm font-mono ${Number(s.attendance) < 50 ? "text-red-400" : Number(s.attendance) < 75 ? "text-amber-400" : "text-green-400"}`}>
                          {Number(s.attendance).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={Number(s.missing_count) > 0 ? "text-red-400 font-semibold" : "text-gray-600"}>
                          {s.missing_count}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 font-mono text-gray-300">
                        {s.avg_grade !== null ? `${s.avg_grade}%` : "—"}
                      </td>
                      <td className="text-center px-3 py-3">
                        {Number(s.missing_count) >= 3 || Number(s.attendance) < 50
                          ? <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-2 py-0.5">At Risk</span>
                          : Number(s.missing_count) >= 1
                          ? <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">Watch</span>
                          : <span className="text-xs text-green-600">✓ OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-3 py-3">Course</th>
                <th className="text-center px-3 py-3">Attendance</th>
                <th className="text-center px-3 py-3">Missing</th>
                <th className="text-center px-3 py-3">Avg Grade</th>
                <th className="text-center px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(s => (
                <tr key={`${s.canvas_uid}-${s.course_canvas_id}`}
                  className={`border-l-2 ${riskColor(s)} hover:bg-gray-800/30 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{s.name}</div>
                    <div className="text-xs text-gray-600">{s.email}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-400">{s.course_name}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`font-mono text-sm ${Number(s.attendance) < 50 ? "text-red-400" : Number(s.attendance) < 75 ? "text-amber-400" : "text-green-400"}`}>
                      {Number(s.attendance).toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className={Number(s.missing_count) > 0 ? "text-red-400 font-semibold" : "text-gray-600"}>
                      {s.missing_count}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3 font-mono text-gray-300">
                    {s.avg_grade !== null ? `${s.avg_grade}%` : "—"}
                  </td>
                  <td className="text-center px-3 py-3">
                    {Number(s.missing_count) >= 3 || Number(s.attendance) < 50
                      ? <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-2 py-0.5">At Risk</span>
                      : Number(s.missing_count) >= 1
                      ? <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">Watch</span>
                      : <span className="text-xs text-green-600">✓ OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}><StudentsTable /></Suspense>;
}
