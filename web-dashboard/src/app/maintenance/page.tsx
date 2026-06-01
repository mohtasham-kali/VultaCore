"use client";

import { AlertTriangle } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">System Maintenance</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          VultaCore is currently undergoing scheduled maintenance. We are working hard to improve your experience and will be back online shortly!
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          Check Again
        </button>
      </div>
    </div>
  );
}
