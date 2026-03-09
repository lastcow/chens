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
];
