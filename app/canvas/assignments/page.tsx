"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTerm } from "@/components/canvas/TermProvider";

interface Assignment {
  id: number; canvas_id: number; name: string; points_possible: number;
  due_at: string | null; assignment_type: string;
  course_name: string; course_canvas_id: number;
  graded_count: number; ungraded_count: number; missing_count: number;
  avg_score: number | null; total_students: number;
  staging_count: number; pending_request_id: string | null; staging_request_id: string | null;
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
}

// Wand icon
function WandIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4.5 16.5l10-10 3 3-10 10-3-3z" />
      <path d="M14 5l3 3" />
      {active && <>
        <path d="M18 2v3M21 5h-3" strokeWidth={1.5} />
        <path d="M21 2l-1.5 1.5M21 5l-1.5-1.5" strokeWidth={1.2} />
      </>}
    </svg>
  );
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

  // Staging review state
  const [stagingAssignment, setStagingAssignment] = useState<Assignment | null>(null);
  const [stagingGrades, setStagingGrades] = useState<StagingGrade[]>([]);
  const [stagingLoading, setStagingLoading] = useState(false);
  const [stagingEdits, setStagingEdits] = useState<Record<number, Partial<StagingGrade>>>({});
  const [stagingAction, setStagingAction] = useState<"approve" | "reject" | null>(null);

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
  }, []);

  const [cancelling, setCancelling] = useState<number | null>(null);

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
        }),
      });
      if (res.status === 201) {
        setRequested(prev => new Set([...prev, a.id]));
        showToast("Grade request queued ✓", true);
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
    const res = await fetch(`/api/professor/grade-staging?request_id=${a.staging_request_id}`);
    const d = await res.json();
    setStagingGrades(d.grades ?? []);
    setStagingLoading(false);
  };

  const saveEdit = async (sg: StagingGrade) => {
    const edits = stagingEdits[sg.id] ?? {};
    await fetch("/api/professor/grade-staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staging_id: sg.id,
        raw_score: edits.raw_score ?? sg.raw_score,
        final_score: edits.final_score ?? sg.final_score,
        grader_comment: edits.grader_comment ?? sg.grader_comment,
      }),
    });
    setStagingGrades(prev => prev.map(g =>
      g.id === sg.id ? { ...g, ...edits } : g
    ));
    setStagingEdits(prev => { const n = { ...prev }; delete n[sg.id]; return n; });
  };

  const submitStaging = async (action: "approve" | "reject") => {
    if (!stagingAssignment?.staging_request_id) return;
    setStagingAction(action);

    // Save any unsaved edits first
    for (const sg of stagingGrades) {
      if (stagingEdits[sg.id]) await saveEdit(sg);
    }

    const res = await fetch("/api/professor/grade-staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: stagingAssignment.staging_request_id, action }),
    });
    const d = await res.json();

    setStagingAction(null);
    setStagingAssignment(null);

    if (action === "approve") {
      const posted = d.posted ?? 0;
      const errs = d.errors?.length ?? 0;
      showToast(errs ? `Posted ${posted}, ${errs} error(s)` : `${posted} grades posted to Canvas ✓`, errs === 0);
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">🪄</div>
              <div>
                <p className="font-semibold text-white text-sm">Request AI Grading?</p>
                <p className="text-xs text-gray-400 mt-0.5">{confirm.ungraded_count} ungraded submission{Number(confirm.ungraded_count) !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm">
              <p className="text-gray-300 font-medium truncate">{confirm.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{confirm.course_name}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Cost per submission</span>
                <span className="font-mono text-amber-400">${gradingCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Estimated total</span>
                <span className="font-mono font-semibold text-amber-300">${(gradingCost * Number(confirm.ungraded_count)).toFixed(2)}</span>
              </div>
              <p className="text-xs text-amber-600/80 mt-1">Charged only for submissions processed.</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 flex gap-2">
              <span className="text-yellow-500 text-sm mt-0.5 shrink-0">⚠️</span>
              <p className="text-xs text-gray-400 leading-relaxed">
                AI grading is <strong className="text-gray-300">not 100% accurate</strong>. Results go to a staging area for your review. Only you can approve and post final grades to Canvas.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => submitRequest(confirm)} className="btn-primary flex-1 py-2 text-sm">Confirm &amp; Queue</button>
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Staging review modal */}
      {stagingAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📋</span> Review AI Grades
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stagingAssignment.name}</p>
              </div>
              <button onClick={() => setStagingAssignment(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
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
                      <th className="text-left py-2">Student</th>
                      <th className="text-center py-2 w-20">Score</th>
                      <th className="text-center py-2 w-20">Final</th>
                      <th className="text-left py-2">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {stagingGrades.map(sg => {
                      const edit = stagingEdits[sg.id] ?? {};
                      const score = edit.final_score ?? sg.final_score ?? "";
                      const raw = edit.raw_score ?? sg.raw_score ?? "";
                      const comment = edit.grader_comment ?? sg.grader_comment ?? "";
                      const isDirty = Object.keys(edit).length > 0;
                      return (
                        <tr key={sg.id} className={`${isDirty ? "bg-amber-500/5" : ""}`}>
                          <td className="py-2.5 pr-3 text-gray-300 font-medium">{sg.student_name}</td>
                          <td className="py-2.5 px-1 text-center">
                            <input
                              type="number" step="0.5" min="0" max={stagingAssignment.points_possible}
                              value={raw}
                              onChange={e => setStagingEdits(prev => ({ ...prev, [sg.id]: { ...prev[sg.id], raw_score: e.target.value, final_score: e.target.value } }))}
                              className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-xs font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2.5 px-1 text-center">
                            <span className={`text-xs font-mono font-semibold ${Number(score) >= stagingAssignment.points_possible * 0.7 ? "text-green-400" : "text-red-400"}`}>
                              {score || "—"}
                            </span>
                            {Number(sg.late_penalty) > 0 && (
                              <span className="block text-xs text-gray-600">-{sg.late_penalty}</span>
                            )}
                          </td>
                          <td className="py-2.5 pl-2">
                            <input
                              type="text"
                              value={comment}
                              onChange={e => setStagingEdits(prev => ({ ...prev, [sg.id]: { ...prev[sg.id], grader_comment: e.target.value } }))}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                              placeholder="Add comment…"
                            />
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
              <p className="text-xs text-gray-500 flex gap-1.5">
                <span className="text-yellow-500">⚠️</span>
                Edits are saved automatically on approve. Approving will post all grades to Canvas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => submitStaging("approve")}
                  disabled={stagingAction !== null || stagingGrades.length === 0}
                  className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
                >
                  {stagingAction === "approve" ? "Posting to Canvas…" : `✓ Approve & Post to Canvas (${stagingGrades.length})`}
                </button>
                <button
                  onClick={() => submitStaging("reject")}
                  disabled={stagingAction !== null}
                  className="btn-secondary flex-1 py-2 text-sm disabled:opacity-50 hover:border-red-500/40 hover:text-red-400"
                >
                  {stagingAction === "reject" ? "Cancelling…" : "✗ Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-800 gap-0">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-10 w-28 bg-gray-800/40 animate-pulse rounded-t-lg mr-1" />)
          : courses.map(([cid, name]) => {
            const isActive = cid === activeCourse;
            const courseAssignments = assignments.filter(a => a.course_canvas_id === cid);
            const ungraded = courseAssignments.reduce((s, a) => s + Number(a.ungraded_count), 0);
            return (
              <button key={cid} onClick={() => router.replace(`/canvas/assignments?course_id=${cid}`)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
                  ${isActive ? "text-amber-400 border-b-2 border-amber-400 -mb-px bg-gray-900/50" : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"}`}>
                {tabLabel(name)}
                {ungraded > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-500"}`}>
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">
                              {a.ungraded_count}
                            </span>
                            <button
                              onClick={() => cancelRequest(a)}
                              disabled={cancelling === a.id}
                              title="Cancel grade request"
                              className="text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50 leading-none"
                            >
                              {cancelling === a.id ? "…" : "✕"}
                            </button>
                          </div>
                        ) : Number(a.ungraded_count) > 0 ? (
                          <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 rounded-full px-2 py-0.5">
                            {a.ungraded_count}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </td>

                      {/* Wand — disabled when staging pending, fully graded, or already requested */}
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
                              : <WandIcon active={true} />}
                          </button>
                        ) : isRequested && !hasStaging ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 text-green-400" title="AI grading requested">
                            <WandIcon active={false} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 text-gray-700 cursor-not-allowed" title={hasStaging ? "Review staged grades first" : "No ungraded submissions"}>
                            <WandIcon active={false} />
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
