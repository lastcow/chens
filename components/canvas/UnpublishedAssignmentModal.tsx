"use client";
import { useState } from "react";
import { X, ExternalLink, Lock, AlertCircle, Send, X as XIcon } from "lucide-react";

interface UnpublishedAssignment {
  id: number;
  canvas_id: number;
  name: string;
  description?: string | null;
  points_possible: number;
  due_at: string | null;
  assignment_type: string;
  is_quiz: boolean;
  course_name: string;
  course_canvas_id: number;
}

interface Props {
  assignment: UnpublishedAssignment | null;
  onClose: () => void;
  onPublished: () => void;
}

export default function UnpublishedAssignmentModal({ assignment, onClose, onPublished }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>(
    assignment?.due_at ? new Date(assignment.due_at).toISOString().slice(0, 16) : ""
  );

  if (!assignment) return null;

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/professor/assignments/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: assignment.id }),
      });

      if (res.ok) {
        onPublished();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to publish assignment");
      }
    } catch {
      setError("Network error");
    } finally {
      setPublishing(false);
    }
  };

  const canvasUrl = assignment.is_quiz
    ? `https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/quizzes/${assignment.canvas_id}`
    : `https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/assignments/${assignment.canvas_id}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{assignment.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{assignment.course_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Description with View in Canvas link */}
          {assignment.description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </h3>
                <a
                  href={`https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/assignments/${assignment.canvas_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View in Canvas
                </a>
              </div>
              <div
                className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 border border-gray-700/30 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: assignment.description }}
              />
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {assignment.is_quiz ? "Quiz" : "Assignment"} Type
                </p>
                <p className="text-white font-medium">{assignment.assignment_type || "—"}</p>
              </div>

              <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Points Possible</p>
                <p className="text-white font-medium">{assignment.points_possible}</p>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Due Date (America/New_York)</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors min-w-0"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Will be saved when publishing</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">Publishing this assignment</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                will make it visible to students immediately in Canvas. All students in the course
                will be able to see and submit to this assignment.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-4 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-colors shrink-0"
          >
            <XIcon className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
