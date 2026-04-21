"use client";

import { User, LogOut, Mail, Award, Shield } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4 p-1">
           <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
             <span className="text-2xl font-bold text-white">JD</span>
           </div>
        </div>
        <h1 className="text-2xl font-bold text-white">John Doe</h1>
        <p className="text-slate-400 mb-6">Full Stack Developer & Security Enthusiast</p>

        <div className="flex gap-4 w-full justify-center border-t border-white/5 pt-6">
          <div className="text-center px-6">
            <div className="text-xl font-bold text-white">1,250</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Points</div>
          </div>
          <div className="text-center px-6 border-l border-white/5">
            <div className="text-xl font-bold text-white">45</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Posts</div>
          </div>
          <div className="text-center px-6 border-l border-white/5">
            <div className="text-xl font-bold text-white">Level 5</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Rank</div>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
        
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50">
          <Mail className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm text-slate-400">Email Address</p>
            <p className="text-slate-200">john.doe@example.com</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50">
          <Shield className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm text-slate-400">Role</p>
            <p className="text-slate-200">Premium Member</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50">
          <Award className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm text-slate-400">Badges</p>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">Top Contributor</span>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Bug Hunter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 border border-red-500/20">
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}
