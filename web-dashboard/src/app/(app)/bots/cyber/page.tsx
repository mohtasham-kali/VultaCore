"use client";

import { ShieldAlert, Lock, FileSearch, Eye, Terminal, Upload, File, X as CloseIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { fetchBots, executeBot, fetchBotHistory } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Bot {
  id: string;
  name: string;
  type: string;
  category?: string;
}

interface BotResult {
  response: string;
  confidence: number;
  forBot: string;
}

export default function CyberBotsPage() {
  const { user } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{id?: string, role: string, content: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBots() {
      try {
        const data = await fetchBots();
        if (Array.isArray(data)) {
          setBots(data.filter((b: Bot) => b.type === 'cyber'));
        }
      } catch (e) {
        console.error("Failed to load bots", e);
      }
    }
    loadBots();
  }, []);

  // Load conversation history when a bot is selected
  useEffect(() => {
    async function loadHistory() {
      if (selectedBot && user?.id) {
        try {
          const history = await fetchBotHistory(selectedBot.id, user.id);
          setChatHistory(history);
        } catch (e) {
          console.error("Failed to load history", e);
        }
      } else {
        setChatHistory([]);
      }
    }
    loadHistory();
  }, [selectedBot, user?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, executing]);

  const handleLaunch = async () => {
    if (!selectedBot || !userPrompt.trim() || !user?.id) return;
    setExecuting(selectedBot.id);
    
    // Optimistically add user prompt to UI
    const currentPrompt = userPrompt;
    setChatHistory(prev => [...prev, { role: 'user', content: currentPrompt }]);
    setUserPrompt(""); // Clear input area
    
    try {
      let fileContext = "";
      if (selectedFile) {
        fileContext = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(selectedFile);
        });
      }
      const data = await executeBot(selectedBot.id, currentPrompt, user.id, fileContext);
      
      // Add response to UI
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || JSON.stringify(data)
      }]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: Failed to fetch response." }]);
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
    setChatHistory([]);
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
              bots.reduce((acc: Record<string, Bot[]>, bot: Bot) => {
                const category = bot.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(bot);
                return acc;
              }, {})
            ).map(([category, items]: [string, Bot[]]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((bot: Bot, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => { setSelectedBot(bot); setSelectedFile(null); }}
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

                <div className="flex-1 flex flex-col h-full space-y-6">
                  {/* Chat History Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[400px]">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <Terminal className="w-12 h-12 text-slate-600 mb-4" />
                        <h4 className="text-slate-400 font-bold">Secure Environment Ready</h4>
                        <p className="text-slate-500 text-sm mt-1">Start by describing your task below.</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 ${
                            msg.role === 'user' 
                              ? 'bg-red-600/20 border border-red-500/30 text-red-100 rounded-tr-sm' 
                              : 'bg-slate-800/50 border border-white/5 text-slate-300 rounded-tl-sm'
                          }`}>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2 text-red-400">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">{selectedBot.name}</span>
                              </div>
                            )}
                            <div className="prose prose-sm prose-invert max-w-none font-mono text-sm whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Mechanism */}
                  <div className="space-y-4 pt-4 border-t border-white/5 bg-slate-900/50">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Code / URL</label>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-600 font-mono hidden sm:inline-block">MD SUPPORTED</span>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                            >
                              <Upload className="w-3 h-3" /> <span className="hidden sm:inline">Attach Code</span>
                            </button>
                          </div>
                       </div>
                       
                       <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                       
                       <div className="relative flex items-end gap-2 bg-slate-950/50 border border-white/10 rounded-xl p-2 focus-within:border-red-500/50 transition-colors shadow-inner">
                          <div className="flex-1 min-h-[50px] relative">
                             {selectedFile && (
                                <div className="absolute top-2 left-2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded py-1 px-2 z-10 animate-in fade-in duration-200 text-xs">
                                  <File className="w-3 h-3 text-emerald-400" />
                                  <span className="text-slate-300 truncate max-w-[120px]">{selectedFile.name}</span>
                                  <CloseIcon className="w-3 h-3 text-slate-400 hover:text-red-400 cursor-pointer ml-1" onClick={() => setSelectedFile(null)} />
                                </div>
                             )}
                             <textarea 
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleLaunch();
                                  }
                                }}
                                placeholder={selectedFile ? "\n\n\nAdd instructions..." : "Input target for analysis... (Enter to send, Shift+Enter for new line)"}
                                className="w-full h-[80px] bg-transparent text-slate-300 font-mono text-sm outline-none resize-none px-2 py-2 placeholder:text-slate-600 custom-scrollbar"
                             />
                          </div>
                          <button 
                            onClick={handleLaunch}
                            disabled={!userPrompt.trim() || !!executing}
                            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 shadow-md shadow-red-500/20"
                          >
                            <Terminal className="w-5 h-5 ml-0.5" />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
