import Link from "next/link";
import { Check, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Pricing Plans — VultaCore",
  description: "Transparent, predictable pricing for developers and security professionals. Standard, Premium, and Enterprise tiers.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring the platform and participating in developer discussions.",
    features: [
      "Community Forum Access",
      "Basic AI Chat (5 queries / day)",
      "Public Analytics & Leaderboards",
      "Standard Community Support",
    ],
    buttonText: "Get Started Free",
    buttonHref: "/auth",
    highlight: false,
    gradient: "from-slate-700 to-slate-800",
  },
  {
    name: "Standard",
    price: "$29",
    period: "per month",
    description: "Designed for active developers who need automated code assistance and deep analytics.",
    features: [
      "Priority Developer Forum Support",
      "Pro AI Engine (Gemini & Mistral)",
      "Personal Real-Time Analytics",
      "REST & WebSocket API Access",
      "Unlimited Daily Inquiries",
    ],
    buttonText: "Start with Standard",
    buttonHref: "/subscription",
    highlight: true,
    badge: "Most Popular",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    name: "Premium",
    price: "$99",
    period: "per month",
    description: "Full-scale cyber threat intelligence and advanced LLM reasoning for security researchers.",
    features: [
      "Private Cybersecurity Hub",
      "Claude 3 & Llama 3 Security Models",
      "Real-Time Vulnerability Feeds",
      "High-Rate-Limit API Access",
      "Advanced Bot Automation Suite",
      "Priority Email & Slack Support",
    ],
    buttonText: "Go Premium",
    buttonHref: "/subscription",
    highlight: false,
    gradient: "from-amber-500 to-rose-500",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual billing",
    description: "Tailored infrastructure, dedicated security tooling, and SLA guarantees for enterprise teams.",
    features: [
      "Dedicated Private AI Instance",
      "Custom Data Governance & On-Prem Options",
      "Guaranteed 99.9% Uptime SLA",
      "Dedicated Account Manager & 24/7 Phone Support",
      "Custom Vendor Security Audits",
    ],
    buttonText: "Contact Enterprise Sales",
    buttonHref: "mailto:sales@techprogression.com?subject=Enterprise%20Plan%20Inquiry%20-%20VultaCore&body=Hi%20TechProgression%20Sales%20Team%2C%0A%0AI%20would%20like%20to%20inquire%20about%20the%20VultaCore%20Enterprise%20Plan.%0A%0APlease%20contact%20me%20to%20discuss%20custom%20pricing%20and%20onboarding.%0A%0AThank%20you%21",
    highlight: false,
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-700/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-700/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to VultaCore
          </Link>
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Predictable Pricing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">High-Performance</span> Teams
          </h1>
          <p className="text-slate-400 text-lg">
            Choose the plan that fits your workflow. Cancel anytime with our 14-day money-back guarantee.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col p-8 rounded-2xl bg-white/5 border ${
                plan.highlight ? "border-purple-500/60 shadow-2xl shadow-purple-500/10" : "border-white/10"
              } transition-all duration-300 hover:-translate-y-1`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm min-h-[40px]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-2">/ {plan.period}</span>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature, fi) => (
                  <div key={fi} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.buttonHref}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-center text-sm transition-all ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>

        {/* Security & Merchant of Record Note */}
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center items-center gap-2 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-semibold text-white">Merchant of Record &amp; Secure Checkout</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            All transactions and payments are securely handled by our online reseller and Merchant of Record,{" "}
            <strong className="text-white">Paddle.com</strong>. We support Credit/Debit Cards, PayPal, Apple Pay, and Google Pay with full 256-bit SSL encryption.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-purple-400 underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-purple-400 underline">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-purple-400 underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
