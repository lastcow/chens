"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function StripeVerify({ sid }: { sid: string }) {
  const router = useRouter();
  const called = useRef(false);
  const [status, setStatus] = useState<"verifying" | "ok" | "pending">("verifying");

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    fetch("/api/user/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeSessionId: sid }),
    })
      .then(r => r.json())
      .then(data => {
        setStatus(data.verified ? "ok" : "pending");
        // Refresh the server component so userModules re-fetches from DB
        router.refresh();
      })
      .catch(() => {
        setStatus("pending");
        router.refresh();
      });
  }, [sid, router]);

  if (status === "verifying") {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
        <span className="animate-spin">⟳</span>
        <span>Confirming your payment…</span>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
      <span>✓</span>
      <span>
        {status === "ok"
          ? "Payment confirmed! Your module is now active."
          : "Payment received! Your module will activate in a moment."}
      </span>
    </div>
  );
}
