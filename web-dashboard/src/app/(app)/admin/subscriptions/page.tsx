"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Users, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.rank === "Premium").length;
  const standardUsers = users.filter(u => u.rank === "Standard").length;
  const enterpriseUsers = users.filter(u => u.rank === "Enterprise").length;
  
  const mrr = (premiumUsers * 29.99) + (standardUsers * 9.99) + (enterpriseUsers * 99.99);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Enterprise": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Premium": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "Standard": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-purple-500" />
          Subscription Monitor
        </h1>
        <p className="text-slate-400 mt-2">Active platform subscriptions, revenue, and tier distribution.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <p className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">Estimated MRR</p>
          <div className="text-4xl font-black text-white">${mrr.toFixed(2)}</div>
          <div className="text-xs text-green-400 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% this month
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <p className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">Enterprise</p>
          <div className="text-4xl font-black text-white">{enterpriseUsers}</div>
          <p className="text-xs text-slate-400 mt-2">Active corporate accounts</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <p className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">Premium</p>
          <div className="text-4xl font-black text-white">{premiumUsers}</div>
          <p className="text-xs text-slate-400 mt-2">High tier subscribers</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <p className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">Standard</p>
          <div className="text-4xl font-black text-white">{standardUsers}</div>
          <p className="text-xs text-slate-400 mt-2">Base tier subscribers</p>
        </div>
      </div>

      {/* Subscription List */}
      <h2 className="text-xl font-bold text-white mt-12 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-slate-400" />
        All Subscribers
      </h2>
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Subscriber</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Active Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={3} className="p-12 text-center text-slate-500 italic">Syncing subscription datastores...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.username}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border",
                    getRankColor(user.rank)
                  )}>
                    {user.rank || 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    Active
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
