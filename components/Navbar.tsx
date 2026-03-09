"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const navLink = (href: string, label: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-sm transition-colors ${
          active
            ? "text-amber-400 font-medium"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-amber-400 tracking-wider">
            CHEN&apos;S
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm">Services</Link>
            <Link href="/#about" className="text-gray-400 hover:text-white transition-colors text-sm">About</Link>
            <Link href="/#contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</Link>

            {session ? (
              <div className="flex items-center gap-4">
                {role === "ADMIN" && navLink("/admin", "Admin")}
                {navLink("/dashboard", "Dashboard")}
                {navLink("/canvas", "Canvas LMS")}
                {navLink("/profile", "Profile", true)}
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/signin" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
