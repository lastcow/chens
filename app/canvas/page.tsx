import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CanvasDashboard from "@/components/CanvasDashboard";

export default async function CanvasPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Canvas LMS</h1>
        <p className="text-gray-400">AI-powered course management — tell the agent what to do</p>
      </div>
      <CanvasDashboard userId={session.user?.id ?? ""} userRole={session.user?.role ?? "USER"} />
    </div>
  );
}
