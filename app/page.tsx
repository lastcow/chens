import Link from "next/link";
import Image from "next/image";
import HeroSceneWrapper from "@/components/HeroSceneWrapper";

const services = [
  { icon: "feature_security", label: "⚡", title: "Security", desc: "Enterprise-grade security solutions protecting your business assets 24/7." },
  { icon: "feature_analytics", label: "📊", title: "Analytics", desc: "Deep data insights and intelligence to drive smarter business decisions." },
  { icon: "feature_cloud", label: "🌐", title: "Cloud", desc: "Scalable cloud infrastructure built for reliability and performance." },
  { icon: "feature_support", label: "🛡️", title: "Support", desc: "Dedicated 24/7 expert support whenever your business needs it." },
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

      {/* Services */}
      <section id="services" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comprehensive solutions designed to elevate your business to the next level.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className="card hover:border-amber-500/40 transition-all group overflow-hidden">
              <div className="relative h-36 mb-4 rounded-lg overflow-hidden bg-gray-800">
                <Image
                  src={`/api/images/${s.icon}`}
                  alt={s.title}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  unoptimized
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
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
