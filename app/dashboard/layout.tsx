import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <main>{children}</main>
    </div>
  );
}
