"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Assignment {
  id: number; canvas_id: number; name: string; points_possible: number;
  due_at: string | null; assignment_type: string;
  course_name: string; course_canvas_id: number;
  graded_count: number; ungraded_count: number; missing_count: number;
  avg_score: number | null; total_students: number;
}

function AssignmentsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/professor/assignments")
      .then(r => r.json())
      .then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
  }, []);

  // Build course tabs from data
  const courses = Array.from(
    new Map(assignments.map(a => [a.course_canvas_id, a.course_name])).entries()
  ); // [[canvas_id, name], ...]

  const activeCourse = params.get("course_id")
    ? Number(params.get("course_id"))
    : courses[0]?.[0] ?? null;

  const filtered = assignments.filter(a => a.course_canvas_id === activeCourse);

  const isPast = (due: string | null) => due && new Date(due) < new Date();

  const statusBar = (a: Assignment) => {
    const total = Number(a.total_students);
    if (!total) return null;
    const graded  = Math.min(Number(a.graded_count), total);
    const pending = Math.min(Number(a.ungraded_count), total - graded);
    const missing = Math.max(0, total - graded - pending);
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 w-28">
        <div className="bg-green-500 transition-all" style={{ width: `${(graded/total)*100}%` }} />
        <div className="bg-amber-500 transition-all" style={{ width: `${(pending/total)*100}%` }} />
        <div className="bg-gray-700 transition-all" style={{ width: `${(missing/total)*100}%` }} />
      </div>
    );
  };

  // Short course label for tab
  const tabLabel = (name: string) => {
    const m = name.match(/^(ITEC|SCIA)\s[\d\-]+/);
    return m ? m[0] : name.split(" ").slice(0,2).join(" ");
  };

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 gap-0">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-28 bg-gray-800/40 animate-pulse rounded-t-lg mr-1" />
            ))
          : courses.map(([cid, name]) => {
              const isActive = cid === activeCourse;
              const courseAssignments = assignments.filter(a => a.course_canvas_id === cid);
              const ungraded = courseAssignments.reduce((s, a) => s + Number(a.ungraded_count), 0);
              return (
                <button
                  key={cid}
                  onClick={() => router.replace(`/canvas/assignments?course_id=${cid}`)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
                    ${isActive
                      ? "text-amber-400 border-b-2 border-amber-400 -mb-px bg-gray-900/50"
                      : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                    }`}
                >
                  {tabLabel(name)}
                  {ungraded > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono
                      ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-500"}`}>
                      {ungraded}
                    </span>
                  )}
                </button>
              );
            })}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-t-0 border-gray-800 rounded-b-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">No assignments found.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Assignment</th>
                  <th className="text-center px-3 py-3">Due</th>
                  <th className="text-center px-3 py-3">Pts</th>
                  <th className="text-center px-4 py-3">Progress</th>
                  <th className="text-center px-3 py-3">Avg</th>
                  <th className="text-center px-3 py-3">Ungraded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-white">{a.name}</td>
                    <td className="text-center px-3 py-3 text-xs font-mono">
                      {a.due_at
                        ? <span className={isPast(a.due_at) ? "text-gray-500" : "text-blue-400"}>
                            {new Date(a.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="text-center px-3 py-3 text-gray-400">{a.points_possible}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        {statusBar(a)}
                        <span className="text-xs text-gray-600">
                          {a.graded_count}/{a.total_students}
                        </span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-sm">
                      {a.avg_score !== null
                        ? <span className={Number(a.avg_score) >= 70 ? "text-green-400" : "text-red-400"}>
                            {a.avg_score}%
                          </span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="text-center px-3 py-3">
                      {Number(a.ungraded_count) > 0
                        ? <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">
                            {a.ungraded_count}
                          </span>
                        : <span className="text-xs text-green-600">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="px-5 py-2.5 border-t border-gray-800 flex gap-5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Graded</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Needs grading</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block"/>Not submitted</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}
