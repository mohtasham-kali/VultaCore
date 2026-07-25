"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

import { API_BASE_URL } from "@/lib/constants";

interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
  points: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(`${API_BASE_URL}/users`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Backend timed out — it may still be starting up.' : err.message);
        setUsers([]);
        setLoading(false);
      })
      .finally(() => clearTimeout(timeout));
  };

  useEffect(() => { loadUsers(); }, []);


  const handleUpdateRank = async (userId: string, newRank: string) => {
    try {
      await fetch(`${API_BASE_URL}/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newRank }),
      });
      // Refresh list
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank: newRank } : u));
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Found {users.length} registered accounts across the platform.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input type="text" placeholder="Search VultaCore ID..." className="bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none w-64" />
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User Identity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Account Tier</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Rewards Pt</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 text-sm">Loading accounts…</span>
                </div>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <span className="text-red-400 text-xl">⚠</span>
                  </div>
                  <p className="text-red-400 font-semibold text-sm">Backend unavailable</p>
                  <p className="text-slate-500 text-xs max-w-xs">{error}</p>
                  <button onClick={loadUsers} className="mt-1 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-all">
                    Retry
                  </button>
                </div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-slate-500 text-sm">No users found.</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.username}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={user.rank} 
                    onChange={(e) => handleUpdateRank(user.id, e.target.value)}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full outline-none bg-slate-950 border border-white/5",
                      user.rank === "Enterprise" ? "text-blue-400" :
                      user.rank === "Premium" ? "text-purple-400" :
                      user.rank === "Standard" ? "text-emerald-400" : "text-slate-500"
                    )}
                  >
                    <option value="Free">Free</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-white">{user.points}</span>
                  <span className="text-[10px] text-slate-500 ml-1">VCT</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
