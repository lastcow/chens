import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminMerchandise from "@/components/admin/AdminMerchandise";

export default async function MerchandisePage() {
  const session = await auth();
  if (!session) redirect("/signin");
  if ((session.user as { role?: string })?.role !== "ADMIN") redirect("/unauthorized");
  return <AdminMerchandise />;
}
