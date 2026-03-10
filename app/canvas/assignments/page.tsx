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
}

// Wand + sparkles icon for grade request
function GradeRequestIcon({ requested }: { requested: boolean }) {
  return requested ? (
    // Requested state: solid wand tip + check
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4.5 16.5l10-10 3 3-10 10-3-3z" />
      <path d="M14 5l3 3" />
      <path d="M9 3v2M3 9h2M11 3l1 1M3 11l1 1" />
      <path d="M17 8l2-2M19 12l-1-1" strokeWidth={1.4} />
      {/* small check on wand tip */}
      <path d="M18.5 5.5l1.5 1.5-3 3" strokeWidth={1.6} />
    </svg>
  ) : (
    // Idle state: wand with sparkles
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      {/* wand shaft */}
      <path d="M4.5 16.5l10-10 3 3-10 10-3-3z" />
      <path d="M14 5l3 3" />
      {/* sparkles around tip */}
      <path d="M18 2v3M21 5h-3" strokeWidth={1.5} />
      <path d="M21 2l-1.5 1.5M21 5l-1.5-1.5" strokeWidth={1.2} />
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
  const [gradingCost, setGradingCost] = useState<number>(0.05);

  useEffect(() => {
    if (!activeTerm) return;
    setLoading(true);
    fetch(`/api/professor/assignments?${termParam}`)
      .then(r => r.json())
      .then(d => { setAssignments(d.assignments ?? []); setLoading(false); });
  }, [termParam, activeTerm]);

  // Load existing requests + grading cost on mount
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
        showToast("Grade request submitted ✓", true);
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

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Build course tabs from data
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
    const graded  = Math.min(Number(a.graded_count), total);
    const pending = Math.min(Number(a.ungraded_count), total - graded);
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 w-28">
        <div className="bg-green-500 transition-all" style={{ width: `${(graded/total)*100}%` }} />
        <div className="bg-amber-500 transition-all" style={{ width: `${(pending/total)*100}%` }} />
        <div className="bg-gray-700 transition-all" style={{ width: `${(Math.max(0, total - graded - pending)/total)*100}%` }} />
      </div>
    );
  };

  const tabLabel = (name: string) => {
    const m = name.match(/^(ITEC|SCIA)\s[\d\-]+/);
    return m ? m[0] : name.split(" ").slice(0,2).join(" ");
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

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                🪄
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Request AI Grading?</p>
                <p className="text-xs text-gray-400 mt-0.5">{confirm.ungraded_count} ungraded submission{Number(confirm.ungraded_count) !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Assignment info */}
            <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm">
              <p className="text-gray-300 font-medium truncate">{confirm.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{confirm.course_name}</p>
            </div>

            {/* Cost estimate */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Cost per submission</span>
                <span className="font-mono text-amber-400">${gradingCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Estimated total</span>
                <span className="font-mono font-semibold text-amber-300">
                  ${(gradingCost * Number(confirm.ungraded_count)).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-amber-600/80 mt-1">
                Charged only for ungraded submissions processed.
              </p>
            </div>

            {/* Accuracy disclaimer */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 flex gap-2">
              <span className="text-yellow-500 text-sm mt-0.5 shrink-0">⚠️</span>
              <p className="text-xs text-gray-400 leading-relaxed">
                AI grading results are <strong className="text-gray-300">not guaranteed to be 100% accurate</strong>.
                Grades will be saved to a staging area for your review before being finalized.
                Only you can approve and submit the final grades.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => submitRequest(confirm)}
                className="btn-primary flex-1 py-2 text-sm"
              >
                Confirm &amp; Queue
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th className="text-center px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(a => {
                  const isRequested = requested.has(a.id);
                  const isLoading = requesting === a.id;
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
                      {/* Grade Request icon — only active when ungraded submissions exist */}
                      <td className="text-center px-3 py-3">
                        {Number(a.ungraded_count) === 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 text-gray-700 cursor-not-allowed" title="No ungraded submissions">
                            <GradeRequestIcon requested={false} />
                          </span>
                        ) : (
                          <button
                            onClick={() => !isRequested && !isLoading && setConfirm(a)}
                            disabled={isRequested || isLoading}
                            title={isRequested ? "AI grading requested" : `Request AI grading (${a.ungraded_count} ungraded)`}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all
                              ${isRequested
                                ? "text-green-400 bg-green-500/10 cursor-default"
                                : isLoading
                                  ? "text-gray-600 cursor-wait"
                                  : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                              }`}
                          >
                            {isLoading
                              ? <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-amber-400 rounded-full animate-spin" />
                              : <GradeRequestIcon requested={isRequested} />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
