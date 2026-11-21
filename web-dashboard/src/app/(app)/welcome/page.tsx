import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, Bot, MessageSquare, CreditCard } from "lucide-react";

export const metadata = {
  title: "Welcome to VultaCore — Subscription Confirmed",
  description: "Thank you for subscribing to VultaCore. Your new features and capabilities are now ready.",
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white flex items-center justify-center p-6">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[35%] h-[35%] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[35%] h-[35%] bg-blue-700/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Payment Confirmed
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">VultaCore</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Your subscription has been processed and activated. Your account tier, enhanced AI engines, and
            cybersecurity tools are now unlocked.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <Link
            href="/bots/cyber"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
          >
            <Bot className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">AI Cyber Bots</h4>
            <p className="text-xs text-slate-400 mt-1">Start reasoning with Claude 3 &amp; Gemini Pro.</p>
          </Link>

          <Link
            href="/forum/dev"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
          >
            <MessageSquare className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Dev Forums</h4>
            <p className="text-xs text-slate-400 mt-1">Collaborate with the developer community.</p>
          </Link>

          <Link
            href="/subscription"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
          >
            <CreditCard className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Subscription</h4>
            <p className="text-xs text-slate-400 mt-1">View billing details and invoices.</p>
          </Link>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all text-sm"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4 border-t border-white/5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Billed securely via Paddle.com (Merchant of Record)</span>
        </div>
      </div>
    </div>
  );
}

