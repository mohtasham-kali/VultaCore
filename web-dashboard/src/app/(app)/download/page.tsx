"use client";

import { useState, useEffect } from "react";
import { Download, Monitor, Laptop, Terminal, Shield, Cpu, Apple, Package } from "lucide-react";

const GH_BASE = "https://github.com/mohtasham-kali/VultaCore/releases/latest/download";

const downloadOptions = [
  {
    platform: "Windows",
    arch: "x86_64",
    version: "0.1.0",
    format: "NSIS Installer (.exe)",
    icon: Monitor,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    filename: "VultaCore_0.1.0_x64-setup.exe",
    description: "Interactive NSIS installer for Windows 10/11. Supports custom installation path.",
    installCmd: "winget install VultaCore",
    hint: "Double-click the installer and follow the setup wizard."
  },
  {
    platform: "macOS",
    arch: "Universal",
    version: "0.1.0",
    format: "Disk Image (.dmg)",
    icon: Apple,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    filename: "VultaCore_0.1.0_universal.dmg",
    description: "Universal binary for both Apple Silicon (M1/M2/M3) and Intel Macs.",
    installCmd: "brew install --cask vultacore",
    hint: "Open the DMG, drag VultaCore to Applications, then open it."
  },
  {
    platform: "macOS",
    arch: "Universal",
    version: "0.1.0",
    format: "Package Installer (.pkg)",
    icon: Package,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    filename: "VultaCore_0.1.0_universal.pkg",
    description: "macOS PKG installer — useful for enterprise MDM and silent deployments.",
    installCmd: "brew install --cask vultacore",
    hint: "Right-click → Open to bypass Gatekeeper on first launch."
  },
  {
    platform: "Linux",
    arch: "x86_64",
    version: "0.1.0",
    format: "AppImage (Portable)",
    icon: Terminal,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    filename: "VultaCore_0.1.0_amd64.AppImage",
    description: "Portable AppImage for any Linux distro. No installation, root or package manager required.",
    installCmd: "chmod +x VultaCore_0.1.0_amd64.AppImage && ./VultaCore_0.1.0_amd64.AppImage",
    hint: "Make it executable with chmod +x then run it directly."
  },
  {
    platform: "Linux (Debian / Ubuntu)",
    arch: "amd64",
    version: "0.1.0",
    format: "Package (.deb)",
    icon: Terminal,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    filename: "VultaCore_0.1.0_amd64.deb",
    description: "Debian package for Ubuntu, Debian, Pop!_OS, and Mint.",
    installCmd: "sudo apt install ./VultaCore_0.1.0_amd64.deb",
    hint: "Use 'apt install' (not 'dpkg -i') so dependencies resolve automatically."
  },
  {
    platform: "Linux (Fedora / RHEL)",
    arch: "x86_64",
    version: "0.1.0",
    format: "Package (.rpm)",
    icon: Terminal,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    filename: "VultaCore-0.1.0-1.x86_64.rpm",
    description: "RPM package for Fedora, RHEL, CentOS Stream, and openSUSE.",
    installCmd: "sudo dnf install ./VultaCore-0.1.0-1.x86_64.rpm",
    hint: "Use dnf (or yum on older systems) to handle dependencies automatically."
  }
];

function useDetectedPlatform() {
  const [detected, setDetected] = useState<string | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) setDetected("Windows");
    else if (ua.includes("mac")) setDetected("macOS");
    else if (ua.includes("linux")) setDetected("Linux");
  }, []);
  return detected;
}

export default function DownloadPage() {
  const detectedPlatform = useDetectedPlatform();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCmd = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Download className="w-3 h-3" />
          VultaCore Desktop v0.1.0
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">
          Power at your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">fingertips.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Take the full VultaCore experience to your workstation. Local AI execution, deep security scanning, and low-latency infrastructure management.
        </p>
        {detectedPlatform && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold">
            <Cpu className="w-4 h-4" />
            Detected: {detectedPlatform} — recommended download highlighted below
          </div>
        )}
      </div>

      {/* Download Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {downloadOptions.map((opt) => {
          const isRecommended = detectedPlatform && opt.platform.startsWith(detectedPlatform);
          const downloadUrl = `${GH_BASE}/${opt.filename}`;

          return (
            <div
              key={opt.filename}
              className={`relative flex flex-col p-7 rounded-3xl border ${opt.borderColor} ${opt.bgColor} backdrop-blur-md group hover:scale-[1.02] transition-all duration-500 ${isRecommended ? "ring-2 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.12)]" : ""}`}
            >
              {isRecommended && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Recommended
                </div>
              )}

              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

              <opt.icon className={`w-10 h-10 ${opt.color} mb-5`} />
              <h3 className="text-xl font-bold text-white mb-1">{opt.platform}</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest">
                  v{opt.version}
                </span>
                <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest">
                  {opt.arch}
                </span>
                <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                  {opt.format}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-3 leading-relaxed flex-1">{opt.description}</p>
              <p className="text-slate-500 text-xs mb-5 italic">{opt.hint}</p>

              <a
                href={downloadUrl}
                download
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isRecommended
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                    : "bg-white hover:bg-slate-200 text-slate-950 shadow-white/10"
                }`}
              >
                <Download className="w-4 h-4" />
                DOWNLOAD {opt.format.split("(")[0].trim().toUpperCase()}
              </a>

              {/* Quick install command */}
              <button
                onClick={() => copyCmd(opt.installCmd, opt.filename)}
                className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[11px] font-mono transition-all truncate px-3"
                title={opt.installCmd}
              >
                {copiedId === opt.filename ? "✓ Copied!" : opt.installCmd}
              </button>
            </div>
          );
        })}
      </div>

      {/* Installation Guide */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-500" />
              Installation Guide
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">1</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Download for your platform</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Pick the installer above. Your platform is auto-detected and highlighted in green.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">2</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Install using the right command</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    On Linux: use <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400">sudo apt install ./VultaCore_*.deb</code> (not dpkg -i) or <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400">sudo dnf install ./VultaCore-*.rpm</code> to auto-resolve dependencies.
                    On macOS: open the DMG and drag to Applications.
                    On Windows: run the .exe installer as administrator.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-bold text-white border border-white/10">3</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Log in and sync your account</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Use your VultaCore account to sync AI agents, workspace preferences, and analytics across devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-3xl p-8 border border-white/10 font-mono text-xs space-y-5 shadow-3xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
              <span className="ml-4 text-slate-500 tracking-widest text-[10px]">TERMINAL — INSTALLATION</span>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-slate-500"># Debian / Ubuntu — use apt (resolves deps)</p>
                <p className="text-blue-400">wget {GH_BASE}/VultaCore_0.1.0_amd64.deb</p>
                <p className="text-blue-400">sudo apt install ./VultaCore_0.1.0_amd64.deb</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500"># Fedora / RHEL / CentOS</p>
                <p className="text-blue-400">wget {GH_BASE}/VultaCore-0.1.0-1.x86_64.rpm</p>
                <p className="text-blue-400">sudo dnf install ./VultaCore-0.1.0-1.x86_64.rpm</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500"># Linux AppImage (no install needed)</p>
                <p className="text-blue-400">chmod +x VultaCore_0.1.0_amd64.AppImage</p>
                <p className="text-blue-400">./VultaCore_0.1.0_amd64.AppImage</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500"># macOS (Homebrew)</p>
                <p className="text-blue-400">brew install --cask vultacore</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500"># Windows (Winget)</p>
                <p className="text-blue-400">winget install VultaCore</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 pb-4">
        <div className="flex items-center gap-4 text-slate-500 text-sm italic">
          <Cpu className="w-5 h-5 text-indigo-500" />
          Minimum: 8 GB RAM · Core i5+ / M1+ · 500 MB disk space
        </div>
        <div className="flex gap-8">
          <a
            href="https://github.com/mohtasham-kali/VultaCore/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            All Releases
          </a>
          <a
            href="https://github.com/mohtasham-kali/VultaCore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            GitHub Source
          </a>
          <a href="/enterprise-contact" className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-widest">
            Enterprise
          </a>
        </div>
      </div>
    </div>
  );
}
