"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CanvasTokenCard from "@/components/canvas/CanvasTokenCard";
import TermSwitcher from "@/components/canvas/TermSwitcher";
import { useTerm } from "@/components/canvas/TermProvider";

interface Course {
  id: number; canvas_id: number; name: string; course_code: string; term_name: string;
  student_count: number; assignment_count: number; avg_grade: number | null; ungraded_count: number;
}

export default function OverviewPage() {
  const { termParam, activeTerm } = useTerm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTerm) return;
    setLoading(true);
    fetch(`/api/professor/courses?${termParam}`)
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setLoading(false); });
  }, [termParam, activeTerm]);

  const totalStudents = courses.reduce((a, c) => a + Number(c.student_count), 0);
  const totalUngraded = courses.reduce((a, c) => a + Number(c.ungraded_count), 0);

  return (
    <div className="space-y-6">
      {/* Canvas token */}
      <CanvasTokenCard />

      {/* Term switcher */}
      <div className="flex items-center justify-between">
        <TermSwitcher />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Courses",        value: courses.length,  color: "text-amber-400" },
          { label: "Total Students", value: totalStudents,   color: "text-blue-400" },
          { label: "Ungraded",       value: totalUngraded,   color: totalUngraded > 0 ? "text-red-400" : "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{loading ? "…" : s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-36" />
          ))
        ) : courses.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-amber-400 font-mono mb-1">{c.course_code}</div>
                <div className="font-semibold text-white text-sm leading-tight">{c.name}</div>
              </div>
              {Number(c.ungraded_count) > 0 && (
                <span className="text-xs bg-red-900/30 border border-red-700/30 text-red-400 rounded-full px-2 py-0.5">
                  {c.ungraded_count} ungraded
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div>
                <div className="text-lg font-bold text-white">{c.student_count}</div>
                <div className="text-xs text-gray-500">Students</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{c.assignment_count}</div>
                <div className="text-xs text-gray-500">Assignments</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${c.avg_grade !== null ? (Number(c.avg_grade) >= 70 ? "text-green-400" : "text-red-400") : "text-gray-600"}`}>
                  {c.avg_grade !== null ? `${c.avg_grade}%` : "—"}
                </div>
                <div className="text-xs text-gray-500">Avg Grade</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link href={`/canvas/students?course_id=${c.canvas_id}&${termParam}`}
                className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                Students
              </Link>
              <Link href={`/canvas/assignments?course_id=${c.canvas_id}&${termParam}`}
                className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                Assignments
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
