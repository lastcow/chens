import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminModules from "@/components/admin/AdminModules";

export default async function AdminModulesPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  if ((session.user as { role?: string })?.role !== "ADMIN") redirect("/unauthorized");

  return <AdminModules />;
}
