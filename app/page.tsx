import Link from "next/link";
import Image from "next/image";
import HeroSceneWrapper from "@/components/HeroSceneWrapper";
import { ClipboardList, Wand2, BarChart3, AlertTriangle } from "lucide-react";

const canvasFeatures = [
  { Icon: ClipboardList, color: "text-amber-400", bg: "bg-amber-500/10", label: "Course & Student Sync", desc: "Automatically sync all your Canvas courses, student rosters, and enrollment data in real time. Always up to date, zero manual work." },
  { Icon: Wand2, color: "text-purple-400", bg: "bg-purple-500/10", label: "AI-Powered Grading", desc: "Let AI grade assignments and quizzes for you. Grades are staged for your review before posting — you stay in full control of every score." },
  { Icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10", label: "Grade Management", desc: "Review, edit, and approve AI-generated grades with late penalty automation. Post directly to Canvas with one click." },
  { Icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "At-Risk Identification", desc: "Automatically flag students at risk based on missing assignments, low attendance, and grade trends — before it's too late to intervene." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Three.js network scene */}
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

      {/* Services — Canvas LMS */}
      <section id="services" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-sm mb-4">
            Featured Module
          </div>
          <h2 className="text-4xl font-bold mb-4">Canvas LMS Integration</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform your teaching workflow. Sync, grade, and analyze your courses — all powered by AI.
          </p>
        </div>

        {/* Hero card */}
        <div className="card hover:border-amber-500/40 transition-all group overflow-hidden mb-8">
          <div className="relative h-64 rounded-lg overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)" }}>
            {/* Decorative grid lines */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            {/* Floating icons */}
            <div className="absolute inset-0 flex items-center justify-center gap-8">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-amber-400" />
              </div>
              <div className="w-16 h-16 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                <Wand2 className="w-8 h-8 text-purple-400" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-blue-400" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
            <div className="absolute bottom-4 left-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Canvas LMS</span>
              <p className="text-white font-bold text-xl mt-0.5">Intelligent Course Management</p>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed text-sm max-w-3xl">
            A complete academic operations suite built on top of Canvas. Sync your courses automatically, grade with AI, identify struggling students early, and manage everything from one clean dashboard — without ever leaving the platform you already use.
          </p>
          <div className="mt-5">
            <Link href="/canvas" className="btn-primary inline-block text-sm px-5 py-2">
              Explore Canvas LMS →
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canvasFeatures.map((f) => (
            <div key={f.label} className="card hover:border-amber-500/30 transition-all">
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                <f.Icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{f.label}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
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
              <Image
                src="/api/images/about"
                alt="About Chen's"
                fill
                className="object-cover"
                unoptimized
              />
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
