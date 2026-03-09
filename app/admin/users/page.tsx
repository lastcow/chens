import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminUsersList from "@/components/admin/AdminUsersList";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/signin");

  return <AdminUsersList />;
}
