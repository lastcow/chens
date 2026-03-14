"use client";
import { useEffect, useState, Suspense } from "react";
import { useTerm } from "@/components/canvas/TermProvider";
import { X, CheckCircle, AlertTriangle, Clock, Upload, ChevronRight, BookOpen, GraduationCap, FileText, ClipboardList } from "lucide-react";
import AssignmentEditDialog, { type DetailAssignment, type QuestionGrade } from "@/components/canvas/AssignmentEditDialog";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  enrollment_state: string;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number; course_count: number;
  unpushed_count: number;
}

interface StudentDetailData {
  student: { name: string; email: string; canvas_uid: number };
  courses: Array<{
    course_name: string; course_canvas_id: number;
    enrollment_state: string; attendance_score: number;
    assignments: DetailAssignment[];
  }>;
}

function StudentDetailDialog({
  student,
  data,
  loading,
  onClose,
  onRefresh,
}: {
  student: StudentRow | null;
  data: StudentDetailData | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [courseOpen, setCourseOpen] = useState<Record<number, boolean>>({});
  const [editAssignment, setEditAssignment] = useState<DetailAssignment | null>(null);

  // Auto-open all courses when data loads
  useEffect(() => {
    if (data) {
      setCourseOpen(Object.fromEntries(data.courses.map((c, i) => [i, true])));
    }
  }, [data]);

  if (!student) return null;

  const courses = data
    ? data.courses.map(course => ({
        ...course,
        assignments: course.assignments
          .filter(a => a.name)
          .sort((a, b) => {
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          }),
      }))
    : [];

  const attColor = (v: number) =>
    v >= 90 ? 'text-green-400' : v >= 75 ? 'text-amber-400' : 'text-red-400';

  const getStatus = (a: StudentDetailData['courses'][0]['assignments'][0]) => {
    if (a.final_score !== null) {
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Graded', color: 'text-green-400' };
    }
    if (a.workflow_state === 'unsubmitted' || !a.submitted_at) {
      const due = a.due_at ? new Date(a.due_at) : null;
      if (due && new Date() > due) {
        return { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Missing', color: 'text-red-400' };
      }
      return { icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending', color: 'text-gray-500' };
    }
    if (a.late) {
      return { icon: <Clock className="w-3.5 h-3.5" />, label: 'Late', color: 'text-amber-400' };
    }
    return { icon: <Upload className="w-3.5 h-3.5" />, label: 'Submitted', color: 'text-blue-400' };
  };

  // Attendance summary for header
  const attSummary = courses.length > 0
    ? courses.map(c => ({ name: c.course_name.replace(/^[A-Z]+ \d+-\d+\s*/, ''), score: c.attendance_score }))
    : [];

  return (
    <>
    {editAssignment && student && (
      <AssignmentEditDialog
        assignment={editAssignment}
        canvasUid={student.canvas_uid}
        onClose={() => setEditAssignment(null)}
        onSaved={() => { setEditAssignment(null); onRefresh(); }}
      />
    )}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-[700px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with attendance */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">{student.name}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">{student.email}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-gray-600">
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
              {attSummary.map((att, i) => (
                <span key={i} className="text-xs text-gray-500">
                  Att: <span className={`font-mono font-semibold ${attColor(att.score)}`}>{att.score}%</span>
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 h-12 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No course data available</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course, ci) => {
                const graded = course.assignments.filter(a => a.final_score !== null);
                const missing = course.assignments.filter(a =>
                  (a.workflow_state === 'unsubmitted' || !a.submitted_at) && a.due_at && new Date() > new Date(a.due_at)
                );
                const avg = graded.length
                  ? (graded.reduce((s, a) => s + (a.final_score! / a.points_possible) * 100, 0) / graded.length).toFixed(0)
                  : null;
                const isOpen = courseOpen[ci] ?? true;
                const isSingle = courses.length === 1;

                const assignmentList = (
                  <div className={`divide-y divide-gray-800/50 ${!isSingle ? 'border-t border-gray-800' : ''}`}>
                    {course.assignments.length === 0 ? (
                      <p className="text-xs text-gray-600 px-4 py-3">No assignments</p>
                    ) : course.assignments.map((a, ai) => {
                      const status = getStatus(a);
                      const hasSubmission = a.submitted_at !== null && a.workflow_state !== 'unsubmitted';
                      return (
                        <div
                          key={ai}
                          onClick={() => hasSubmission ? setEditAssignment(a) : undefined}
                          className={`px-4 py-2.5 transition-colors ${hasSubmission ? 'cursor-pointer hover:bg-gray-800/40' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate flex-1 flex items-center gap-1.5 ${hasSubmission ? 'text-white hover:text-amber-400' : 'text-gray-400'}`}>
                              {a.is_quiz
                                ? <ClipboardList className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                : <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              }
                              {a.name}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {a.late && (
                                <span className="text-[10px] bg-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded">Late</span>
                              )}
                              <span className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                                {status.icon}
                                {a.score !== null ? (
                                  <span className="font-mono">{a.score}/{a.points_possible}</span>
                                ) : (
                                  <span>—/{a.points_possible}</span>
                                )}
                              </span>
                              {a.canvas_posted === false && a.score !== null && (
                                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" title="Not pushed to Canvas" />
                              )}
                            </div>
                          </div>
                          {a.due_at && (
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              Due {new Date(a.due_at).toLocaleDateString()} {new Date(a.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );

                if (isSingle) {
                  // Single course: no accordion, just list assignments directly
                  return (
                    <div key={ci} className="bg-gray-800/30 border border-gray-800 rounded-xl overflow-hidden">
                      {assignmentList}
                    </div>
                  );
                }

                // Multiple courses: accordion with attendance in title
                return (
                  <div key={ci} className="bg-gray-800/30 border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setCourseOpen(p => ({ ...p, [ci]: !p[ci] }))}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors text-left"
                    >
                      <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                      <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{course.course_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500">
                          Att <span className={`font-mono font-semibold ${attColor(course.attendance_score)}`}>{course.attendance_score}%</span>
                        </span>
                        {avg && (
                          <span className="text-xs text-gray-500">
                            Avg <span className="font-mono font-semibold text-white">{avg}%</span>
                          </span>
                        )}
                        <span className="text-xs text-gray-600">{course.assignments.length} asgn</span>
                        {missing.length > 0 && (
                          <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 rounded-full px-1.5 py-0.5">
                            {missing.length} missing
                          </span>
                        )}
                      </div>
                    </button>
                    {isOpen && assignmentList}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
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
      onRefresh={() => { if (detailStudent) openStudentDetail(detailStudent); }}
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
          <div key={cid} className="bg-gray-900 border border-gray-800 rounded-xl">
            {/* Accordion header */}
            <button onClick={() => toggle(cid)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-800/30 transition-colors text-left sticky top-[116px] z-[8] bg-gray-900 rounded-t-xl border-b border-transparent">

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
                            {Number(r.unpushed_count) > 0 && (
                              <span className="text-xs bg-orange-900/30 text-orange-400 border border-orange-700/30 rounded-full px-1.5 py-0.5 shrink-0">
                                {r.unpushed_count} unpushed
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
