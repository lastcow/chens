"use client";
import { useEffect, useState, Suspense } from "react";
import { useTerm } from "@/components/canvas/TermProvider";
import { X, CheckCircle, AlertTriangle, Clock, Upload, ChevronRight, BookOpen, GraduationCap, Pencil, Save, Loader2, FileText, ClipboardList } from "lucide-react";

interface StudentRow {
  name: string; canvas_uid: number; email: string;
  course_name: string; course_canvas_id: number;
  enrollment_state: string;
  attendance: number; missing_count: number; ungraded_count: number;
  avg_grade: number | null; total_due: number; course_count: number;
}

interface QuestionGrade {
  question_id: number; question_name: string; question_text: string;
  points_possible: number; score: number; comment: string;
}

interface DetailAssignment {
  assignment_id: number; submission_id: number | null;
  name: string; points_possible: number; due_at: string | null;
  is_quiz: boolean; quiz_id: number | null; assignment_type: string;
  score: number | null; final_score: number | null;
  late_penalty: number | null; grader_comment: string | null;
  workflow_state: string | null; late: boolean; submitted_at: string | null;
  course_canvas_id: number;
  question_grades: QuestionGrade[] | null;
  quiz_submission_id: number | null;
}

interface StudentDetailData {
  student: { name: string; email: string; canvas_uid: number };
  courses: Array<{
    course_name: string; course_canvas_id: number;
    enrollment_state: string; attendance_score: number;
    assignments: DetailAssignment[];
  }>;
}

function AssignmentEditDialog({
  assignment,
  canvasUid,
  onClose,
  onSaved,
}: {
  assignment: DetailAssignment;
  canvasUid: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isQuiz = assignment.is_quiz && assignment.question_grades && assignment.question_grades.length > 0;
  const [score, setScore] = useState(assignment.score ?? 0);
  const [comment, setComment] = useState(assignment.grader_comment ?? "");
  const [isLate, setIsLate] = useState(assignment.late ?? false);
  const [daysLate, setDaysLate] = useState(0);
  const [latePenalty, setLatePenalty] = useState(assignment.late_penalty ?? 0);
  const [questions, setQuestions] = useState<QuestionGrade[]>(
    assignment.question_grades ? assignment.question_grades.map(q => ({ ...q })) : []
  );
  const [saving, setSaving] = useState(false);
  const [postToCanvas, setPostToCanvas] = useState(false);

  // For quiz: auto-calc total from questions
  const quizTotal = questions.reduce((s, q) => s + (q.score ?? 0), 0);
  const displayScore = isQuiz ? quizTotal : score;
  const finalScore = Math.max(0, displayScore - latePenalty);

  const updateQuestion = (idx: number, field: keyof QuestionGrade, value: string | number) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        submission_id: assignment.submission_id,
        assignment_id: assignment.assignment_id,
        score: displayScore,
        comment: isQuiz ? "" : comment,
        is_late: isLate,
        days_late: isLate ? daysLate : 0,
        late_penalty: latePenalty,
        course_canvas_id: assignment.course_canvas_id,
        post_to_canvas: postToCanvas,
      };
      if (isQuiz) {
        body.question_grades = questions;
        body.quiz_submission_id = assignment.quiz_submission_id;
        body.quiz_id = assignment.quiz_id;
      }
      const res = await fetch(`/api/professor/students/${canvasUid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSaved();
      }
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div
        className={`bg-gray-900 border border-gray-800 rounded-2xl w-full max-h-[85vh] flex flex-col shadow-2xl ${
          isQuiz ? 'max-w-[900px]' : 'max-w-[600px]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isQuiz
                ? <ClipboardList className="w-4 h-4 text-purple-400 shrink-0" />
                : <FileText className="w-4 h-4 text-gray-500 shrink-0" />
              }
              <h3 className="text-base font-semibold text-white truncate">{assignment.name}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {assignment.due_at && (
                <span className="text-xs text-gray-500">
                  Due {new Date(assignment.due_at).toLocaleDateString()} {new Date(assignment.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isQuiz && (
                <span className="text-xs font-mono text-gray-400">
                  Total: <span className="text-white font-semibold">{quizTotal}</span>/{assignment.points_possible}
                  {latePenalty > 0 && <span className="text-amber-400 ml-1">→ {finalScore}</span>}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isQuiz ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Late card spanning full width */}
              <div className="col-span-2 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer font-medium">
                    <input type="checkbox" checked={isLate} onChange={e => setIsLate(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-900 text-amber-500 focus:ring-amber-500" />
                    Late Submission
                  </label>
                </div>
                {isLate && (
                  <>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Days</span>
                      <input type="number" value={daysLate} min={0}
                        onChange={e => setDaysLate(parseInt(e.target.value) || 0)}
                        className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Penalty</span>
                      <input type="number" value={latePenalty} min={0} step={1}
                        onChange={e => setLatePenalty(parseFloat(e.target.value) || 0)}
                        className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50" />
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                    {latePenalty > 0 && (
                      <>
                        <div className="h-5 w-px bg-gray-700" />
                        <span className="text-xs font-mono text-amber-400">{quizTotal} − {latePenalty} = {finalScore}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              {questions.map((q, qi) => {
                const pct = q.points_possible > 0 ? Math.round((q.score / q.points_possible) * 100) : 0;
                const pctColor = pct >= 90 ? 'text-green-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';
                const barColor = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={qi} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3">
                    {/* Card header: badge + name | pct - score/total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">
                          {q.question_name.replace(/^Q/i, '')}
                        </span>
                        <span className="text-sm font-medium text-white">{q.question_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-mono font-semibold ${pctColor}`}>{pct}%</span>
                        <span className="text-gray-600 text-xs">–</span>
                        <input type="number" value={q.score} min={0} max={q.points_possible}
                          onChange={e => updateQuestion(qi, 'score', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-purple-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <span className="text-[10px] text-gray-500">/{q.points_possible}</span>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>

                    {/* Comment */}
                    <textarea value={q.comment} placeholder="Comment…" rows={2}
                      onChange={e => updateQuestion(qi, 'comment', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Late card */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer font-medium">
                    <input type="checkbox" checked={isLate} onChange={e => setIsLate(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-900 text-amber-500 focus:ring-amber-500" />
                    Late Submission
                  </label>
                </div>
                {isLate && (
                  <>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Days</span>
                      <input type="number" value={daysLate} min={0}
                        onChange={e => setDaysLate(parseInt(e.target.value) || 0)}
                        className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Penalty</span>
                      <input type="number" value={latePenalty} min={0} step={1}
                        onChange={e => setLatePenalty(parseFloat(e.target.value) || 0)}
                        className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50" />
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                    {latePenalty > 0 && (
                      <>
                        <div className="h-5 w-px bg-gray-700" />
                        <span className="text-xs font-mono text-amber-400">{score} − {latePenalty} = {finalScore}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              {/* Score + Comment */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400 w-16">Score</label>
                  <input type="number" value={score} min={0} max={assignment.points_possible}
                    onChange={e => setScore(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  <span className="text-sm text-gray-500">/ {assignment.points_possible}</span>
                </div>
                <div className="flex items-start gap-3">
                  <label className="text-sm text-gray-400 w-16 pt-2">Comment</label>
                  <textarea value={comment} placeholder="Grader comment…"
                    onChange={e => setComment(e.target.value)} rows={3}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={postToCanvas} onChange={e => setPostToCanvas(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500" />
            Post to Canvas
          </label>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !assignment.submission_id}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
                      return (
                        <div key={ai} className="group px-4 py-2.5 hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white truncate flex-1 flex items-center gap-1.5">
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
                                {a.final_score !== null ? (
                                  <span className="font-mono">{a.final_score}/{a.points_possible}</span>
                                ) : (
                                  <span>—/{a.points_possible}</span>
                                )}
                              </span>
                              {a.submission_id && (
                                <button
                                  onClick={e => { e.stopPropagation(); setEditAssignment(a); }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-amber-400 transition-all p-0.5"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
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
