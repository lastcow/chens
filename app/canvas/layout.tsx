import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";
import { TermProvider } from "@/components/canvas/TermProvider";

export default async function CanvasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <TermProvider>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Canvas LMS Snapshot</h1>
          <p className="text-gray-500 text-sm mt-1">Course management</p>
        </div>
        <div className="flex gap-6">
          <CanvasSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </TermProvider>
  );
}
