"use client";

import { User, LogOut, Mail, Award, Shield, Loader2, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { fetchAnalytics } from "@/lib/api";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user?.id) return;
      try {
        const data = await fetchAnalytics(user.id);
        setStats(data);
      } catch (e) {
        console.error("Failed to load profile stats", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <User className="w-16 h-16 text-slate-800 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Not Signed In</h2>
        <p className="text-slate-500">Please sign in to view your profile.</p>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Card */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 transition-opacity" />
        
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 mb-4 p-1 shadow-2xl group-hover:scale-105 transition-transform duration-500">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full rounded-full border-4 border-slate-950 object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-white tracking-widest">{initials}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-1">{fullName}</h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">VultaCore Infrastructure Member</p>

        <div className="flex gap-4 w-full justify-center border-t border-white/5 pt-8 relative z-10">
          <div className="text-center px-8">
            <div className="text-2xl font-black text-white">{stats?.total_points || 0}</div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Points</div>
          </div>
          <div className="text-center px-8 border-l border-white/5">
            <div className="text-2xl font-black text-white">{stats?.activityLog?.length || 0}</div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Actions</div>
          </div>
          <div className="text-center px-8 border-l border-white/5">
            <div className="text-2xl font-black text-white">{stats?.rank_estimate || "L1"}</div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Rank</div>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-6 group hover:bg-slate-900/80 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Email Identity</p>
            <p className="text-slate-200 font-medium">{user.email}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-6 group hover:bg-slate-900/80 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Account Role</p>
            <p className="text-slate-200 font-medium">Standard Authorized User</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 group hover:bg-slate-900/80 transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Verified Badges</p>
               <div className="flex gap-2">
                 <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">Newbie</span>
                 {stats?.total_points > 100 && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">Active Contributor</span>}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button 
        onClick={() => signOut()}
        className="w-full py-4 rounded-2xl bg-red-500/5 text-red-500 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 border border-red-500/10 active:scale-95 group"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        TERMINATE SESSION
      </button>
    </div>
  );
}

