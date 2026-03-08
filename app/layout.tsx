import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";

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
          <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm mt-16">
            <p>© {new Date().getFullYear()} Chen&apos;s. All rights reserved.</p>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
