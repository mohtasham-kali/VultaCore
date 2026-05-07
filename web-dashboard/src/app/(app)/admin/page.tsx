"use client";

import { useState, useEffect } from "react";
import { Users, Target, TrendingUp, DollarSign, ArrowUpRight, Activity, CreditCard } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalLeads: number;
  totalRevenue: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalLeads: 0, totalRevenue: 0 });

  useEffect(() => {
    // Parallel fetches for efficiency
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/leads`).then(res => res.json())
    ]).then(([users, leads]) => {
      setStats({
        totalUsers: users.length,
        totalLeads: leads.length,
        // Mock revenue logic: 29 per standard, 99 per premium
        totalRevenue: users.reduce((acc: number, u: { rank?: string }) => {
          if (u.rank === "Standard") return acc + 29;
          if (u.rank === "Premium") return acc + 99;
          return acc;
        }, 0)
      });
    });
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-slate-500 mt-2 font-medium italic">VultaCore Platform Intelligence Overlay</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-purple-500/20 transition-all rounded-bl-3xl">
            <Users className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Total Users</div>
          <div className="text-5xl font-black text-white mb-2">{stats.totalUsers}</div>
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3" />
            Active Population
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-blue-500/20 transition-all rounded-bl-3xl">
            <Target className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Inquiry Pipeline</div>
          <div className="text-5xl font-black text-white mb-2">{stats.totalLeads}</div>
          <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold">
            <Activity className="w-3 h-3" />
            Lead Generation
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-amber-500/20 transition-all rounded-bl-3xl">
            <DollarSign className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Estimated MRR</div>
          <div className="text-5xl font-black text-white mb-2">${stats.totalRevenue}</div>
          <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold">
            <ArrowUpRight className="w-3 h-3" />
            Monthly Recurring Revenue
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-slate-300">New user registered via Google</span>
              </div>
              <span className="text-[10px] text-slate-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm text-slate-300">Standard subscription activated</span>
              </div>
              <span className="text-[10px] text-slate-500">14 minutes ago</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all">
          <h3 className="text-xl font-bold text-white mb-6">Quick Shortcuts</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/pos" className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-purple-500 transition-all group">
              <CreditCard className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mb-4 transition-colors" />
              <div className="text-sm font-bold text-white">Manual POS</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Process Contracts</div>
            </Link>
            <Link href="/admin/users" className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-blue-500 transition-all group">
              <Users className="w-6 h-6 text-slate-500 group-hover:text-blue-400 mb-4 transition-colors" />
              <div className="text-sm font-bold text-white">User Matrix</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Manage Accounts</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
