import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminUsersList from "@/components/admin/AdminUsersList";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  if ((session.user as { role?: string })?.role !== "ADMIN") redirect("/unauthorized");

  return <AdminUsersList />;
}
