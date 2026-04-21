"use client";

import { ShieldAlert, Lock, FileSearch, Eye, Loader2, Play, Terminal, Upload, File, X as CloseIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { fetchBots, executeBot } from "@/lib/api";

export default function CyberBotsPage() {
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBots() {
      try {
        const data = await fetchBots();
        if (Array.isArray(data)) {
          setBots(data.filter((b: any) => b.type === 'cyber'));
        }
      } catch (e) {
        console.error("Failed to load bots", e);
      }
    }
    loadBots();
  }, []);

  const handleLaunch = async () => {
    if (!selectedBot || !userPrompt.trim()) return;
    setExecuting(selectedBot.id);
    setResult(null);
    try {
      let fileContext = "";
      if (selectedFile) {
        fileContext = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(selectedFile);
        });
      }
      const data = await executeBot(selectedBot.id, userPrompt, fileContext);
      setResult({ ...data, forBot: selectedBot.name });
    } catch (e) {
      console.error(e);
    } finally {
      setExecuting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedBot(null);
    setResult(null);
    setSelectedFile(null);
    setUserPrompt("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Cyber Security Hub
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </h1>
        <p className="text-slate-400">Advanced AI security agents powered by Python FastAPI microservices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-6">
            {Object.entries(
              bots.reduce((acc: any, bot) => {
                const category = bot.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(bot);
                return acc;
              }, {})
            ).map(([category, items]: [string, any]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((bot: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => { setSelectedBot(bot); setResult(null); setSelectedFile(null); }}
                      className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${
                        selectedBot?.id === bot.id 
                          ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-500/10' 
                          : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selectedBot?.id === bot.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        }`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-bold text-xs truncate ${selectedBot?.id === bot.id ? 'text-red-400' : 'text-slate-200'}`}>
                            {bot.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">Status: Classified</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col relative group">
            {executing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 rounded-2xl flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-t-2 border-red-500 animate-spin" />
                  <Lock className="w-8 h-8 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-1">Running Security Audit</p>
                  <p className="text-slate-500 text-[10px]">Accessing Restricted AI Core...</p>
                </div>
              </div>
            )}

            {!selectedBot ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <FileSearch className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Initiate Security Protocol</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Select a specialized cyber security agent to perform penetration testing or vulnerability analysis.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-400 uppercase tracking-tighter">SECURE SESSION: {selectedBot.name}</span>
                  </div>
                  <button 
                    onClick={clearSelection}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    Terminate Session
                  </button>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Code / URL / Description</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors uppercase tracking-widest bg-red-500/5 px-2.5 py-1 rounded-md border border-red-500/20"
                        >
                          <Upload className="w-3 h-3" />
                          Upload Evidence
                        </button>
                        <span className="text-[10px] text-red-600 font-mono flex items-center gap-1">
                          <Lock className="w-2 h-2" /> ENCRYPTED
                        </span>
                      </div>
                      <input 
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    <div className="relative group/textarea">
                      <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Input the target snippet or system description for audit..."
                        className="w-full h-40 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-300 font-mono text-sm outline-none focus:border-red-500/50 transition-all resize-none placeholder:text-slate-800"
                      />

                      {/* File Attachment Feedback */}
                      {selectedFile && (
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-slate-950/90 border border-red-500/30 rounded-lg px-4 py-2 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-1.5 rounded-md bg-red-500/10">
                              <File className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <span className="text-xs text-slate-300 truncate font-mono">{selectedFile.name}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedFile(null)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleLaunch}
                      disabled={!userPrompt.trim() || !!executing}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-sm shadow-xl shadow-red-500/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                    >
                      <Terminal className="w-4 h-4" />
                      INITIALIZE AUDIT
                    </button>
                  </div>

                  {result && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Eye className="w-4 h-4" />
                          <span className="font-bold uppercase tracking-wider text-[10px]">Audit Findings Detected</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[9px] bg-slate-900/50 px-2 py-1 rounded text-slate-500 border border-white/5 uppercase font-mono">
                            CONF: {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <p className="text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-line border-l-2 border-emerald-500/30 pl-4">
                          {result.response}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
