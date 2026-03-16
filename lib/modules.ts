export type ModuleDef = {
  id: string;
  label: string;
  icon: string;
  description: string;
  features: string[];
};

export const ALL_MODULES: ModuleDef[] = [
  {
    id: "canvas_lms",
    label: "Canvas LMS",
    icon: "🎓",
    description:
      "Integrate your Canvas Learning Management System account to manage courses, students, assignments, and grades directly from this platform.",
    features: [
      "Course & student roster sync",
      "Assignment tracking and grading",
      "Grade management with late penalty automation",
      "At-risk student identification",
      "AI-powered grading assistant",
    ],
  },
  {
    id: "msbiz",
    label: "MS Business",
    icon: "🏢",
    description:
      "B2B operations platform for Microsoft marketplace resellers. Manage orders, price matches, warehouse inventory, inbound/outbound shipments, invoices, and QuickBooks sync.",
    features: [
      "Order management with PM deadline tracking",
      "Price match submission & approval workflow",
      "Warehouse & inventory ledger",
      "Inbound / outbound shipment logging",
      "QuickBooks Online invoice sync",
      "EasyPost multi-carrier tracking",
      "Exception management & cost analytics",
    ],
  },
];
