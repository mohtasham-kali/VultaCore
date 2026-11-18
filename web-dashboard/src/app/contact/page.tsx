import Link from "next/link";
import { Mail, MapPin, Globe, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Contact Us — VultaCore",
  description: "Get in touch with the VultaCore and TechProgression team for support, enterprise sales, or security inquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to VultaCore
          </Link>
          <h1 className="text-4xl font-extrabold mt-4 mb-2 tracking-tight">Contact Us</h1>
          <p className="text-slate-400 text-sm">
            Have questions about VultaCore, subscriptions, or enterprise deployments? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">General &amp; Billing Support</h3>
            <p className="text-slate-400 text-sm">
              For account issues, subscription questions, receipt requests, and technical support.
            </p>
            <div>
              <a
                href="mailto:support@techprogression.com"
                className="text-purple-400 hover:text-purple-300 font-medium text-sm hover:underline"
              >
                support@techprogression.com
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Enterprise &amp; Security</h3>
            <p className="text-slate-400 text-sm">
              Custom integrations, dedicated SLA agreements, and security vulnerability disclosures.
            </p>
            <div>
              <a
                href="mailto:mohtisham@techprogression.com"
                className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
              >
                mohtisham@techprogression.com
              </a>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-6">
          <h2 className="text-xl font-bold text-white">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <strong>Legal Entity:</strong>
                <p className="text-slate-400">TechProgression · VultaCore</p>
                <p className="text-slate-400">Website: vultacore.techprogression.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <strong>Merchant of Record &amp; Payments:</strong>
                <p className="text-slate-400">Paddle.com Inc. / Paddle Payments Ltd.</p>
                <p className="text-slate-400">Buyer Portal: paddle.net</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

