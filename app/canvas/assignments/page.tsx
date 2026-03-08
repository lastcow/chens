"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Assignment {
  id: number; canvas_id: number; name: string; points_possible: number;
  due_at: string | null; assignment_type: string;
  course_name: string; course_canvas_id: number;
  graded_count: number; ungraded_count: number; missing_count: number;
  avg_score: number | null; total_students: number;
}

function AssignmentsTable() {
  const params = useSearchParams();
  const courseFilter = params.get("course_id");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = courseFilter ? `/api/professor/assignments?course_id=${courseFilter}` : "/api/professor/assignments";
    fetch(url).then(r => r.json()).then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
  }, [courseFilter]);

  const grouped = assignments.reduce<Record<string, Assignment[]>>((acc, a) => {
    if (!acc[a.course_name]) acc[a.course_name] = [];
    acc[a.course_name].push(a);
    return acc;
  }, {});

  const statusBar = (a: Assignment) => {
    const total = Number(a.total_students);
    if (!total) return null;
    const graded = Math.min(Number(a.graded_count), total);
    const ungraded = Math.min(Number(a.ungraded_count), total - graded);
    const missing = total - graded - ungraded;
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 w-24">
        <div className="bg-green-500" style={{ width: `${(graded/total)*100}%` }} />
        <div className="bg-amber-500" style={{ width: `${(ungraded/total)*100}%` }} />
        <div className="bg-gray-700" style={{ width: `${(Math.max(0,missing)/total)*100}%` }} />
      </div>
    );
  };

  const isPast = (due: string | null) => due && new Date(due) < new Date();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse">Loading assignments…</div>
      ) : Object.entries(grouped).map(([course, asgns]) => (
        <div key={course}>
          <div className="text-xs text-amber-400 font-mono uppercase tracking-widest mb-2">{course}</div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Assignment</th>
                  <th className="text-center px-3 py-3">Due</th>
                  <th className="text-center px-3 py-3">Pts</th>
                  <th className="text-center px-3 py-3">Progress</th>
                  <th className="text-center px-3 py-3">Avg</th>
                  <th className="text-center px-3 py-3">Ungraded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {asgns.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-white">{a.name}</td>
                    <td className="text-center px-3 py-3 text-xs font-mono">
                      {a.due_at
                        ? <span className={isPast(a.due_at) ? "text-gray-500" : "text-blue-400"}>
                            {new Date(a.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="text-center px-3 py-3 text-gray-400">{a.points_possible}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-center gap-1">
                        {statusBar(a)}
                        <span className="text-xs text-gray-600">
                          {a.graded_count}/{a.total_students}
                        </span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-sm">
                      {a.avg_score !== null
                        ? <span className={Number(a.avg_score) >= 70 ? "text-green-400" : "text-red-400"}>{a.avg_score}%</span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="text-center px-3 py-3">
                      {Number(a.ungraded_count) > 0
                        ? <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">{a.ungraded_count}</span>
                        : <span className="text-xs text-green-600">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Graded</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Needs grading</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block"/>Not submitted</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssignmentsPage() {
  return <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}><AssignmentsTable /></Suspense>;
}
