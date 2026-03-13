"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTerm } from "@/components/canvas/TermProvider";
import SubmissionsDialog from "@/components/canvas/SubmissionsDialog";
import { Wand2, X, AlertCircle, Check, Clock, AlertTriangle, Calendar, ClipboardList, FileText, HelpCircle, MessageSquare } from "lucide-react";

interface Assignment {
  id: number; canvas_id: number; name: string; points_possible: number;
  due_at: string | null; assignment_type: string; is_quiz: boolean;
  course_name: string; course_canvas_id: number;
  graded_count: number; ungraded_count: number; missing_count: number;
  avg_score: number | null; total_students: number;
  staging_count: number; pending_request_id: string | null; staging_request_id: string | null;
}

interface QuestionGrade {
  question_id: number;
  question_name: string;
  question_text: string;
  points_possible: number;
  score: number;
  comment: string;
}

interface StagingGrade {
  id: number;
  submission_id: number | null;
  student_name: string;
  student_canvas_uid: number | null;
  assignment_name: string;
  course_name: string;
  raw_score: string | null;
  final_score: string | null;
  late_penalty: string | null;
  grader_comment: string;
  ai_model: string;
  status: string;
  is_late: boolean;
  days_late: number;
  question_grades: QuestionGrade[] | null;
  quiz_submission_id: number | null;
}

function AssignmentsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { termParam, activeTerm } = useTerm();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Grade request state
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<Assignment | null>(null);
  const [requesting, setRequesting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [gradingCost, setGradingCost] = useState<number>(0.10);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Staging review state
  const [stagingAssignment, setStagingAssignment] = useState<Assignment | null>(null);
  const [stagingGrades, setStagingGrades] = useState<StagingGrade[]>([]);
  const [stagingLoading, setStagingLoading] = useState(false);
  const [stagingEdits, setStagingEdits] = useState<Record<number, Partial<StagingGrade>>>({});
  const [stagingAction, setStagingAction] = useState<"approve" | "reject" | null>(null);
  const [quizCommentSg, setQuizCommentSg] = useState<StagingGrade | null>(null);
  const [stagingExcluded, setStagingExcluded] = useState<Set<number>>(new Set());

  // Submissions dialog state
  const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (!activeTerm) return;
    setLoading(true);
    fetch(`/api/professor/assignments?${termParam}`)
      .then(r => r.json())
      .then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
  }, [termParam, activeTerm]);

  useEffect(() => {
    fetch("/api/professor/grade-request")
      .then(r => r.json())
      .then(d => {
        const pending = new Set<number>(
          (d.requests ?? [])
            .filter((r: { status: string }) => r.status === "pending" || r.status === "in_progress")
            .map((r: { assignment_id: number }) => r.assignment_id)
        );
        setRequested(pending);
      });
    fetch("/api/professor/grade-config")
      .then(r => r.json())
      .then(d => { if (d.grading_cost_per_submission) setGradingCost(d.grading_cost_per_submission); });
    fetch("/api/user/credits")
      .then(r => r.json())
      .then(d => { if (d.balance !== undefined) setCreditBalance(d.balance); });
  }, []);

  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Assignment | null>(null);

  const submitRequest = async (a: Assignment) => {
    setRequesting(a.id);
    setConfirm(null);
    try {
      const res = await fetch("/api/professor/grade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: a.id,
          course_canvas_id: a.course_canvas_id,
          assignment_name: a.name,
          course_name: a.course_name,
          ungraded_count: a.ungraded_count,
        }),
      });
      const d = await res.json();
      if (res.status === 201) {
        setRequested(prev => new Set([...prev, a.id]));
        if (d.balance_after !== undefined) setCreditBalance(d.balance_after);
        showToast(`Grade request queued ✓ (${d.credit_cost} credits deducted). Grading scheduled for 3 AM America/New_York.`, true);
      } else if (res.status === 402) {
        showToast(`Insufficient credits — need ${d.required}, have ${d.balance?.toFixed(1)}`, false);
      } else if (res.status === 409) {
        showToast("Already requested", false);
      } else {
        showToast("Failed to submit request", false);
      }
    } catch {
      showToast("Network error", false);
    }
    setRequesting(null);
  };

  const cancelRequest = async (a: Assignment) => {
    setCancelConfirm(null);
    setCancelling(a.id);
    try {
      const res = await fetch("/api/professor/grade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", assignment_id: a.id }),
      });
      if (res.ok) {
        setRequested(prev => { const n = new Set(prev); n.delete(a.id); return n; });
        showToast("Grade request cancelled", true);
        // Refresh assignments
        setLoading(true);
        fetch(`/api/professor/assignments?${termParam}`)
          .then(r => r.json())
          .then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
      } else {
        showToast("Failed to cancel", false);
      }
    } catch {
      showToast("Network error", false);
    }
    setCancelling(null);
  };

  const openStaging = async (a: Assignment) => {
    if (!a.staging_request_id) return;
    setStagingAssignment(a);
    setStagingLoading(true);
    setStagingEdits({});
    setStagingExcluded(new Set());
    const res = await fetch(`/api/professor/grade-staging?request_id=${a.staging_request_id}`);
    const d = await res.json();
    setStagingGrades(d.grades ?? []);
    setStagingLoading(false);
  };

  const saveEdit = async (sg: StagingGrade) => {
    const edits = stagingEdits[sg.id] ?? {};
    const payload: Record<string, unknown> = {
      staging_id: sg.id,
      raw_score: edits.raw_score ?? sg.raw_score,
      final_score: edits.final_score ?? sg.final_score,
      grader_comment: edits.grader_comment ?? sg.grader_comment,
      is_late: edits.is_late !== undefined ? edits.is_late : sg.is_late,
      days_late: edits.days_late !== undefined ? edits.days_late : sg.days_late,
    };
    // Include question_grades for quiz submissions
    if (edits.question_grades) {
      payload.question_grades = edits.question_grades;
    }
    await fetch("/api/professor/grade-staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStagingGrades(prev => prev.map(g =>
      g.id === sg.id ? { ...g, ...edits } : g
    ));
    setStagingEdits(prev => { const n = { ...prev }; delete n[sg.id]; return n; });
  };

  const submitStaging = async (action: "approve" | "reject") => {
    if (!stagingAssignment?.staging_request_id) return;
    setStagingAction(action);

    // Save any unsaved edits first (only for included students)
    for (const sg of stagingGrades) {
      if (stagingEdits[sg.id] && !stagingExcluded.has(sg.id)) await saveEdit(sg);
    }

    const res = await fetch("/api/professor/grade-staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: stagingAssignment.staging_request_id,
        action,
        excluded_ids: Array.from(stagingExcluded),
      }),
    });
    const d = await res.json();

    setStagingAction(null);
    setStagingAssignment(null);

    if (action === "approve") {
      const posted = d.posted ?? 0;
      const errs = d.errors?.length ?? 0;
      const skipped = d.skipped ?? 0;
      const skipMsg = skipped > 0 ? `, ${skipped} excluded` : '';
      showToast(errs ? `Posted ${posted}${skipMsg}, ${errs} error(s)` : `${posted} grades posted to Canvas${skipMsg} ✓`, errs === 0);
    } else {
      showToast("Grades rejected — submissions back in ungraded queue", true);
    }

    // Refresh assignments
    setLoading(true);
    fetch(`/api/professor/assignments?${termParam}`)
      .then(r => r.json())
      .then(d2 => { setAssignments(d2.assignments ?? []); setLoading(false); });
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const courses = Array.from(
    new Map(assignments.map(a => [a.course_canvas_id, a.course_name])).entries()
  );

  const activeCourse = params.get("course_id")
    ? Number(params.get("course_id"))
    : courses[0]?.[0] ?? null;

  const filtered = assignments.filter(a => a.course_canvas_id === activeCourse);
  const isPast = (due: string | null) => due && new Date(due) < new Date();

  const statusBar = (a: Assignment) => {
    const total = Number(a.total_students);
    if (!total) return null;
    const graded = Math.min(Number(a.graded_count), total);
    const pending = Math.min(Number(a.ungraded_count), total - graded);
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 w-28">
        <div className="bg-green-500 transition-all" style={{ width: `${(graded / total) * 100}%` }} />
        <div className="bg-amber-500 transition-all" style={{ width: `${(pending / total) * 100}%` }} />
        <div className="bg-gray-700 transition-all" style={{ width: `${(Math.max(0, total - graded - pending) / total) * 100}%` }} />
      </div>
    );
  };

  const tabLabel = (name: string) => {
    const m = name.match(/^(ITEC|SCIA)\s[\d\-]+/);
    return m ? m[0] : name.split(" ").slice(0, 2).join(" ");
  };

  return (
    <div className="space-y-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all
          ${toast.ok ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {toast.msg}
        </div>
      )}

      {/* Grade Request confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Request AI Grading?</p>
                <p className="text-xs text-gray-400 mt-0.5">{confirm.ungraded_count} ungraded submission{Number(confirm.ungraded_count) !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm">
              <p className="text-gray-300 font-medium truncate">{confirm.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{confirm.course_name}</p>
            </div>
            {(() => {
              const cost = parseFloat((gradingCost * Number(confirm.ungraded_count)).toFixed(2));
              const after = creditBalance !== null ? creditBalance - cost : null;
              const insufficient = creditBalance !== null && creditBalance < cost;
              return (
                <div className={`border rounded-lg px-4 py-3 space-y-1 ${insufficient ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/20"}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Cost ({confirm.ungraded_count} × {gradingCost})</span>
                    <span className="font-mono text-amber-400 font-semibold">{cost.toFixed(1)} credits</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Your balance</span>
                    <span className="font-mono text-gray-300">{creditBalance !== null ? creditBalance.toFixed(1) : "—"}</span>
                  </div>
                  {after !== null && (
                    <div className="flex items-center justify-between text-sm border-t border-gray-700/50 pt-1 mt-1">
                      <span className="text-gray-400">After request</span>
                      <span className={`font-mono font-semibold ${after < 0 ? "text-red-400" : "text-green-400"}`}>{after.toFixed(1)} credits</span>
                    </div>
                  )}
                  {insufficient && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      ⚠️ Insufficient credits — <a href="/profile/credits" className="underline hover:text-red-300">Buy more</a>
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 space-y-2">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  AI grading is <strong className="text-gray-300">not 100% accurate</strong>. Results go to a staging area for your review. Only you can approve and post final grades to Canvas.
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                <Calendar className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Grading will run automatically at <strong className="text-gray-300">3 AM America/New_York</strong> daily. You can also grade manually anytime.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => submitRequest(confirm)}
                disabled={creditBalance !== null && creditBalance < parseFloat((gradingCost * Number(confirm.ungraded_count)).toFixed(2))}
                className="btn-primary flex-[2] py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Queue</span>
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 text-sm flex items-center justify-center gap-2 bg-red-600/40 hover:bg-red-600/50 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel grade request confirmation dialog */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-white font-semibold text-base">Cancel AI Grading Request?</h2>
            <div className="text-sm text-gray-400 space-y-2">
              <p>You are about to cancel the grading request for:</p>
              <p className="text-gray-200 font-medium truncate">{cancelConfirm.name}</p>
              <p className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-300 text-xs">
                Any deducted Token Credits will be <strong>credited back</strong> to your balance immediately.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                Keep Request
              </button>
              <button
                onClick={() => cancelRequest(cancelConfirm)}
                disabled={cancelling === cancelConfirm.id}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {cancelling === cancelConfirm.id ? "Cancelling…" : "Yes, Cancel & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staging review modal */}
      {stagingAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                  Review AI Grades
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stagingAssignment.name}</p>
              </div>
              <button onClick={() => setStagingAssignment(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {stagingLoading ? (
                <div className="text-center text-gray-500 py-8 text-sm animate-pulse">Loading grades…</div>
              ) : stagingGrades.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">No staged grades yet — AI grading may still be processing.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                      <th className="text-center py-2 w-12">
                        <button
                          onClick={() => {
                            if (stagingExcluded.size === 0) {
                              setStagingExcluded(new Set(stagingGrades.map(g => g.id)));
                            } else {
                              setStagingExcluded(new Set());
                            }
                          }}
                          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                          title={stagingExcluded.size === 0 ? "Exclude all" : "Include all"}
                        >
                          {stagingExcluded.size === 0 ? "✓ All" : "✗ All"}
                        </button>
                      </th>
                      <th className="text-left py-2 w-px whitespace-nowrap pr-4">Student</th>
                      <th className="text-center py-2 w-28">Score</th>
                      <th className="text-left py-2 w-36">Late</th>
                      <th className="text-left py-2">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {stagingGrades.map(sg => {
                      const edit = stagingEdits[sg.id] ?? {};
                      const isQuiz = sg.question_grades && sg.question_grades.length > 0;
                      const qGrades: QuestionGrade[] = edit.question_grades ?? sg.question_grades ?? [];
                      const raw = isQuiz
                        ? String(qGrades.reduce((sum, q) => sum + (q.score || 0), 0))
                        : (edit.raw_score ?? sg.raw_score ?? "");
                      const comment = edit.grader_comment ?? sg.grader_comment ?? "";
                      const isLate = edit.is_late !== undefined ? edit.is_late : sg.is_late;
                      const daysLate = edit.days_late !== undefined ? edit.days_late : (sg.days_late ?? 0);
                      const isDirty = Object.keys(edit).length > 0;
                      return (
                        <tr key={sg.id} className={`${isDirty ? "bg-amber-500/5" : ""} ${stagingExcluded.has(sg.id) ? "opacity-40" : ""}`}>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => setStagingExcluded(prev => {
                                const next = new Set(prev);
                                if (next.has(sg.id)) next.delete(sg.id);
                                else next.add(sg.id);
                                return next;
                              })}
                              className={`w-5 h-5 rounded border text-xs flex items-center justify-center transition-colors cursor-pointer
                                ${stagingExcluded.has(sg.id)
                                  ? "border-red-700/50 bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                  : "border-green-700/50 bg-green-900/30 text-green-400 hover:bg-green-900/50"
                                }`}
                              title={stagingExcluded.has(sg.id) ? "Click to include" : "Click to exclude"}
                            >
                              {stagingExcluded.has(sg.id) ? "✗" : "✓"}
                            </button>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-300 font-medium whitespace-nowrap w-px">
                            {sg.student_name}
                            {isQuiz && <span className="ml-1.5 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Quiz</span>}
                          </td>
                          <td className="py-2.5 px-1 text-center">
                            {isQuiz ? (
                              <span className="text-xs font-mono text-gray-300">{raw}</span>
                            ) : (
                              <input
                                type="number" step="1" min="0" max={stagingAssignment.points_possible}
                                value={raw ? String(Math.round(Number(raw))) : ""}
                                onChange={e => { const v = String(Math.round(Number(e.target.value))); setStagingEdits(prev => ({ ...prev, [sg.id]: { ...prev[sg.id], raw_score: v, final_score: v } })); }}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-xs font-mono focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            {!sg.is_late && (edit.is_late === undefined || edit.is_late === false) ? (
                              <span className="text-xs text-gray-600 select-none">On time</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isLate}
                                    onChange={e => setStagingEdits(prev => ({
                                      ...prev,
                                      [sg.id]: { ...prev[sg.id], is_late: e.target.checked, days_late: e.target.checked ? (sg.days_late || 1) : 0 }
                                    }))}
                                    className="accent-amber-500 w-3.5 h-3.5"
                                  />
                                  <span className={`text-xs font-medium ${isLate ? "text-amber-400" : "text-gray-500 line-through"}`}>
                                    {isLate ? "Late" : "Waived"}
                                  </span>
                                </label>
                                {isLate && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number" min="1" max="30"
                                      value={daysLate}
                                      onChange={e => setStagingEdits(prev => ({
                                        ...prev,
                                        [sg.id]: { ...prev[sg.id], days_late: Math.max(1, Number(e.target.value)) }
                                      }))}
                                      className="w-10 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                                    />
                                    <span className="text-xs text-gray-500">d</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 pl-2">
                            {isQuiz ? (
                              /* ── Quiz: compact "Comments" link → opens popup ── */
                              <button
                                onClick={() => setQuizCommentSg({ ...sg, ...(stagingEdits[sg.id] ?? {}) } as StagingGrade)}
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs cursor-pointer transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {qGrades.length} questions
                              </button>
                            ) : (
                              /* ── Regular: single comment ── */
                              <textarea
                                value={comment}
                                onChange={e => setStagingEdits(prev => ({ ...prev, [sg.id]: { ...prev[sg.id], grader_comment: e.target.value } }))}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                                rows={2}
                                placeholder="Add comment…"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 space-y-3">
              <p className="text-xs text-gray-500 flex gap-1.5 items-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                Edits are saved automatically on approve. Approving will post all grades to Canvas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => submitStaging("approve")}
                  disabled={stagingAction !== null || stagingGrades.length === 0}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{stagingAction === "approve" ? "Posting to Canvas…" : `Approve & Post to Canvas (${stagingGrades.length})`}</span>
                </button>
                <button
                  onClick={() => submitStaging("reject")}
                  disabled={stagingAction !== null}
                  className="px-3 py-2 rounded-xl bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 hover:border-red-600/60 text-sm transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>{stagingAction === "reject" ? "Cancelling…" : "Reject"}</span>
                </button>
                <button
                  onClick={() => setStagingAssignment(null)}
                  disabled={stagingAction !== null}
                  className="px-3 py-2 rounded-xl bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 hover:border-red-600/60 text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Comment Popup ── */}
      {quizCommentSg && (() => {
        const sg = quizCommentSg;
        const edit = stagingEdits[sg.id] ?? {};
        const qGrades: QuestionGrade[] = edit.question_grades ?? sg.question_grades ?? [];
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">{sg.student_name}</h3>
                  <p className="text-xs text-gray-400">
                    {qGrades.length} questions · Total: <span className="text-amber-400 font-mono">{qGrades.reduce((s, q) => s + (q.score || 0), 0)}</span>/{stagingAssignment?.points_possible}
                    {sg.is_late && <span className="text-amber-400 ml-2">⚠️ {sg.days_late}d late</span>}
                  </p>
                </div>
                <button onClick={() => setQuizCommentSg(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Per-question list */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {qGrades.map((q, qi) => (
                  <div key={q.question_id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-medium">{q.question_name}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" step="1" min="0" max={q.points_possible}
                          value={q.score}
                          onChange={e => {
                            const newQ = [...qGrades];
                            newQ[qi] = { ...newQ[qi], score: Math.round(Number(e.target.value)) };
                            const newTotal = newQ.reduce((s, qq) => s + (qq.score || 0), 0);
                            setStagingEdits(prev => ({
                              ...prev,
                              [sg.id]: { ...prev[sg.id], question_grades: newQ, raw_score: String(newTotal), final_score: String(newTotal) }
                            }));
                            setQuizCommentSg(prev => prev ? { ...prev, question_grades: newQ } as StagingGrade : null);
                          }}
                          className="w-14 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] text-gray-500">/ {q.points_possible}</span>
                      </div>
                    </div>
                    <textarea
                      value={q.comment}
                      onChange={e => {
                        const newQ = [...qGrades];
                        newQ[qi] = { ...newQ[qi], comment: e.target.value };
                        setStagingEdits(prev => ({
                          ...prev,
                          [sg.id]: { ...prev[sg.id], question_grades: newQ }
                        }));
                        setQuizCommentSg(prev => prev ? { ...prev, question_grades: newQ } as StagingGrade : null);
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                      rows={2}
                      placeholder="Question comment…"
                    />
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setQuizCommentSg(null)}
                  className="px-4 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab bar */}
      <div className="flex border-b border-gray-800 gap-0">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-10 w-28 bg-gray-800/40 animate-pulse rounded-t-lg mr-1" />)
              : courses.map(([cid, name]) => {
                const isActive = cid === activeCourse;
                const courseAssignments = assignments.filter(a => a.course_canvas_id === cid);
                const ungraded = courseAssignments.reduce((s, a) => s + Number(a.ungraded_count), 0);
                const staging = courseAssignments.reduce((s, a) => s + Number(a.staging_count), 0);
                return (
                  <button key={cid} onClick={() => router.replace(`/canvas/assignments?course_id=${cid}`)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
                      ${isActive ? "text-amber-400 border-b-2 border-amber-400 -mb-px bg-gray-900/50" : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"}`}>
                    {tabLabel(name)}
                    <div className="flex gap-1.5 items-center">
                      {staging > 0 && (
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono ${isActive ? "bg-purple-500/30 text-purple-300" : "bg-purple-900/30 text-purple-400"}`}>
                          {staging} staged
                        </span>
                      )}
                      {ungraded > 0 && (
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-500"}`}>
                          {ungraded}
                        </span>
                      )}
                    </div>
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
                  <th className="text-center px-3 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(a => {
                  const isRequested = requested.has(a.id);
                  const isLoading = requesting === a.id;
                  const hasStaging = Number(a.staging_count) > 0;
                  const canRequest = Number(a.ungraded_count) > 0 && !hasStaging && !isRequested;

                  return (
                    <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="text-left px-5 py-3 text-white">
                        <button
                          onClick={() => setSubmissionsAssignment(a)}
                          className="text-white hover:text-amber-400 cursor-pointer transition-colors font-medium text-left flex items-center gap-1.5"
                        >
                          {a.is_quiz
                            ? <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            : <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          }
                          {a.name}
                        </button>
                      </td>
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
                          <span className="text-xs text-gray-600">{a.graded_count}/{a.total_students}</span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 font-mono text-sm">
                        {a.avg_score !== null
                          ? <span className={Number(a.avg_score) >= 70 ? "text-green-400" : "text-red-400"}>{a.avg_score}%</span>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="text-center px-3 py-3">
                        {/* Staging badge (purple) > cancel (amber+X) > ungraded (amber) > done (✓) */}
                        {hasStaging ? (
                          <button
                            onClick={() => openStaging(a)}
                            className="text-xs bg-purple-900/40 text-purple-300 border border-purple-700/40 rounded-full px-2 py-0.5 hover:bg-purple-800/50 transition-colors cursor-pointer"
                            title="AI grades pending review — click to review"
                          >
                            {a.staging_count} staged
                          </button>
                        ) : a.pending_request_id ? (
                          <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">
                            {a.ungraded_count}
                          </span>
                        ) : Number(a.ungraded_count) > 0 ? (
                          <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">
                            {a.ungraded_count}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </td>

                      {/* Wand / Cancel button */}
                      <td className="text-center px-3 py-3">
                        {canRequest ? (
                          <button
                            onClick={() => !isLoading && setConfirm(a)}
                            disabled={isLoading}
                            title={`Request AI grading (${a.ungraded_count} ungraded)`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                          >
                            {isLoading
                              ? <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-amber-400 rounded-full animate-spin" />
                              : <Wand2 className="w-4 h-4" />}
                          </button>
                        ) : isRequested && !hasStaging ? (
                          <button
                            onClick={() => setCancelConfirm(a)}
                            disabled={cancelling === a.id}
                            title="Cancel AI grade request"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all text-red-500/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
                          >
                            {cancelling === a.id
                              ? <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-red-400 rounded-full animate-spin" />
                              : <X className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 text-gray-700 cursor-not-allowed" title={hasStaging ? "Review staged grades first" : "No ungraded submissions"}>
                            <Wand2 className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-2.5 border-t border-gray-800 flex gap-5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Graded</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Needs grading</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />Not submitted</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />AI staged (pending review)</span>
            </div>
          </>
        )}

      {/* Submissions dialog */}
      <SubmissionsDialog
        assignment={submissionsAssignment}
        onClose={() => setSubmissionsAssignment(null)}
      />
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
