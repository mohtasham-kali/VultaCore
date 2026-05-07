"use client";

import { Download, Monitor, Laptop, Terminal, Shield, Cpu } from "lucide-react";

const downloadOptions = [
  {
    platform: "Windows",
    version: "2.0.4",
    format: ".exe",
    icon: Monitor,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    url: "#",
    description: "Full desktop client with specialized security auditing tools."
  },
  {
    platform: "Linux",
    version: "2.0.4",
    format: ".deb",
    icon: Terminal,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    url: "#",
    description: "Debian/Ubuntu package optimized for core infrastructure tasks."
  },
  {
    platform: "macOS",
    version: "2.0.4 (Beta)",
    format: ".dmg",
    icon: Laptop,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    url: "#",
    description: "Apple Silicon & Intel support with high-performance ML core."
  }
];

export default function DownloadPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Download className="w-3 h-3" />
          VultaCore Desktop v2.0
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">
          Power at your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">fingertips.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Take the full VultaCore experience to your workstation. Local AI execution, deep security scanning, and low-latency infrastructure management.
        </p>
      </div>

      {/* Download Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {downloadOptions.map((opt) => (
          <div key={opt.platform} className={`p-8 rounded-3xl border ${opt.borderColor} ${opt.bgColor} backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
            
            <opt.icon className={`w-12 h-12 ${opt.color} mb-6`} />
            <h3 className="text-2xl font-bold text-white mb-2">{opt.platform}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Version {opt.version}
              </span>
              <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest">
                {opt.format}
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              {opt.description}
            </p>

            <button className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-2xl shadow-white/10">
              <Download className="w-4 h-4" />
              DOWNLOAD NOW
            </button>
          </div>
        ))}
      </div>

      {/* Guide Section */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-500" />
              Process Installation Guide
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">1</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Verify Checksum</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Always verify your download hash to ensure package integrity. High-security environments require SHA-256 verification.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">2</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Grant Permissions</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">VultaCore requires administrative privileges for deep network scanning and hardware optimization.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">3</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Sync Credentials</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Use your Supabase account to sync your AI agents, workspace preferences, and analytics dashboard across devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-3xl p-8 border border-white/10 font-mono text-xs space-y-6 shadow-3xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
              <span className="ml-4 text-slate-500 tracking-widest text-[10px]">TERMINAL — INSTALLATION</span>
            </div>
            
            <div className="space-y-4">
              {/* Linux Installation Steps */}
              <p className="text-blue-400">sudo dpkg -i vultacore-v2.0.4-linux.deb</p>
              <p className="text-emerald-400">vultacore --init --token=YOUR_JWT_SECRET</p>
              {/* Success Response */}
              <p className="text-slate-300">
                [SYSTEM] Initializing Infrastructure Core...<br />
                [SYSTEM] Connecting to Supabase Persistence Layer...<br />
                [SYSTEM] <span className="text-emerald-400 font-bold">READY</span> — Port :3001 occupied by background daemon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-12 pb-12">
        <div className="flex items-center gap-4 text-slate-500 text-sm italic">
          <Cpu className="w-5 h-5 text-indigo-500" />
          Minimum Requirement: 8GB RAM | Core i5+ | M1+
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Github Source</a>
          <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Documentation</a>
          <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-widest">Join Discord</a>
        </div>
      </div>
    </div>
  );
}
