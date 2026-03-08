"use client";
import { useState, useEffect, useRef } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  toolsUsed: string[];
  result?: { answer: string };
  error?: string;
}

interface Tool {
  name: string;
  description: string;
  tier: string;
  version: number;
  usageCount: number;
  evolutionReason?: string;
  createdBy: string;
}

const TIER_COLOR: Record<string, string> = {
  GREEN: "text-green-400 bg-green-400/10",
  YELLOW: "text-yellow-400 bg-yellow-400/10",
  RED: "text-red-400 bg-red-400/10",
};

const STATUS_COLOR: Record<string, string> = {
  QUEUED: "text-gray-400",
  RUNNING: "text-blue-400",
  COMPLETED: "text-green-400",
  FAILED: "text-red-400",
  CANCELLED: "text-gray-500",
};

export default function CanvasDashboard({ userRole }: { userId: string; userRole: string }) {
  const [instruction, setInstruction] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "tools">("tasks");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = async () => {
    const res = await fetch("/api/agent/tasks");
    if (res.ok) { const d = await res.json(); setTasks(d.tasks ?? []); }
  };

  const fetchTools = async () => {
    const res = await fetch("/api/agent/tools");
    if (res.ok) { const d = await res.json(); setTools(d.tools ?? []); }
  };

  useEffect(() => {
    fetchTasks();
    fetchTools();
    pollRef.current = setInterval(fetchTasks, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    setLoading(true);
    const res = await fetch("/api/agent/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction, courseId: courseId || undefined, createdBy: "teacher" }),
    });
    if (res.ok) { setInstruction(""); setCourseId(""); await fetchTasks(); }
    setLoading(false);
  };

  const examples = [
    "List all my active courses",
    "Show ungraded submissions for assignment 547214 in course 33232",
    "Post an announcement to course 33232: 'Assignment 6 is now published'",
    "Create a reading page in course 33232 titled 'Week 7 Resources'",
  ];

  return (
    <div className="space-y-8">
      {/* Task submission */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🤖 Agent Task</h2>
        <form onSubmit={submitTask} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Instruction (natural language)</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="e.g. Grade all ungraded submissions for Assignment 4 in course 33232 with a score of 85 and comment 'Good work'"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1.5">Course ID (optional)</label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="input-field"
                placeholder="e.g. 33232"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading || !instruction.trim()} className="btn-primary">
                {loading ? "Queuing..." : "Run Agent"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setInstruction(ex)}
                className="text-xs text-gray-500 hover:text-amber-400 border border-gray-800 hover:border-amber-500/40 rounded px-2 py-1 transition-colors"
              >
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 pb-0">
        {(["tasks", "tools"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-amber-400 text-amber-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab === "tasks" ? `Tasks (${tasks.length})` : `Tool Registry (${tools.length})`}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks yet. Submit one above.</p>}
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
              className="card cursor-pointer hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(task.createdAt).toLocaleString()}
                    {task.toolsUsed?.length > 0 && ` · Tools: ${task.toolsUsed.join(", ")}`}
                  </p>
                </div>
                <span className={`text-xs font-mono ml-4 ${STATUS_COLOR[task.status] ?? "text-gray-400"}`}>
                  {task.status === "RUNNING" ? "⟳ " : ""}
                  {task.status}
                </span>
              </div>
              {selectedTask?.id === task.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  {task.result?.answer && (
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">{task.result.answer}</div>
                  )}
                  {task.error && (
                    <div className="text-sm text-red-400">{task.error}</div>
                  )}
                  {task.status === "RUNNING" && (
                    <div className="text-sm text-blue-400 animate-pulse">Agent is working...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tools tab */}
      {activeTab === "tools" && (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.name} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-mono text-sm text-amber-400">{tool.name}</span>
                  <span className="text-gray-600 text-xs ml-2">v{tool.version}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${TIER_COLOR[tool.tier] ?? ""}`}>
                    {tool.tier}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                    {tool.createdBy === "agent" ? "🧬 evolved" : "👤 human"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{tool.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>Used {tool.usageCount}x</span>
                {tool.evolutionReason && <span className="italic">{tool.evolutionReason}</span>}
              </div>
            </div>
          ))}
          {userRole === "ADMIN" && (
            <p className="text-xs text-gray-600 mt-4">
              🔴 RED tier tools pending approval will appear here for review.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
