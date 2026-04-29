"use client";

import { Search, Plus } from "lucide-react";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { UserDropdown } from "../auth/UserDropdown";
import { useState } from "react";

export function Header() {
  const [search, setSearch] = useState("");

  return (
    <header className="h-20 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 px-8 hidden lg:flex items-center justify-between sticky top-0 z-[40]">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search VultaCore infrastructure..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] text-slate-500 font-bold">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] text-slate-500 font-bold">K</kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Quick Action
        </button>

        <div className="w-px h-6 bg-white/10" />

        <NotificationCenter />

        <div className="w-px h-6 bg-white/10" />

        <UserDropdown />
      </div>
    </header>
  );
}
