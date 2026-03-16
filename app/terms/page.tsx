export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Use</h1>
        <p className="text-gray-500 text-sm">Last updated: March 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          By accessing or using Chen&apos;s platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. Permitted Use</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Our services are intended for use by authorized educational professionals (instructors, professors) for the purpose of managing courses, students, and academic grading. You agree to use the platform only for lawful educational purposes and in accordance with your institution&apos;s policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Account Responsibilities</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          You are responsible for maintaining the confidentiality of your account credentials and Canvas API tokens. You agree to notify us immediately of any unauthorized access to your account. We are not liable for any loss resulting from unauthorized use of your credentials.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. AI-Assisted Grading</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          AI grading features are provided as a tool to assist instructors — not to replace professional judgment. All AI-generated grades are staged for instructor review before being posted. You remain solely responsible for the accuracy and fairness of grades submitted to Canvas.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Credits and Payments</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Module access and AI grading credits are purchased through our platform. Credits are consumed upon initiating grade requests and are non-refundable except as described in our refund policy. Unused credits at account cancellation are non-transferable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Intellectual Property</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          The Chen&apos;s platform, including its software, design, and content, is owned by Chen&apos;s and protected by applicable intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the platform without written permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Limitation of Liability</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Chen&apos;s is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to grading errors, data loss, or service interruptions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Termination</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          We reserve the right to suspend or terminate accounts that violate these terms, misuse the platform, or engage in fraudulent activity. You may cancel your account at any time through the Profile settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Changes to Terms</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          We may update these Terms of Use from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify users of material changes via email.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">10. Contact</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          For questions about these Terms of Use, contact us at{" "}
          <a href="mailto:support@chen.me" className="text-amber-400 hover:text-amber-300 transition-colors">
            support@chen.me
          </a>.
        </p>
      </section>
    </div>
  );
}
