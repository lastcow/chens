import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPricing from "@/components/admin/AdminPricing";

export default async function AdminPricingPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  if ((session.user as { role?: string })?.role !== "ADMIN") redirect("/unauthorized");
  return <AdminPricing />;
}
