"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search, ShieldPlus, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { startUpgrade } from "@/lib/payments";

import { API_BASE_URL } from "@/lib/constants";

interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
}

export default function SalesPOSTerminal() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("Standard");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpgrade = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await startUpgrade(selectedPlan, selectedUser.id, selectedUser.email);
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-4">
          <CreditCard className="w-10 h-10 text-purple-500" />
          Sales POS Terminal
        </h1>
        <p className="text-slate-400">Process manual subscriptions and Enterprise contracts on behalf of clients.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Step 1: Find User */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              1. Search Client
            </h3>
            <div className="relative mb-4">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or Email..." 
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none" 
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border",
                    selectedUser?.id === user.id ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20" : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                  )}
                >
                  <div className="font-bold text-sm">{user.username}</div>
                  <div className={cn("text-[10px]", selectedUser?.id === user.id ? "text-purple-100" : "text-slate-600")}>{user.email}</div>
                  <div className={cn("text-[10px] font-bold mt-2 uppercase tracking-widest", selectedUser?.id === user.id ? "text-white" : "text-purple-400")}>{user.rank}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Select Plan & Process */}
        <div className="space-y-6">
          <div className={cn(
            "bg-slate-900 border transition-all rounded-3xl p-8 sticky top-8",
            selectedUser ? "border-purple-500 shadow-2xl shadow-purple-500/10" : "border-white/5 opacity-40 pointer-events-none"
          )}>
            <h3 className="text-white font-bold mb-8 flex items-center gap-2">
              <ShieldPlus className="w-4 h-4 text-purple-400" />
              2. Finalize Subscription
            </h3>

            {selectedUser && (
              <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Client</div>
                <div className="text-white font-bold">{selectedUser.username}</div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Select Tier to Provision</label>
              <div className="grid grid-cols-2 gap-3">
                {["Standard", "Premium", "Enterprise"].map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "py-3 rounded-xl font-bold text-sm transition-all border",
                      selectedPlan === plan ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-slate-500 hover:text-white"
                    )}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-12 group"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                <>
                  Process Order
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
