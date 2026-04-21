"use client";

import { Monitor, Bell, BrainCircuit } from "lucide-react";
import { useSettings } from "@/providers/SettingsProvider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { chartType, setChartType, activeModel, setActiveModel, apiKeys, updateAPIKey } = useSettings();

  const aiProviders = [
    { 
      id: "gemini-pro", 
      name: "Google Gemini Pro", 
      icon: "✨", 
      color: "from-blue-500 to-emerald-400",
      description: "Enterprise-grade multimodal reasoning. Pre-configured for high-speed data processing.",
    },
    { 
      id: "claude-3-haiku", 
      name: "Anthropic Claude 3", 
      icon: "🎭", 
      color: "from-orange-400 to-rose-500",
      description: "Optimized for complex coding tasks and natural language understanding.",
    },
    { 
      id: "mixtral-8x7b", 
      name: "Mistral AI (Mixtral 8x7B)", 
      icon: "🌪️", 
      color: "from-orange-500 to-amber-600",
      description: "SOTA open-source model optimized for debugging and logic solving.",
    },
    { 
      id: "llama-3-3", 
      name: "Meta Llama 3.3 70B", 
      icon: "🦙", 
      color: "from-indigo-500 to-purple-600",
      description: "Industrial-strength security analysis and threat intelligence.",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Manage your AI architecture and application display visuals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Nav for Settings */}
        <div className="lg:col-span-1 space-y-4">
          <nav className="flex flex-col gap-1">
            {["AI Hub Permissions", "Notifications", "Analytics"].map((item, i) => (
              <button 
                key={i}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all",
                  i === 0 ? "bg-white/5 text-white border border-white/10" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Model Selection */}
          <section className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 lg:p-8 space-y-8 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Engine Activation</h3>
                  <p className="text-xs text-slate-500">Managed intelligence providers for your enterprise.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enterprise API Enabled</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {aiProviders.map((provider) => (
                <div 
                  key={provider.id}
                  onClick={() => setActiveModel(provider.id as any)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer relative group",
                    activeModel === provider.id 
                      ? "bg-white/5 border-purple-500/50 shadow-2xl shadow-purple-500/10" 
                      : "bg-transparent border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
                      "bg-gradient-to-br", provider.color
                    )}>
                      {provider.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-200">{provider.name}</h4>
                        <div className="flex gap-2">
                           {activeModel === provider.id && (
                            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">Active</span>
                          )}
                          <span className="text-[9px] font-bold bg-white/5 text-slate-500 px-2 py-1 rounded-md border border-white/5">Managed</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{provider.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics Display */}
          <section className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Monitor className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Interface Customization</h3>
                <p className="text-xs text-slate-500">Tailor the dashboard visuals to your needs.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Default Dashboard Chart</label>
              <select 
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-emerald-500/50 transition-all"
              >
                <option value="pie">Pie Chart (Distribution)</option>
                <option value="bar">Bar Chart (Comparison)</option>
                <option value="line">Line Chart (Trend Line)</option>
              </select>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4">
            <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all text-sm font-medium">
              Reset to Defaults
            </button>
            <button className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
