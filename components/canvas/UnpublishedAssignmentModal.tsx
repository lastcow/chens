"use client";
import { useState } from "react";
import { X, ExternalLink, Lock, AlertCircle } from "lucide-react";

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  };

  const canvasUrl = assignment.is_quiz
    ? `https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/quizzes/${assignment.canvas_id}`
    : `https://frostburg.instructure.com/courses/${assignment.course_canvas_id}/assignments/${assignment.canvas_id}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Unpublished Assignment</h2>
              <p className="text-sm text-gray-500 mt-0.5">{assignment.course_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Assignment Name */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Name
            </h3>
            <p className="text-white font-medium text-lg">{assignment.name}</p>
          </div>

          {/* Description */}
          {assignment.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Description
              </h3>
              <div
                className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 border border-gray-700/30 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: assignment.description }}
              />
            </div>
          )}

          {/* Details Grid */}
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

            <div className="col-span-2 bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="text-white font-medium text-sm">{formatDate(assignment.due_at)}</p>
              <p className="text-xs text-gray-500 mt-1">Times shown in America/New_York</p>
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
          <a
            href={canvasUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View in Canvas
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing…" : "Publish Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
