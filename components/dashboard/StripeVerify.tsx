"use client";
import { useEffect, useRef } from "react";

export default function StripeVerify({ sid }: { sid: string }) {
  const called = useRef(false);

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
        if (data.error) console.error("[StripeVerify] API error:", data.error);
        // Hard navigation — forces fresh server render with updated DB state
        window.location.replace("/dashboard/modules?activated=1");
      })
      .catch(err => {
        console.error("[StripeVerify] fetch error:", err);
        window.location.replace("/dashboard/modules?activated=1");
      });
  }, [sid]);

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
      <span className="inline-block animate-spin">⟳</span>
      <span>Activating your module…</span>
    </div>
  );
}
