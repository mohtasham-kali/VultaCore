"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PaymentModal } from "@/components/pricing/PaymentModal";

const MOCK_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    description: "Perfect for exploring the platform",
    features: ["Community Forum Access", "Basic AI Chat (5/day)", "Public Analytics", "Standard Support"],
    buttonText: "Current Plan",
    highlight: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: "29",
    description: "Best for active developers",
    features: ["Priority Forum Support", "Pro AI Engine (Gemini)", "Personal Analytics", "API Access"],
    buttonText: "Upgrade to Standard",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "99",
    description: "For security professionals",
    features: ["Private Security Hub", "Claude 3 & Llama 3 AI", "Advanced Threat Intel", "Unlimited API Calls"],
    buttonText: "Go Premium",
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions for teams",
    features: ["SLA Guarantees", "Dedicated AI Instance", "White-label Options", "24/7 Phone Support"],
    buttonText: "Contact Sales",
    highlight: false,
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("Free");

  // Fetch current plan from backend
  useEffect(() => {
    const fetchRank = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users/${user.id}`);
        if (!res.ok) throw new Error("Backend unreachable");
        
        // Check if there is even content to parse
        const text = await res.text();
        if (!text) return;
        
        const data = JSON.parse(text);
        if (data && data.rank) {
          setCurrentPlan(data.rank);
        }
      } catch (err) {
        console.error("Error fetching user rank:", err);
      }
    };
    
    fetchRank();
  }, [user, isModalOpen]);

  const handleUpgrade = (plan: any) => {
    if (plan.id === "enterprise") {
      window.location.href = "/enterprise-contact";
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          // Force a fresh fetch of the user data
          if (user?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users/${user.id}`)
              .then(res => res.json())
              .then(data => {
                if (data && data.rank) setCurrentPlan(data.rank);
              });
          }
        }} 
        planName={selectedPlan?.name || ""} 
        planPrice={selectedPlan?.price ? `$${selectedPlan.price}` : ""} 
        userId={user?.id}
      />
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Power Level</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Scale your development and security capabilities with our precision-engineered tiers.
        </p>

        {/* Payment Methods Info */}
        <div className="pt-4 flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            Credit Card
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
             <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-3 w-auto grayscale invert" alt="Google Pay" />
             Google Pay
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-3 w-auto grayscale" alt="PayPal" />
            PayPal
          </div>
        </div>
      </div>

      {!user?.id && (
        <div className="mb-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
          <p className="text-blue-400 text-sm font-medium">
            You are viewing plans as a guest. Please <a href="/login" className="underline font-bold">log in</a> to upgrade your account.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MOCK_PLANS.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02]",
              plan.highlight 
                ? "bg-slate-900 border-purple-500/50 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20" 
                : "bg-slate-900/50 border-white/10 hover:border-white/20"
            )}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                {plan.id !== "enterprise" && <span className="text-slate-500 font-medium">/mo</span>}
              </div>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade(plan)}
              disabled={loading !== null || (plan.name === currentPlan)}
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                plan.highlight || plan.name === currentPlan
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl shadow-purple-500/20 hover:opacity-90" 
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
              )}
            >
              {plan.name === currentPlan ? "Current Plan" : plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
