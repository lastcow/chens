import Link from "next/link";
import Image from "next/image";
import HeroSceneWrapper from "@/components/HeroSceneWrapper";
import {
  ClipboardList, Wand2, BarChart3, AlertTriangle,
  Building2, Package, CreditCard, Warehouse,
  ArrowDownToLine, ArrowUpFromLine, FileText, Truck,
  GraduationCap, ChevronRight,
} from "lucide-react";

const canvasFeatures = [
  { Icon: ClipboardList, color: "text-amber-400",  bg: "bg-amber-500/10",  label: "Course & Student Sync",   desc: "Automatically sync all your Canvas courses, student rosters, and enrollment data in real time." },
  { Icon: Wand2,         color: "text-purple-400", bg: "bg-purple-500/10", label: "AI-Powered Grading",      desc: "Let AI grade assignments for you. Grades are staged for your review — you stay in full control." },
  { Icon: BarChart3,     color: "text-blue-400",   bg: "bg-blue-500/10",   label: "Grade Management",        desc: "Review, approve, and post AI-generated grades with late penalty automation. One click to Canvas." },
  { Icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/10",    label: "At-Risk Identification",  desc: "Flag students at risk based on missing assignments, attendance, and grade trends before it's too late." },
];

const msbizFeatures = [
  { Icon: Package,           color: "text-amber-400",  bg: "bg-amber-500/10",  label: "Order Management",        desc: "Track every Microsoft order with PM deadline visibility, status updates, and exception alerts." },
  { Icon: CreditCard,        color: "text-blue-400",   bg: "bg-blue-500/10",   label: "Price Match Workflow",    desc: "Submit and track price matches with auto-deadline calculation from order date." },
  { Icon: Warehouse,         color: "text-purple-400", bg: "bg-purple-500/10", label: "Warehouse & Inventory",   desc: "Manage warehouses, log inbound receiving, and track outbound shipments with auto inventory sync." },
  { Icon: FileText,          color: "text-green-400",  bg: "bg-green-500/10",  label: "Invoices + QuickBooks",   desc: "Create invoices and push them directly to QuickBooks Online. Sync payment status automatically." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <HeroSceneWrapper />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none" />
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-sm mb-6">
            Professional Business Services
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Excellence in
            <span className="text-amber-400"> Every Detail</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Chen&apos;s delivers world-class solutions tailored to your business needs.
            Trusted expertise. Proven results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">Get Started Today</Link>
            <Link href="/#services" className="btn-secondary">Our Services</Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-4 max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-block border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-sm mb-4">
            Platform Modules
          </div>
          <h2 className="text-4xl font-bold mb-4">Built for Modern Operations</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Two purpose-built modules covering education management and B2B reseller operations — each designed to eliminate manual work.
          </p>
        </div>

        {/* Module cards side-by-side summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

          {/* Canvas LMS card */}
          <div className="group relative card hover:border-amber-500/40 transition-all overflow-hidden flex flex-col">
            {/* Gradient header */}
            <div className="relative h-48 rounded-lg overflow-hidden mb-5 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)" }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="absolute inset-0 flex items-center justify-center gap-6">
                {[ClipboardList, Wand2, BarChart3, AlertTriangle].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-amber-300" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-white font-bold text-base">Canvas LMS</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed flex-1">
              A complete academic operations suite. Sync courses, grade with AI, identify at-risk students, and post grades — all from one dashboard. Built for professors who want more time teaching.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {["AI Grading", "Grade Sync", "At-Risk"].map(tag => (
                  <span key={tag} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <Link href="/canvas" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors whitespace-nowrap ml-3">
                Explore <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* MS Business card */}
          <div className="group relative card hover:border-blue-500/30 transition-all overflow-hidden flex flex-col">
            {/* Gradient header */}
            <div className="relative h-48 rounded-lg overflow-hidden mb-5 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0c1a2e 0%, #0f2d1a 40%, #0d1b2e 100%)" }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="absolute inset-0 flex items-center justify-center gap-6">
                {[Package, CreditCard, Warehouse, Truck].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-300" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-white font-bold text-base">MS Business</span>
                <span className="text-[10px] bg-gray-700/80 text-gray-400 border border-gray-600/50 px-2 py-0.5 rounded-full ml-1">Invite Only</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed flex-1">
              A full B2B operations platform for Microsoft marketplace resellers. Manage orders, price matches, warehouse inventory, invoices, and QuickBooks sync — invite-only for authorized partners.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {["Price Match", "QuickBooks", "Tracking"].map(tag => (
                  <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <Link href="/dashboard" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors whitespace-nowrap ml-3">
                Request Access <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Canvas LMS feature grid */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Canvas LMS — Key Features</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {canvasFeatures.map((f) => (
              <div key={f.label} className="card hover:border-amber-500/30 transition-all">
                <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                  <f.Icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MS Business feature grid */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">MS Business — Key Features</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {msbizFeatures.map((f) => (
              <div key={f.label} className="card hover:border-blue-500/20 transition-all">
                <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                  <f.Icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">About Chen&apos;s</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Placeholder about section. Describe your business, mission, and values here.
              What makes Chen&apos;s unique? What is your background and expertise?
            </p>
            <p className="text-gray-400 leading-relaxed mb-8">
              Add your story, team information, years of experience, and any certifications
              or achievements that build trust with potential clients.
            </p>
            <Link href="/register" className="btn-primary inline-block">Work With Us</Link>
          </div>
          <div className="space-y-6">
            <div className="relative h-64 rounded-xl overflow-hidden">
              <Image src="/api/images/about" alt="About Chen's" fill className="object-cover" unoptimized />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[["10+", "Years Experience"], ["500+", "Clients Served"], ["99%", "Satisfaction Rate"], ["24/7", "Support"]].map(([num, label]) => (
                <div key={label} className="card text-center">
                  <div className="text-3xl font-bold text-amber-400 mb-1">{num}</div>
                  <div className="text-gray-400 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center card border-amber-500/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Contact us today to discuss how Chen&apos;s can help achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">Create Account</Link>
            <a href="mailto:contact@chens.com" className="btn-secondary">Contact Us</a>
          </div>
        </div>
      </section>
    </>
  );
}
