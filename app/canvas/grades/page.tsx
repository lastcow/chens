"use client";
import { useEffect, useState } from "react";

interface Assignment { id: number; name: string; points_possible: number; avg_score: number | null; graded_count: number; ungraded_count: number; missing_count: number; total_students: number; course_name: string; }

type SortKey = "name" | "due" | "avg" | "ungraded" | "missing";

export default function GradesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch("/api/professor/assignments").then(r => r.json()).then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
  }, []);

  const courses = ["all", ...Array.from(new Set(assignments.map(a => a.course_name)))];
  const handleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(key); setSortDir("asc"); }
  };

  const base = course === "all" ? assignments : assignments.filter(a => a.course_name === course);
  const filtered = [...base].sort((a, b) => {
    let v = 0;
    if (sort === "name")     v = a.name.localeCompare(b.name);
    if (sort === "due")      v = (a.due_at ?? "zzz").localeCompare(b.due_at ?? "zzz");
    if (sort === "avg")      v = (Number(a.avg_score) || 0) - (Number(b.avg_score) || 0);
    if (sort === "ungraded") v = Number(a.ungraded_count) - Number(b.ungraded_count);
    if (sort === "missing")  v = Number(a.missing_count) - Number(b.missing_count);
    return sortDir === "asc" ? v : -v;
  });

  const gradeColor = (score: number | null) => {
    if (score === null) return "bg-gray-800 text-gray-600";
    if (score >= 90) return "bg-green-900/40 text-green-400";
    if (score >= 80) return "bg-blue-900/40 text-blue-400";
    if (score >= 70) return "bg-amber-900/40 text-amber-400";
    return "bg-red-900/40 text-red-400";
  };

  return (
    <div className="space-y-5">
      {/* Sticky course filter pills */}
      <div className="sticky top-16 z-10 -mx-1 px-1 py-2 bg-gray-950/90 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {courses.map(c => (
            <button key={c} onClick={() => setCourse(c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                course === c ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
              }`}>
              {c === "all" ? "All Courses" : c.match(/(ITEC|SCIA)\s[\d]+-[\w]+/)?.[0] ?? c.match(/(ITEC|SCIA)\s[\d]+/)?.[0] ?? c}
            </button>
          ))}
        </div>
        {/* Sort bar */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {([["name","Name"],["due","Due Date"],["avg","Avg Score"],["ungraded","Ungraded"],["missing","Missing"]] as [SortKey,string][]).map(([key, label]) => (
            <button key={key} onClick={() => handleSort(key)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                sort === key ? "bg-gray-800 border-gray-600 text-white" : "border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700"
              }`}>
              {label}
              {sort === key && <span className="text-amber-400">{sortDir === "asc" ? "↑" : "↓"}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse">Loading…</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Assignment</th>
                <th className="text-left px-3 py-3">Course</th>
                <th className="text-center px-3 py-3">Avg Score</th>
                <th className="text-center px-3 py-3">Graded</th>
                <th className="text-center px-3 py-3">Pending</th>
                <th className="text-center px-3 py-3">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white max-w-xs">
                    <div className="truncate">{a.name}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{a.course_name}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${gradeColor(a.avg_score)}`}>
                      {a.avg_score !== null ? `${a.avg_score}%` : "—"}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3 text-green-600 font-mono text-xs">
                    {a.graded_count}/{a.total_students}
                  </td>
                  <td className="text-center px-3 py-3">
                    {Number(a.ungraded_count) > 0
                      ? <span className="text-amber-400 font-semibold">{a.ungraded_count}</span>
                      : <span className="text-gray-700">0</span>}
                  </td>
                  <td className="text-center px-3 py-3">
                    {Number(a.missing_count) > 0
                      ? <span className="text-red-400 font-semibold">{a.missing_count}</span>
                      : <span className="text-gray-700">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Grade scale legend */}
          <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-600 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-900/60 inline-block"/>A (90+)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-900/60 inline-block"/>B (80-89)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-900/60 inline-block"/>C (70-79)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-900/60 inline-block"/>Below C</span>
          </div>
        </div>
      )}
    </div>
  );
}
