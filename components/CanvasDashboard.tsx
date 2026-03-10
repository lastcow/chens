"use client";
import { useState, useEffect, useRef } from "react";

interface TaskUsage {
  model?: string;
  claude: { inputTokens: number; outputTokens: number; calls: number; costUsd: number };
  flyio: { durationMs: number; costUsd: number };
  gemini: { embeddingCalls: number; costUsd: number };
  totalCostUsd: number;
}

interface ReActStep {
  step: number;
  thought?: string;
  action?: { tool: string; input: Record<string, unknown> };
  observation?: string | number | boolean | null | Record<string, unknown> | unknown[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  toolsUsed: string[];
  result?: { answer: string; steps?: unknown[] };
  error?: string;
  usage?: TaskUsage;
  steps?: ReActStep[];
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

// All models via OpenRouter — one key, all providers
const MODELS = [
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic · OpenRouter",
    inputPer1M: 0.80,
    outputPer1M: 4.00,
    badge: "⚡ Fast",
    badgeColor: "text-green-400 bg-green-400/10 border-green-400/20",
    note: "Best for simple tasks & progress reports",
    recommended: true,
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic · OpenRouter",
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    badge: "🧠 Smart",
    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    note: "Complex reasoning & grading",
    recommended: false,
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    provider: "Anthropic · OpenRouter",
    inputPer1M: 15.00,
    outputPer1M: 75.00,
    badge: "👑 Best",
    badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    note: "Most capable — technical & image grading",
    recommended: false,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI · OpenRouter",
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    badge: "🟢 Balanced",
    badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    note: "Strong vision + text, great for PDFs",
    recommended: false,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI · OpenRouter",
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    badge: "💰 Cheapest",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    note: "Ultra cheap for simple grading",
    recommended: false,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google · OpenRouter",
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    badge: "⚡ Ultra Fast",
    badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    note: "Google's fastest, very affordable",
    recommended: false,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta · OpenRouter",
    inputPer1M: 0.12,
    outputPer1M: 0.30,
    badge: "🦙 Open",
    badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    note: "Best open model, very cheap",
    recommended: false,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek V3",
    provider: "DeepSeek · OpenRouter",
    inputPer1M: 0.27,
    outputPer1M: 1.10,
    badge: "💡 Reasoning",
    badgeColor: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    note: "Strong coding & reasoning tasks",
    recommended: false,
  },
];

// Estimated cost for a typical 8K token task
function estimateCost(model: typeof MODELS[0]) {
  const inTok = 6000; const outTok = 2000;
  const cost = (inTok / 1_000_000) * model.inputPer1M + (outTok / 1_000_000) * model.outputPer1M;
  return cost < 0.001 ? "<$0.001" : `~$${cost.toFixed(3)}`;
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

// ── Usage badge ───────────────────────────────────────────────────────────────
function UsageBadge({ usage }: { usage: TaskUsage }) {
  const totalTok = usage.claude.inputTokens + usage.claude.outputTokens;
  const tokK = (totalTok / 1000).toFixed(1);
  const costStr = usage.totalCostUsd < 0.001
    ? `<$0.001`
    : `$${usage.totalCostUsd.toFixed(4)}`;
  const durS = (usage.flyio.durationMs / 1000).toFixed(1);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span title={`Model: ${usage.model ?? "?"} | Input: ${usage.claude.inputTokens.toLocaleString()} / Output: ${usage.claude.outputTokens.toLocaleString()} / Calls: ${usage.claude.calls}`}
        className="text-xs bg-purple-900/30 border border-purple-700/30 text-purple-300 rounded px-2 py-0.5 cursor-help">
        🤖 {usage.model?.split("-").slice(1, 3).join("-") ?? "AI"} · {tokK}K tok · ${usage.claude.costUsd.toFixed(4)}
      </span>
      <span title={`Duration: ${durS}s @ shared-cpu-1x`}
        className="text-xs bg-blue-900/30 border border-blue-700/30 text-blue-300 rounded px-2 py-0.5 cursor-help">
        ✈️ Fly {durS}s · ${usage.flyio.costUsd.toFixed(6)}
      </span>
      {(usage.gemini?.embeddingCalls ?? 0) > 0 && (
        <span className="text-xs bg-green-900/30 border border-green-700/30 text-green-300 rounded px-2 py-0.5">
          🔮 Gemini {usage.gemini.embeddingCalls} embed · free
        </span>
      )}
      <span className="text-xs bg-amber-900/30 border border-amber-700/30 text-amber-300 rounded px-2 py-0.5 font-medium">
        Total {costStr}
      </span>
    </div>
  );
}

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
export default function CanvasDashboard({ userId, userRole }: { userId: string; userRole: string }) {
  const [instruction, setInstruction] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-haiku-4-5");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [reseedingTool, setReseedingTool] = useState<string | null>(null);
  const [reseedMsg, setReseedMsg] = useState("");
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
    if (res.ok) { const d = await res.json(); const list = d.tasks ?? []; setTasks(list); schedulePoll(list); }
  };

  const fetchTools = async () => {
    const res = await fetch("/api/agent/tools");
    if (res.ok) { const d = await res.json(); setTools(d.tools ?? []); }
  };

  const reseedTool = async (name: string) => {
    setReseedingTool(name);
    setReseedMsg("");
    const res = await fetch(`/api/agent/tools/${name}/reseed`, { method: "POST" });
    const d = await res.json();
    setReseedMsg(res.ok ? "✅ Tool updated to latest definition" : `❌ ${d.error}`);
    setReseedingTool(null);
    await fetchTools();
  };

  // Adaptive polling: 1.5s when a task is running, 5s otherwise
  const schedulePoll = (taskList: Task[]) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const hasRunning = taskList.some(t => t.status === "RUNNING" || t.status === "QUEUED");
    pollRef.current = setInterval(fetchTasks, hasRunning ? 1500 : 5000);
  };

  useEffect(() => {
    fetchTasks();
    fetchTools();
    pollRef.current = setInterval(fetchTasks, 5000);
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
      body: JSON.stringify({ instruction, courseId: courseId || undefined, createdBy: userId, model: selectedModel }),
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
      {/* Notice — token management moved to Overview */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700/50 bg-gray-800/30 text-sm text-gray-500">
        <span>🔑</span>
        <span>Canvas token is managed from the <a href="/canvas/overview" className="text-amber-400 hover:underline">Overview</a> page.</span>
      </div>

      {/* Task submission */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">🤖 Run Agent Task</h2>
        </div>

        {/* Cost warning */}
        <div className="flex gap-3 bg-yellow-900/20 border border-yellow-600/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
          <div className="text-xs text-yellow-300/80 leading-relaxed">
            <span className="font-semibold text-yellow-300">Every token costs money.</span>
            {" "}Do not run tasks if you are unsure how large the job is.
            Failed tasks <span className="text-yellow-200 font-medium">still charge</span> for tokens consumed.
            Vague or broad instructions may trigger many tool calls and <span className="text-yellow-200 font-medium">cost unexpectedly high</span>.
            Start small — test with a single course or student before running wide tasks.
          </div>
        </div>
        <form onSubmit={submitTask} className="space-y-4">
          {/* Model selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">AI Model</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                    selectedModel === m.id
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-gray-800 hover:border-gray-600 bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{m.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${m.badgeColor}`}>{m.badge}</span>
                  </div>
                  <div className="text-xs text-gray-500">{m.note}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    ${m.inputPer1M}/M in · ${m.outputPer1M}/M out
                    <span className="ml-1 text-amber-600/80">· {estimateCost(m)}/task</span>
                  </div>
                  {m.recommended && (
                    <div className="text-xs text-green-500 mt-0.5">✓ recommended</div>
                  )}
                </button>
              ))}
            </div>
          </div>

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
                {task.startedAt && task.completedAt && (() => {
                  const ms = new Date(task.completedAt!).getTime() - new Date(task.startedAt!).getTime();
                  const s = ms / 1000;
                  return <span className="ml-2 text-gray-500">⏱ {s >= 60 ? `${Math.floor(s/60)}m ${Math.round(s%60)}s` : `${s.toFixed(1)}s`}</span>;
                })()}
                {task.toolsUsed?.length > 0 && ` · ${task.toolsUsed.join(", ")}`}
                {task.usage && (
                  <span className="ml-2 text-amber-600/70">
                    {((task.usage.claude.inputTokens + task.usage.claude.outputTokens) / 1000).toFixed(1)}K tok · ${task.usage.totalCostUsd < 0.001 ? "<0.001" : task.usage.totalCostUsd.toFixed(4)}
                  </span>
                )}
              </p>

              {selectedTask === task.id && (
                <div className="mt-4 pt-4 border-t border-gray-800 text-sm space-y-2">
                  {task.usage && <UsageBadge usage={task.usage} />}
                  {task.status === "RUNNING" && (
                    <div className="space-y-1">
                      {/* Live steps log */}
                      {task.steps && task.steps.length > 0 ? (
                        <div className="bg-gray-900/60 rounded-lg px-3 py-2 space-y-1 font-mono text-xs">
                          {task.steps.map((s) => (
                            <div key={s.step}>
                              {s.action && !s.observation && (
                                <p className="text-blue-300 animate-pulse">
                                  ⟳ Calling tool: <span className="text-amber-300">{s.action.tool}</span>
                                </p>
                              )}
                              {s.action && s.observation && (
                                <p className="text-green-400">
                                  ✓ {s.action.tool} →{" "}
                                  <span className="text-gray-400">
                                    {(() => { const o = JSON.stringify(s.observation ?? ""); return o.slice(0, 80) + (o.length > 80 ? "…" : ""); })()}
                                  </span>
                                </p>
                              )}
                            </div>
                          ))}
                          <p className="text-blue-400 animate-pulse">⟳ Thinking...</p>
                        </div>
                      ) : (
                        <p className="text-blue-400 animate-pulse text-xs">⟳ Agent starting...</p>
                      )}
                    </div>
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
                    <div className="space-y-2">
                      {/* Final Answer */}
                      <div className="bg-gray-800/50 rounded-lg px-3 py-3 text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {task.result.answer}
                      </div>
                      {/* Raw observations from tool calls */}
                      {task.steps && (task.steps as Array<{observation?: unknown; action?: {tool: string}}>).some(s => s.observation) && (
                        <details className="group">
                          <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer select-none py-1">
                            🔍 Raw tool data ({(task.steps as Array<{observation?: unknown}>).filter(s => s.observation).length} observations)
                          </summary>
                          <div className="mt-2 space-y-2">
                            {(task.steps as Array<{step: number; action?: {tool: string}; observation?: unknown}>)
                              .filter(s => s.observation)
                              .map((s, i) => (
                                <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-2">
                                  <div className="text-xs text-amber-500 mb-1">📡 {s.action?.tool ?? `Step ${s.step}`}</div>
                                  <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                                    {typeof s.observation === "string" ? s.observation : JSON.stringify(s.observation, null, 2)}
                                  </pre>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
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
          {reseedMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${reseedMsg.startsWith("✅") ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
              {reseedMsg}
            </div>
          )}
          {tools.map((tool) => (
            <div key={tool.name} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-mono text-sm text-amber-400">{tool.name}</span>
                  <span className="text-gray-600 text-xs ml-2">v{tool.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${TIER_COLOR[tool.tier] ?? ""}`}>
                    {tool.tier}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {tool.createdBy === "agent" ? "🧬 evolved" : "👤 seeded"}
                  </span>
                  {tool.createdBy !== "agent" && (
                    <button
                      onClick={() => reseedTool(tool.name)}
                      disabled={reseedingTool === tool.name}
                      title="Force update this tool to the latest definition"
                      className="text-xs text-gray-500 hover:text-amber-400 border border-gray-800 hover:border-amber-500/40 rounded px-2 py-0.5 transition-colors disabled:opacity-40"
                    >
                      {reseedingTool === tool.name ? "⟳" : "↻ reseed"}
                    </button>
                  )}
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
