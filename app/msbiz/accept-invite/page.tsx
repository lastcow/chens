"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, Building2 } from "lucide-react";

function AcceptInviteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("no-token"); return; }

    fetch("/api/msbiz/admin/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setStatus("success");
          setMessage(d.message);
          setTimeout(() => router.push("/msbiz"), 3000);
        } else {
          setStatus("error");
          setMessage(d.error || "Failed to accept invitation");
        }
      })
      .catch(() => { setStatus("error"); setMessage("Network error"); });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">MS Business</h1>
          <p className="text-gray-500 text-sm mt-1">Module Invitation</p>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-gray-400 text-sm">Accepting your invitation…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <p className="text-white font-medium">{message}</p>
            <p className="text-gray-500 text-sm">Redirecting you to the dashboard…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-400 font-medium">{message}</p>
            <div className="flex gap-3 mt-2">
              <Link href="/signin" className="btn-primary text-sm px-4 py-2">Sign In</Link>
              <Link href="/" className="btn-secondary text-sm px-4 py-2">Home</Link>
            </div>
          </div>
        )}

        {status === "no-token" && (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-amber-400">Invalid invitation link.</p>
            <Link href="/" className="btn-secondary text-sm px-4 py-2">Go Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteContent />
    </Suspense>
  );
}
