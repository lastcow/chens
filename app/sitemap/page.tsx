import Link from "next/link";

const sections = [
  {
    title: "Marketing",
    links: [
      { href: "/", label: "Home" },
      { href: "/#services", label: "Services" },
      { href: "/#about", label: "About" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signin", label: "Sign In" },
      { href: "/register", label: "Register" },
      { href: "/dashboard", label: "Modules" },
      { href: "/profile", label: "Profile" },
      { href: "/profile/credits", label: "Credits" },
      { href: "/profile/purchases", label: "Purchases" },
    ],
  },
  {
    title: "Canvas LMS",
    links: [
      { href: "/canvas/overview", label: "Overview" },
      { href: "/canvas/students", label: "Students" },
      { href: "/canvas/assignments", label: "Assignments" },
      { href: "/canvas/grades", label: "Grades" },
      { href: "/canvas/atrisk", label: "At-Risk Students" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/sitemap", label: "Sitemap" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Sitemap</h1>
        <p className="text-gray-500 text-sm">All pages available on Chen&apos;s platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-amber-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
