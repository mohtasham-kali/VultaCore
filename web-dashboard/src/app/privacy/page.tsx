import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — VultaCore",
  description: "Privacy policy describing how TechProgression collects, uses, and safeguards your personal data on VultaCore.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to VultaCore
          </Link>
          <h1 className="text-4xl font-extrabold mt-4 mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: November 18, 2026</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Overview</h2>
            <p>
              TechProgression (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates VultaCore (
              <a href="https://vultacore.techprogression.com" className="text-purple-400 hover:underline">
                vultacore.techprogression.com
              </a>
              ). We respect your privacy and are committed to protecting personal information collected through our developer platform and services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address, username, password hash, and authentication credentials.
              </li>
              <li>
                <strong>Usage and Telemetry:</strong> Log data, browser type, device information, API interaction counts, and IP address.
              </li>
              <li>
                <strong>Billing Data:</strong> Payment processing is handled by our Merchant of Record, Paddle.com. We do not store sensitive credit card numbers on our servers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. How We Use Information</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and optimize VultaCore tools and developer APIs.</li>
              <li>Authenticate user sessions and enforce subscription access tiers.</li>
              <li>Send critical system alerts, security advisories, and transactional billing notifications.</li>
              <li>Detect and prevent malicious activity, abuse, or security incidents.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Third-Party Processors &amp; Merchant of Record</h2>
            <p>
              We partner with trusted third-party providers including Paddle.com (Merchant of Record and payment gateway) and cloud infrastructure providers. Paddle processes your transaction data in compliance with PCI-DSS and applicable data privacy regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Your Data Rights (GDPR &amp; CCPA)</h2>
            <p>
              Depending on your location, you have the right to access, rectify, port, or request erasure of your personal data. You may also object to certain processing activities. To exercise these rights, email us at{" "}
              <a href="mailto:support@techprogression.com" className="text-purple-400 hover:underline">
                support@techprogression.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Security Measures</h2>
            <p>
              We implement industry-standard encryption, strict access controls, and continuous vulnerability scanning to protect your data in transit and at rest.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">7. Contact Information</h2>
            <p>
              For privacy-related inquiries or data requests:
              <br />
              <strong>TechProgression / VultaCore</strong>
              <br />
              Email:{" "}
              <a href="mailto:support@techprogression.com" className="text-purple-400 hover:underline">
                support@techprogression.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

