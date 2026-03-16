export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: March 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          We collect information you provide when creating an account, including your name, email address, and institutional credentials. When you connect a Canvas LMS account, we store an encrypted API token to access course, student, and grade data on your behalf.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Your information is used solely to provide the services you have purchased — including Canvas LMS integration, AI-assisted grading, and student analytics. We do not sell, rent, or share your personal information with third parties except as necessary to operate the platform (e.g., payment processing via Stripe).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Canvas Data</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Canvas course data, student records, assignments, and submissions are synced to our database solely for the purpose of providing dashboard and grading features to you as the course instructor. Student data is treated as confidential and is never used for advertising or shared with other users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. AI Grading</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          When you request AI-assisted grading, anonymized submission content is sent to a third-party AI provider (Anthropic) for processing. Submissions are not stored by the AI provider beyond the immediate API request. All AI grades are staged for your review before being posted to Canvas.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data Security</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          API tokens are encrypted using AES-256-GCM before storage. All data is transmitted over HTTPS. We use industry-standard security practices to protect your information from unauthorized access.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Data Retention</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          Your data is retained for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Canvas data is refreshed on each sync and older records may be overwritten.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Contact</h2>
        <p className="text-gray-400 leading-relaxed text-sm">
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:support@chen.me" className="text-amber-400 hover:text-amber-300 transition-colors">
            support@chen.me
          </a>.
        </p>
      </section>
    </div>
  );
}
