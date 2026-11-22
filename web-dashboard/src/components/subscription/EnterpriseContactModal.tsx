"use client";

import { useState } from "react";
import { X, CheckCircle2, Shield, Loader2, Sparkles, Building, Mail, User, Phone, Check } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EnterpriseContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userId?: string;
}

const ENTERPRISE_FEATURES = [
  { key: "sla_guarantees", label: "SLA Guarantees (99.9% Uptime)" },
  { key: "dedicated_ai_instance", label: "Dedicated Private AI Instance" },
  { key: "white_label", label: "White-label & Custom Domain Options" },
  { key: "phone_support_24_7", label: "24/7 Phone & Private Slack Support" },
  { key: "private_security_hub", label: "Private Security Hub & Threat Scanning" },
  { key: "advanced_threat_intel", label: "Advanced Threat Intelligence Feeds" },
  { key: "unlimited_api", label: "Unlimited High-Throughput API Access" },
];

export function EnterpriseContactModal({
  isOpen,
  onClose,
  userEmail = "",
  userId = "",
}: EnterpriseContactModalProps) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState("");
  const [numberOfUsers, setNumberOfUsers] = useState("11-50");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "sla_guarantees",
    "dedicated_ai_instance",
    "phone_support_24_7",
  ]);
  const [expectedUsage, setExpectedUsage] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !companyName || !email) {
      setError("Please fill out your Name, Company Name, and Business Email.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/enterprise/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          companyName,
          email,
          phone,
          numberOfUsers,
          requestedFeatures: selectedFeatures,
          expectedUsage,
          customRequirements,
          additionalMessage,
          userId: userId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit enterprise inquiry.");
      }

      const data = await res.json();
      setSubmittedRef(data.reference || "ENT-SUCCESS");
    } catch (err: any) {
      console.error("Enterprise Inquiry error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedRef ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Inquiry Received</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your custom Enterprise proposal is being prepared by our solutions team.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 max-w-sm mx-auto">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Reference Code
              </div>
              <div className="text-xl font-mono font-bold text-purple-400 mt-1">
                {submittedRef}
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A dedicated enterprise architect will reach out to <strong>{email}</strong> within 1 business day with your custom contract and dedicated provisioning setup.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Enterprise Custom Plan
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Contact Enterprise Sales
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Tailored security infrastructure, dedicated private AI models, custom SLAs, and custom vendor agreements.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Cybersecurity Corp"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimated Team Size
                </label>
                <select
                  value={numberOfUsers}
                  onChange={(e) => setNumberOfUsers(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:border-purple-500 outline-none"
                >
                  <option value="1-10">1 – 10 developers / researchers</option>
                  <option value="11-50">11 – 50 developers / researchers</option>
                  <option value="51-200">51 – 200 developers / researchers</option>
                  <option value="200+">200+ Enterprise seats</option>
                </select>
              </div>
            </div>

            {/* Requested Enterprise Features Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Requested Enterprise Features
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ENTERPRISE_FEATURES.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.key);
                  return (
                    <button
                      type="button"
                      key={feat.key}
                      onClick={() => toggleFeature(feat.key)}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all",
                        isChecked
                          ? "bg-purple-500/10 border-purple-500/40 text-white font-medium"
                          : "bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/15",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          isChecked
                            ? "bg-purple-500 border-purple-500 text-white"
                            : "border-white/20 bg-slate-900",
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Custom Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Custom Requirements or Architecture Needs (Optional)
              </label>
              <textarea
                rows={3}
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="e.g. On-premise deployment, specific HIPAA/SOC2 compliance, private model weights..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 active:scale-95 text-white font-semibold text-sm shadow-xl shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

