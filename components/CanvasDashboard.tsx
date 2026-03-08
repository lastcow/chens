"use client";
import { useState, useEffect, useRef } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: string;
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
  GREEN: "text-green-400 bg-green-400/10 border-green-400/20",
  YELLOW: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  RED: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_COLOR: Record<string, string> = {
  QUEUED: "text-gray-400",
  RUNNING: "text-blue-400",
  COMPLETED: "text-green-400",
  FAILED: "text-red-400",
  CANCELLED: "text-gray-500",
};

const STATUS_ICON: Record<string, string> = {
  QUEUED: "⏳",
  RUNNING: "⟳",
  COMPLETED: "✓",
  FAILED: "✗",
  CANCELLED: "○",
};

// ── Token setup card ──────────────────────────────────────────────────────────
function CanvasTokenSetup({ onSaved }: { onSaved: (masked: string) => void }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/canvas-token", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save token");
      setLoading(false);
    } else {
      onSaved(token.slice(0, 4) + "****" + token.slice(-4));
    }
  };

  return (
    <div className="card border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">🔑</span>
        <div>
          <h3 className="font-semibold text-amber-400">Canvas API Token Required</h3>
          <p className="text-sm text-gray-400 mt-1">
            To run agent tasks, enter your Canvas API token. It&apos;s stored encrypted and never exposed.
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Get it at: <span className="text-gray-300">Canvas → Account → Settings → Approved Integrations → New Access Token</span>
      </p>
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={save} className="flex gap-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="input-field flex-1 font-mono text-sm"
          placeholder="Paste your Canvas API token..."
        />
        <button type="submit" disabled={loading || !token.trim()} className="btn-primary">
          {loading ? "Verifying..." : "Save Token"}
        </button>
      </form>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function CanvasDashboard({ userRole }: { userId: string; userRole: string }) {
  const [instruction, setInstruction] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "tools">("tasks");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [tokenMasked, setTokenMasked] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if token is saved
  useEffect(() => {
    fetch("/api/user/canvas-token")
      .then((r) => r.json())
      .then((d) => {
        setTokenMasked(d.isSet ? d.masked : null);
        setTokenLoading(false);
      })
      .catch(() => setTokenLoading(false));
  }, []);

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
    setSubmitError("");

    if (!tokenMasked) {
      setSubmitError("⚠️ Canvas token not set — add your token below before running tasks.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/agent/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction, courseId: courseId || undefined, createdBy: "teacher" }),
    });

    if (!res.ok) {
      const d = await res.json();
      setSubmitError(d.error || "Failed to submit task. Please try again.");
    } else {
      setInstruction("");
      setCourseId("");
      await fetchTasks();
    }
    setLoading(false);
  };

  const examples = [
    "List all my active courses",
    "Show ungraded submissions for assignment 547214 in course 33232",
    "Post an announcement to course 33232: Assignment 6 is now live",
    "Create a page in course 33232 titled Week 7 Resources",
  ];

  if (tokenLoading) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Token status bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
        tokenMasked
          ? "border-green-500/20 bg-green-500/5"
          : "border-red-500/20 bg-red-500/5"
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <span>{tokenMasked ? "🔓" : "🔒"}</span>
          {tokenMasked
            ? <span className="text-gray-300">Canvas token saved: <code className="font-mono text-green-400">{tokenMasked}</code></span>
            : <span className="text-red-400">No Canvas token — agent tasks will fail</span>
          }
        </div>
        <button
          onClick={() => setShowTokenForm(!showTokenForm)}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-3 py-1 transition-colors"
        >
          {tokenMasked ? "Update Token" : "Add Token"}
        </button>
      </div>

      {/* Token setup form */}
      {(!tokenMasked || showTokenForm) && (
        <CanvasTokenSetup
          onSaved={(masked) => {
            setTokenMasked(masked);
            setShowTokenForm(false);
          }}
        />
      )}

      {/* Task submission */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">🤖 Run Agent Task</h2>
        <form onSubmit={submitTask} className="space-y-4">
          <div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder='e.g. "List all my active courses" or "Post an announcement to course 33232: Assignment 6 is live"'
            />
          </div>

          {submitError && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span> {submitError}
            </div>
          )}

          <div className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="input-field w-40"
              placeholder="Course ID (opt.)"
            />
            <button
              type="submit"
              disabled={loading || !instruction.trim() || !tokenMasked}
              className="btn-primary"
              title={!tokenMasked ? "Add your Canvas token first" : ""}
            >
              {loading ? "Queuing..." : "Run Agent →"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setInstruction(ex)}
                className="text-xs text-gray-500 hover:text-amber-400 border border-gray-800 hover:border-amber-500/40 rounded px-2 py-1 transition-colors"
              >
                {ex.slice(0, 45)}…
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        {(["tasks", "tools"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab === "tasks" ? `Tasks (${tasks.length})` : `Tool Registry (${tools.length})`}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">No tasks yet — submit one above.</p>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
              className="card cursor-pointer hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <p className="text-sm flex-1 min-w-0 truncate">{task.title}</p>
                <span className={`text-xs font-mono shrink-0 ${STATUS_COLOR[task.status] ?? "text-gray-400"}`}>
                  {STATUS_ICON[task.status]} {task.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(task.createdAt).toLocaleString()}
                {task.toolsUsed?.length > 0 && ` · ${task.toolsUsed.join(", ")}`}
              </p>

              {selectedTask === task.id && (
                <div className="mt-4 pt-4 border-t border-gray-800 text-sm space-y-2">
                  {task.status === "RUNNING" && (
                    <p className="text-blue-400 animate-pulse">⟳ Agent is working...</p>
                  )}
                  {task.status === "FAILED" && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                      <p className="text-red-400 font-medium mb-1">⚠️ Task failed</p>
                      <p className="text-red-300 text-xs">
                        {task.error || "An unexpected error occurred. Check your Canvas token or try rephrasing the instruction."}
                      </p>
                    </div>
                  )}
                  {task.result?.answer && (
                    <div className="bg-gray-800/50 rounded-lg px-3 py-3 text-gray-300 whitespace-pre-wrap">
                      {task.result.answer}
                    </div>
                  )}
                  {task.status === "COMPLETED" && !task.result?.answer && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2 text-yellow-400 text-xs">
                      ⚠️ Task completed but returned no data. The Canvas API may have returned an empty result — try a more specific instruction.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tools */}
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
                  <span className={`text-xs px-2 py-0.5 rounded border ${TIER_COLOR[tool.tier] ?? ""}`}>
                    {tool.tier}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {tool.createdBy === "agent" ? "🧬 evolved" : "👤 seeded"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{tool.description}</p>
              <p className="text-xs text-gray-600 mt-2">Used {tool.usageCount}×{tool.evolutionReason ? ` · ${tool.evolutionReason}` : ""}</p>
            </div>
          ))}
          {userRole === "ADMIN" && tools.some((t) => t.tier === "RED") && (
            <div className="card border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">🔴 RED tier tools above require your approval before execution.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
