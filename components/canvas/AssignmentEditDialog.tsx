"use client";
import { useState } from "react";
import { X, Clock, Save, Loader2, FileText, ClipboardList, ExternalLink } from "lucide-react";

export interface QuestionGrade {
  question_id: number; question_name: string; question_text: string;
  points_possible: number; score: number; comment: string;
}

export interface DetailAssignment {
  assignment_id: number; assignment_canvas_id: number; submission_id: number | null;
  name: string; points_possible: number; due_at: string | null;
  is_quiz: boolean; quiz_id: number | null; assignment_type: string;
  score: number | null; final_score: number | null;
  late_penalty: number | null; grader_comment: string | null;
  workflow_state: string | null; late: boolean; submitted_at: string | null;
  course_canvas_id: number;
  canvas_posted: boolean | null;
  canvas_comment_id: number | null;
  days_late: number | null;
  question_grades: QuestionGrade[] | null;
  quiz_submission_id: number | null;
}

interface Props {
  assignment: DetailAssignment;
  canvasUid: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssignmentEditDialog({ assignment, canvasUid, onClose, onSaved }: Props) {
  const isQuiz = assignment.is_quiz && assignment.question_grades && assignment.question_grades.length > 0;
  const [score, setScore] = useState(assignment.score ?? 0);
  const [comment, setComment] = useState(assignment.grader_comment ?? "");
  const [isLate, setIsLate] = useState(assignment.late ?? false);
  const [daysLate, setDaysLate] = useState(assignment.days_late ?? 0);
  const [latePenalty, setLatePenalty] = useState(assignment.late_penalty ?? 0);
  const [questions, setQuestions] = useState<QuestionGrade[]>(
    assignment.question_grades ? assignment.question_grades.map(q => ({ ...q })) : []
  );
  const [saving, setSaving] = useState(false);
  const [postToCanvas, setPostToCanvas] = useState(false);

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
        canvas_comment_id: assignment.canvas_comment_id ?? null,
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
      if (res.ok) onSaved();
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

  const noSpinner = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div
        className={`bg-gray-900 border border-gray-800 rounded-2xl w-full max-h-[85vh] flex flex-col shadow-2xl ${isQuiz ? 'max-w-[900px]' : 'max-w-[600px]'}`}
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
              {/* Late card — full width */}
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
                        className={`w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 ${noSpinner}`} />
                    </div>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Penalty</span>
                      <input type="number" value={latePenalty} min={0} step={1}
                        onChange={e => setLatePenalty(parseFloat(e.target.value) || 0)}
                        className={`w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 ${noSpinner}`} />
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

              {/* Question cards */}
              {questions.map((q, qi) => {
                const pct = q.points_possible > 0 ? Math.round((q.score / q.points_possible) * 100) : 0;
                const pctColor = pct >= 90 ? 'text-green-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';
                const barColor = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={qi} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3">
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
                          className={`w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-purple-500/50 ${noSpinner}`} />
                        <span className="text-[10px] text-gray-500">/{q.points_possible}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <textarea value={q.comment} placeholder="Comment…" rows={2}
                      onChange={e => updateQuestion(qi, 'comment', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none" />
                  </div>
                );
              })}

              {/* Quiz submission link */}
              {assignment.quiz_submission_id && (
                <div className="col-span-2 flex items-center gap-2 px-1">
                  <a href={`https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/quizzes/${assignment.quiz_id}/submissions/${assignment.quiz_submission_id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Submission
                  </a>
                </div>
              )}
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
                        className={`w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 ${noSpinner}`} />
                    </div>
                    <div className="h-5 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Penalty</span>
                      <input type="number" value={latePenalty} min={0} step={1}
                        onChange={e => setLatePenalty(parseFloat(e.target.value) || 0)}
                        className={`w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 ${noSpinner}`} />
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
                    className={`w-20 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 ${noSpinner}`} />
                  <span className="text-sm text-gray-500">/ {assignment.points_possible}</span>
                </div>
                <div className="flex items-start gap-3">
                  <label className="text-sm text-gray-400 w-16 pt-2">Comment</label>
                  <textarea value={comment} placeholder="Grader comment…"
                    onChange={e => setComment(e.target.value)} rows={3}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none" />
                </div>
              </div>

              {/* Quick links */}
              <div className="flex items-center gap-3">
                <a href={`https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/assignments/${assignment.assignment_canvas_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Assignment
                </a>
                <span className="text-gray-700">·</span>
                <a href={`https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/assignments/${assignment.assignment_canvas_id}/submissions/${canvasUid}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Submission
                </a>
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
