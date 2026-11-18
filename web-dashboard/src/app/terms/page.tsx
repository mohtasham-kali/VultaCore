import Link from "next/link";

export const metadata = {
  title: "Terms of Service — VultaCore",
  description: "Terms and conditions governing the use of the VultaCore developer and cybersecurity platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to VultaCore
          </Link>
          <h1 className="text-4xl font-extrabold mt-4 mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: November 18, 2026</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using VultaCore (a product of TechProgression, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), available at{" "}
              <a href="https://vultacore.techprogression.com" className="text-purple-400 hover:underline">
                vultacore.techprogression.com
              </a>
              , you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
            <p>
              VultaCore provides developer productivity tools, cybersecurity threat intelligence, collaborative developer forums, and AI-assisted workflows. Services are provided through tiered subscription plans (Free, Standard, Premium, Enterprise).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Accounts and Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at{" "}
              <a href="mailto:support@techprogression.com" className="text-purple-400 hover:underline">
                support@techprogression.com
              </a>{" "}
              upon discovering any unauthorized use or security breach.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Subscriptions, Billing & Merchant of Record</h2>
            <p>
              Our order process is conducted by our online reseller and Merchant of Record, Paddle.com (Paddle). Paddle handles customer service inquiries, taxes, and returns. When placing an order, you agree to Paddle&apos;s checkout terms and conditions.
            </p>
            <p>
              Paid plans are billed on a recurring monthly or annual basis unless cancelled prior to the end of the current billing cycle. Pricing details are published on our{" "}
              <Link href="/pricing" className="text-purple-400 hover:underline">
                Pricing page
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Cancellation and Refunds</h2>
            <p>
              You may cancel your subscription at any time via your account settings or customer portal. For complete details regarding eligibility and refund requests, please review our{" "}
              <Link href="/refund" className="text-purple-400 hover:underline">
                Refund &amp; Cancellation Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Prohibited Activities</h2>
            <p>
              You agree not to use VultaCore tools or threat intelligence for any unlawful activities, unauthorized penetration testing, malicious attacks against third parties, or distribution of malware. Violations will result in immediate account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, TechProgression and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">8. Contact Information</h2>
            <p>
              For questions regarding these Terms of Service, contact us at:
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

