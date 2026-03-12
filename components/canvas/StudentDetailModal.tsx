"use client";
import { useState } from "react";

interface StudentDetail {
  student: { id: number; name: string; canvas_uid: number; email: string };
  at_risk: { status: boolean; reasons: string[] };
  grade: { current: number; out_of: number; percentage: number };
  assignments: Array<{
    id: number;
    name: string;
    submitted: boolean;
    grade: number | null;
    points_possible: number;
    status: string;
    days_late: number | null;
    submitted_at: string | null;
  }>;
  attendance: {
    total_sessions: number;
    attended: number;
    percentage: number;
    recent_absences: Array<{ date: string; session: string }>;
  };
}

interface Props {
  data: StudentDetail | null;
  onClose: () => void;
}

export default function StudentDetailModal({ data, onClose }: Props) {
  const [tab, setTab] = useState<"overview" | "assignments" | "attendance">("overview");

  if (!data) return null;

  const { student, grade, at_risk, assignments, attendance } = data;

  const gradeColor =
    grade.current < 60
      ? "text-red-400 bg-red-900/20"
      : grade.current < 70
      ? "text-red-400 bg-red-900/20"
      : grade.current < 80
      ? "text-amber-400 bg-amber-900/20"
      : "text-green-400 bg-green-900/20";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{student.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 flex gap-0 px-6 bg-gray-950/50 shrink-0">
          {(["overview", "assignments", "attendance"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "overview" ? "Overview" : t === "assignments" ? "Assignments" : "Attendance"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "overview" && (
            <>
              {/* Grade - Large */}
              <div className={`text-6xl font-bold font-mono text-center py-6 rounded-xl ${gradeColor}`}>
                {grade.current}%
              </div>

              {/* At-Risk Reasons */}
              {at_risk.reasons.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Reasons for At-Risk Status</h3>
                  {at_risk.reasons.map((reason, i) => (
                    <div key={i} className="flex gap-2 text-sm text-gray-400 items-start">
                      <span className="text-red-400 shrink-0">🔴</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "assignments" && (
            <div className="space-y-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-2 py-2">Assignment</th>
                    <th className="text-center px-2 py-2">Submitted</th>
                    <th className="text-center px-2 py-2">Grade</th>
                    <th className="text-center px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-2 py-2 text-gray-300">{a.name}</td>
                      <td className="text-center px-2 py-2">
                        {a.submitted ? (
                          <span className="text-green-400">✅</span>
                        ) : a.status === "unsubmitted" ? (
                          <span className="text-gray-500">—</span>
                        ) : (
                          <span className="text-red-400">❌</span>
                        )}
                      </td>
                      <td className="text-center px-2 py-2 font-mono text-gray-400">
                        {a.grade !== null ? `${a.grade}/${a.points_possible}` : "—"}
                      </td>
                      <td className="text-center px-2 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            a.status === "missing"
                              ? "bg-red-900/30 text-red-400"
                              : a.status === "unsubmitted"
                              ? "bg-amber-900/30 text-amber-400"
                              : a.status === "graded"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-gray-800 text-gray-500"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "attendance" && (
            <>
              {/* Attendance % */}
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold text-gray-300 mb-2">{attendance.percentage}%</div>
                <div className="text-sm text-gray-500">
                  {attendance.attended} / {attendance.total_sessions} sessions attended
                </div>
              </div>

              {/* Recent Absences */}
              {attendance.recent_absences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Recent Absences</h3>
                  <ul className="space-y-1">
                    {attendance.recent_absences.map((abs, i) => (
                      <li key={i} className="text-sm text-gray-400">
                        📅 {new Date(abs.date).toLocaleDateString()} - {abs.session}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {attendance.recent_absences.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">No recent absences</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
