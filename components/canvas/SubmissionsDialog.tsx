"use client";
import { useState, useEffect } from "react";

interface Submission {
  id: number;
  student_name: string;
  student_canvas_uid: number;
  submitted_at: string | null;
  workflow_state: string;
  status: string; // "graded" | "ungraded" | "missing"
  grade: number | null;
  points_possible: number;
}

interface Assignment {
  id: number;
  name: string;
  points_possible: number;
  course_name: string;
}

interface Props {
  assignment: Assignment | null;
  onClose: () => void;
}

export default function SubmissionsDialog({ assignment, onClose }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assignment) return;
    
    setLoading(true);
    fetch(`/api/professor/submissions?assignment_id=${assignment.id}`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(d.submissions ?? []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch submissions:", err);
        setLoading(false);
      });
  }, [assignment]);

  if (!assignment) return null;

  const statusColors: Record<string, string> = {
    graded: "bg-green-900/30 text-green-400",
    ungraded: "bg-amber-900/30 text-amber-400",
    missing: "bg-red-900/30 text-red-400",
  };

  const statusIcons: Record<string, string> = {
    graded: "✅",
    ungraded: "⏳",
    missing: "❌",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{assignment.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{assignment.course_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">No submissions found</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50 border-b border-gray-800 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Student</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">Grade</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{sub.student_name}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusColors[sub.status] || "bg-gray-800 text-gray-500"}`}>
                        {statusIcons[sub.status] || "❓"} {sub.status}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3 font-mono text-gray-400">
                      {sub.grade !== null
                        ? `${sub.grade}/${sub.points_possible}`
                        : sub.status === "missing"
                        ? "—"
                        : "—"}
                    </td>
                    <td className="text-left px-4 py-3 text-gray-500 text-xs">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString() + " " + new Date(sub.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Not submitted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
