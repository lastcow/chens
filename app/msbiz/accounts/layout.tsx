import { auth } from "@/auth";
import { redirect } from "next/navigation";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY  = process.env.CHENS_API_SECRET_KEY!;

export default async function AccountsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  const userId = (session.user as { id?: string })?.id ?? "";
  const role   = (session.user as { role?: string })?.role ?? "";

  // System ADMINs bypass all permission checks
  if (role !== "ADMIN") {
    try {
      const res = await fetch(`${API_BASE}/api/msbiz/accounts?limit=1`, {
        headers: { "x-api-key": API_KEY, "x-user-id": userId, "x-user-role": role },
        cache: "no-store",
      });
      if (res.status === 403) redirect("/msbiz");
    } catch {
      redirect("/msbiz");
    }
  }

  return <>{children}</>;
}
