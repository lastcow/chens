import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CanvasDashboard from "@/components/CanvasDashboard";

export default async function CanvasPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <CanvasDashboard userId={session.user?.id ?? ""} userRole={session.user?.role ?? "USER"} />
  );
}
