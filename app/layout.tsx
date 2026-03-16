import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chen's | Excellence in Every Detail",
  description: "Professional business services by Chen's",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="border-t border-gray-800 py-8 text-gray-500 text-sm mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} Chen&apos;s. All rights reserved.</p>
              <div className="flex items-center gap-5">
                <Link href="/sitemap" className="hover:text-gray-300 transition-colors">Sitemap</Link>
                <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Use</Link>
              </div>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
