import Link from "next/link";

const services = [
  { icon: "⚡", title: "Service One", desc: "Placeholder description for your first core service offering." },
  { icon: "🛡️", title: "Service Two", desc: "Placeholder description for your second core service offering." },
  { icon: "📊", title: "Service Three", desc: "Placeholder description for your third core service offering." },
  { icon: "🌐", title: "Service Four", desc: "Placeholder description for your fourth core service offering." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
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
            <Link href="/register" className="btn-primary">
              Get Started Today
            </Link>
            <Link href="/#services" className="btn-secondary">
              Our Services
            </Link>
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
            <div key={s.title} className="card hover:border-amber-500/40 transition-colors group">
              <div className="text-4xl mb-4">{s.icon}</div>
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
            <Link href="/register" className="btn-primary inline-block">
              Work With Us
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[["10+", "Years Experience"], ["500+", "Clients Served"], ["99%", "Satisfaction Rate"], ["24/7", "Support"]].map(([num, label]) => (
              <div key={label} className="card text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">{num}</div>
                <div className="text-gray-400 text-sm">{label}</div>
              </div>
            ))}
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
