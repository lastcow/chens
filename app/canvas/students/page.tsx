"use client";
import { useEffect, useState, Suspense } from "react";
import { useTerm } from "@/components/canvas/TermProvider";
import { X } from "lucide-react";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  enrollment_state: string;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number; course_count: number;
}

interface StudentDetailData {
  student: {
    name: string;
    email: string;
    canvas_uid: number;
  };
  courses: Array<{
    course_name: string;
    course_canvas_id: number;
    enrollment_state: string;
    attendance_score: number;
    assignments: Array<{
      name: string;
      points_possible: number;
      due_at: string | null;
      is_quiz: boolean;
      score: number | null;
      final_score: number | null;
      grader_comment: string;
      workflow_state: string;
      late: boolean;
      submitted_at: string | null;
    }>;
  }>;
}

function StudentDetailDialog({
  student,
  data,
  loading,
  onClose,
}: {
  student: StudentRow | null;
  data: StudentDetailData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"assignments" | "attendance">("assignments");

  if (!student) return null;

  // Group assignments by course and sort by due_at
  const courseAssignments = data
    ? data.courses.map(course => ({
        ...course,
        assignments: course.assignments
          .filter(a => a.name) // Only assignments with names
          .sort((a, b) => {
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          }),
      }))
    : [];

  const getAssignmentStatus = (a: StudentDetailData['courses'][0]['assignments'][0]) => {
    if (a.workflow_state === 'graded') {
      return { icon: '✅', label: 'Graded', color: 'text-green-400' };
    }
    if (a.workflow_state === 'unsubmitted' || !a.submitted_at) {
      const now = new Date();
      const due = a.due_at ? new Date(a.due_at) : null;
      if (due && now > due) {
        return { icon: '⚠️', label: 'Missing', color: 'text-red-400' };
      }
      return { icon: '⏳', label: 'Not Submitted', color: 'text-gray-500' };
    }
    if (a.late) {
      return { icon: '⏰', label: 'Late', color: 'text-amber-400' };
    }
    return { icon: '📤', label: 'Submitted', color: 'text-blue-400' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-[700px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{student.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{student.email}</p>
            <p className="text-xs text-gray-700 mt-2">
              {data?.courses.length ?? 0} course{(data?.courses.length ?? 0) !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-400 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 pt-4 border-b border-gray-800">
          <button
            onClick={() => setTab('assignments')}
            className={`pb-4 font-medium transition-colors ${
              tab === 'assignments'
                ? 'text-white border-b-2 border-amber-500'
                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-400'
            }`}
          >
            📝 Assignments
          </button>
          <button
            onClick={() => setTab('attendance')}
            className={`pb-4 font-medium transition-colors ${
              tab === 'attendance'
                ? 'text-white border-b-2 border-amber-500'
                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-400'
            }`}
          >
            📋 Attendance
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 h-12 rounded animate-pulse" />
              ))}
            </div>
          ) : tab === 'assignments' ? (
            <div className="space-y-6">
              {courseAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No course data available</p>
              ) : (
                courseAssignments.map(course => (
                  <div key={course.course_canvas_id} className="space-y-3">
                    <h3 className="font-semibold text-white text-sm">{course.course_name}</h3>
                    {course.assignments.length === 0 ? (
                      <p className="text-xs text-gray-600 ml-2">No assignments</p>
                    ) : (
                      <div className="space-y-2 ml-2">
                        {course.assignments.map((a, i) => {
                          const status = getAssignmentStatus(a);
                          return (
                            <div
                              key={i}
                              className="bg-gray-800/40 border border-gray-700/40 rounded-lg p-3 text-sm space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{a.name}</p>
                                  {a.due_at && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Due: {new Date(a.due_at).toLocaleDateString()} {new Date(a.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-xs font-medium whitespace-nowrap ${status.color}`}>
                                  {status.icon} {status.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs text-gray-400">
                                  {a.final_score !== null ? (
                                    <span>
                                      <span className="font-semibold text-white">{a.final_score}</span>/{a.points_possible}
                                    </span>
                                  ) : (
                                    <span>—/{a.points_possible}</span>
                                  )}
                                </div>
                                {a.late && (
                                  <div className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded">
                                    Late
                                  </div>
                                )}
                              </div>
                              {a.grader_comment && (
                                <p className="text-xs text-gray-400 italic border-t border-gray-700/40 pt-2 mt-2">
                                  "{a.grader_comment}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {courseAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No course data available</p>
              ) : (
                courseAssignments.map(course => (
                  <div key={course.course_canvas_id} className="space-y-2">
                    <h3 className="font-semibold text-white text-sm">{course.course_name}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            course.attendance_score >= 90
                              ? 'bg-green-500'
                              : course.attendance_score >= 75
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(course.attendance_score, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-12 text-right">
                        {course.attendance_score}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentsContent() {
  const { termParam, activeTerm } = useTerm();
  const [rows, setRows]       = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState<Record<number, boolean>>({});
  const [detailStudent, setDetailStudent] = useState<StudentRow | null>(null);
  const [detailData, setDetailData] = useState<StudentDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!activeTerm) return;
    setLoading(true);
    fetch(`/api/professor/students?${termParam}`)
      .then(r => r.json())
      .then(d => {
        const students: StudentRow[] = d.students ?? [];
        setRows(students);
        const ids = Array.from(new Set(students.map(s => s.course_canvas_id)));
        setOpen(Object.fromEntries(ids.map(id => [id, true])));
        setLoading(false);
      });
  }, [termParam, activeTerm]);

  const courses = Array.from(
    new Map(rows.map(r => [r.course_canvas_id, r.course_name])).entries()
  );

  const toggle = (cid: number) => setOpen(p => ({ ...p, [cid]: !p[cid] }));

  const openStudentDetail = async (student: StudentRow) => {
    setDetailStudent(student);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/professor/students/${student.canvas_uid}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (err) {
      console.error("Failed to fetch student details:", err);
    }
    setDetailLoading(false);
  };

  const closeStudentDetail = () => {
    setDetailStudent(null);
    setDetailData(null);
  };

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
    <>
    <StudentDetailDialog
      student={detailStudent}
      data={detailData}
      loading={detailLoading}
      onClose={closeStudentDetail}
    />
    <div className="space-y-3">
      {/* Sticky search */}
      <div className="sticky top-16 z-10 -mx-1 px-1 py-2 bg-gray-950/90 backdrop-blur-md">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
      </div>

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

        const allRows    = rows.filter(r => r.course_canvas_id === cid);
        const activeRows = allRows.filter(r => r.enrollment_state === 'active');
        const inactiveCount = allRows.length - activeRows.length;
        const atRisk  = activeRows.filter(r => Number(r.missing_count) >= 4 || Number(r.attendance) < 30).length;
        const watch   = activeRows.filter(r => (Number(r.missing_count) >= 2 || Number(r.attendance) < 60) && !(Number(r.missing_count) >= 4 || Number(r.attendance) < 30)).length;
        const avgAtt  = activeRows.length ? (activeRows.reduce((s, r) => s + Number(r.attendance), 0) / activeRows.length).toFixed(0) : "—";
        const avgGrade = (() => {
          const valid = activeRows.filter(r => r.avg_grade !== null);
          return valid.length ? (valid.reduce((s, r) => s + Number(r.avg_grade), 0) / valid.length).toFixed(1) : null;
        })();
        const totalMissing = activeRows.reduce((s, r) => s + Number(r.missing_count), 0);
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
                <div className="text-xs text-gray-600 mt-0.5">
                  {activeRows.length} active
                  {inactiveCount > 0 && <span className="ml-2 text-gray-700">· {inactiveCount} inactive</span>}
                </div>
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
                        className={`transition-colors border-l-2 ${
                          r.enrollment_state === 'inactive'
                            ? "opacity-40 bg-gray-900/20 border-l-gray-700"
                            : Number(r.missing_count) >= 4 || Number(r.attendance) < 30 ? "hover:bg-gray-800/30 border-l-red-600"
                            : Number(r.missing_count) >= 2 || Number(r.attendance) < 60 ? "hover:bg-gray-800/30 border-l-amber-500"
                            : "hover:bg-gray-800/30 border-l-transparent"
                        }`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => openStudentDetail(r)}
                              className="text-white font-medium cursor-pointer hover:text-amber-400 transition-colors"
                            >
                              {r.name}
                            </button>
                            {r.enrollment_state === 'inactive' && (
                              <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 rounded-full px-1.5 py-0.5 shrink-0">
                                Inactive
                              </span>
                            )}
                            {Number(r.course_count) > 1 && r.enrollment_state !== 'inactive' && (
                              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30 rounded-full px-1.5 py-0.5 shrink-0">
                                {r.course_count} courses
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{r.email}</div>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`font-mono font-semibold ${r.enrollment_state === 'inactive' ? 'text-gray-600' : attColor(Number(r.attendance))}`}>
                            {Number(r.attendance).toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`font-mono font-semibold ${r.enrollment_state === 'inactive' ? 'text-gray-600' : gradeColor(r.avg_grade)}`}>
                            {r.avg_grade !== null ? `${r.avg_grade}%` : "—"}
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          {Number(r.missing_count) > 0
                            ? <span className="text-red-400 font-semibold">{r.missing_count}</span>
                            : <span className="text-gray-700">0</span>}
                        </td>
                        <td className="text-center px-3 py-3">
                          {r.enrollment_state === 'inactive' ? <span className="text-xs text-gray-600">—</span> : riskBadge(r)}
                        </td>
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
    </>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <StudentsContent />
    </Suspense>
  );
}
