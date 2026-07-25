"use client";

import { useState } from "react";
import { ChevronRight, ShieldCheck, Mail, Building2, Phone } from "lucide-react";

import { API_BASE_URL } from "@/lib/constants";

export default function EnterpriseContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    companyName: '', companySize: '', interest: '',
    phone: '', challenges: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/leads`,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20 animate-in zoom-in duration-500">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Request Received</h1>
        <p className="text-slate-400 text-lg mb-8">
          A VultaCore Enterprise Specialist will review your requirements and reach out via your work email within 24 hours.
        </p>
        <button 
          onClick={() => window.location.href = "/"}
          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl hover:bg-white/10 transition-all font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Side: Brand & Content */}
        <div className="space-y-8">
          <div>
            <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">VultaCore Enterprise</span>
            <h1 className="text-5xl font-extrabold text-white mt-4 leading-tight">
              Scale Your Security <br /> Without Limits
            </h1>
            <p className="text-slate-400 text-xl mt-6">
              Our enterprise partners receive dedicated infrastructure, 24/7 priority support, and bespoke AI training.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold">Custom Governance</h4>
                <p className="text-slate-500 text-sm">Fine-grained access controls and custom security policies for complex teams.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold">Dedicated Infrastructure</h4>
                <p className="text-slate-500 text-sm">Isolated instances with 99.99% SLA guarantees and global low-latency nodes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} type="text" placeholder="John" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} type="text" placeholder="Doe" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-purple-400">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@company.com" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                <input required name="companyName" value={formData.companyName} onChange={handleChange} type="text" placeholder="Acme Corp" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Size</label>
                <select required name="companySize" value={formData.companySize} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all">
                  <option value="">Select size</option>
                  <option value="1-50">1 - 50 employees</option>
                  <option value="51-200">51 - 200 employees</option>
                  <option value="201-1000">201 - 1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">What&apos;s your interest?</label>
              <select required name="interest" value={formData.interest} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all">
                <option value="">Select your area of interest</option>
                <option value="custom-ai">Custom AI Training & Deployment</option>
                <option value="security-suite">Security Operations Center (SOC) Upgrade</option>
                <option value="devops">Enterprise DevOps & Cloud Scaling</option>
                <option value="white-label">White-label & Redistribution</option>
                <option value="other">General Partnership Inquiry</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Needs & Challenges</label>
              <textarea required name="challenges" value={formData.challenges} onChange={handleChange} rows={4} placeholder="Tell us more about what you're looking to solve..." className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all resize-none"></textarea>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? "Submitting..." : "Submit Enterprise Inquiry"}
              {!isSubmitting && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
