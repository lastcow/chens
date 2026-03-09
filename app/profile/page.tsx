"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileData {
  user: {
    id: string; name: string; email: string; role: string;
    image: string | null; has_password: boolean; created_at: string;
    providers: string[];
  };
  costs: { total: number; month: number; total_runs: number; month_runs: number };
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google", github: "GitHub", credentials: "Email / Password",
};
const PROVIDER_COLORS: Record<string, string> = {
  google: "bg-blue-900/30 border-blue-700/30 text-blue-400",
  github: "bg-purple-900/30 border-purple-700/30 text-purple-400",
  credentials: "bg-gray-800 border-gray-700 text-gray-400",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (status !== "authenticated") return;
    fetch("/api/user/profile").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [status, router]);

  const handlePasswordChange = async () => {
    if (newPw !== confPw) { setPwMsg({ ok: false, text: "Passwords don't match" }); return; }
    if (newPw.length < 8)  { setPwMsg({ ok: false, text: "Min 8 characters" }); return; }
    setPwLoading(true); setPwMsg(null);
    const res = await fetch("/api/user/password", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: curPw, new_password: newPw }),
    });
    const d = await res.json();
    setPwMsg(res.ok ? { ok: true, text: "Password updated" } : { ok: false, text: d.error ?? "Failed" });
    if (res.ok) { setCurPw(""); setNewPw(""); setConfPw(""); }
    setPwLoading(false);
  };

  if (status === "loading" || loading) return (
    <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
  );
  if (!data) return null;

  const { user } = data;
  const isOAuth = user.providers.some(p => p !== "credentials");

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="card flex items-center gap-5">
        {user.image ? (
          <Image src={user.image} alt="avatar" width={64} height={64} className="rounded-full shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-white truncate">{user.name}</div>
          <div className="text-gray-500 text-sm truncate">{user.email}</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${user.role === "ADMIN" ? "bg-amber-900/30 border-amber-700/30 text-amber-400" : "bg-gray-800 border-gray-700 text-gray-500"}`}>
              {user.role}
            </span>
            {user.providers.map(p => (
              <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[p] ?? "bg-gray-800 border-gray-700 text-gray-400"}`}>
                {PROVIDER_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-600 text-right shrink-0">
          Member since<br />{new Date(user.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Password */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Password</h2>
        {isOAuth ? (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="text-lg">🔒</span>
            <span>Signed in via <strong className="text-gray-300">{user.providers.filter(p => p !== "credentials").map(p => PROVIDER_LABELS[p] ?? p).join(", ")}</strong>. Password login not available.</span>
          </div>
        ) : (
          <div className="space-y-3 max-w-sm">
            {user.has_password && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Current Password</label>
                <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Confirm Password</label>
              <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            {pwMsg && <div className={`text-xs px-3 py-2 rounded-lg ${pwMsg.ok ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>{pwMsg.text}</div>}
            <button onClick={handlePasswordChange} disabled={pwLoading} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {pwLoading ? "Updating…" : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
