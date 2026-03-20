import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_ERROR_WEBHOOK ?? "";
const DRAIN_SECRET = process.env.VERCEL_LOG_DRAIN_SECRET ?? "";

// Vercel log drain verification — GET and HEAD
export async function GET(req: NextRequest) {
  const verifyToken = req.headers.get("x-vercel-verify");
  if (verifyToken) {
    return new NextResponse(verifyToken, {
      status: 200,
      headers: { "x-vercel-verify": verifyToken, "content-type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function HEAD(req: NextRequest) {
  const verifyToken = req.headers.get("x-vercel-verify");
  return new NextResponse(null, {
    status: 200,
    headers: verifyToken ? { "x-vercel-verify": verifyToken } : {},
  });
}

export async function POST(req: NextRequest) {
  // Verify drain secret
  const secret = req.headers.get("x-vercel-log-drain-token");
  if (DRAIN_SECRET && secret !== DRAIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let logs: Record<string, unknown>[];
  try { logs = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  if (!DISCORD_WEBHOOK_URL || !Array.isArray(logs)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const errors = logs.filter(l => {
    const level = String(l.level ?? "").toLowerCase();
    const msg = String(l.message ?? l.text ?? "").toLowerCase();
    return level === "error" || msg.includes("error") || msg.includes("unhandled") || msg.includes("500");
  });

  for (const err of errors.slice(0, 5)) {
    const msg = String(err.message ?? err.text ?? JSON.stringify(err)).slice(0, 500);
    const path = String(err.requestPath ?? err.path ?? "");
    const ts = err.timestamp ? new Date(err.timestamp as number).toISOString() : new Date().toISOString();
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "⚠️ Vercel Error",
          color: 0xef4444,
          fields: [
            ...(path ? [{ name: "Path", value: `\`${path}\``, inline: true }] : []),
            { name: "Time", value: ts, inline: true },
            { name: "Message", value: `\`\`\`${msg}\`\`\`` },
          ],
          footer: { text: "Vercel Log Drain" },
        }],
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, forwarded: errors.length });
}
