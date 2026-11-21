"use client";

import { useState, useEffect, useMemo } from "react";
import { CreditCard, TrendingUp, Users, Activity, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
}

const PLAN_RATES: Record<string, number> = {
  Standard: 29,
  Premium: 99,
  Enterprise: 299, // default baseline for Enterprise contracts
  Free: 0,
};

export default function AdminSubscriptionsPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");

  const token = session?.access_token;

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Subscription monitor error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const totalUsers = users.length;
  const premiumUsers = users.filter((u) => u.rank === "Premium").length;
  const standardUsers = users.filter((u) => u.rank === "Standard").length;
  const enterpriseUsers = users.filter((u) => u.rank === "Enterprise").length;
  const payingUsers = premiumUsers + standardUsers + enterpriseUsers;

  const mrr = users.reduce((acc, u) => {
    return acc + (PLAN_RATES[u.rank] || 0);
  }, 0);

  const conversionRate = totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 100) : 0;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Enterprise":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Premium":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "Standard":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = filterPlan === "ALL" || (u.rank || "Free") === filterPlan;
      return matchesSearch && matchesPlan;
    });
  }, [users, search, filterPlan]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-500" />
            Subscription Monitor
          </h1>
          <p className="text-slate-400 mt-2">
            Real-time platform subscriptions, recurring revenue, and tier distribution.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">
            Active MRR
          </p>
          <div className="text-4xl font-black text-white">${mrr.toLocaleString()}</div>
          <div className="text-xs text-green-400 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {conversionRate}% paid conversion
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">
            Enterprise Tier
          </p>
          <div className="text-4xl font-black text-white">{enterpriseUsers}</div>
          <p className="text-xs text-slate-400 mt-2">Custom corporate contracts</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">
            Premium Tier
          </p>
          <div className="text-4xl font-black text-white">{premiumUsers}</div>
          <p className="text-xs text-slate-400 mt-2">$99/mo subscribers</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">
            Standard Tier
          </p>
          <div className="text-4xl font-black text-white">{standardUsers}</div>
          <p className="text-xs text-slate-400 mt-2">$29/mo subscribers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          All Subscribers ({filteredUsers.length})
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/5 p-1 rounded-xl text-xs">
            {["ALL", "Enterprise", "Premium", "Standard", "Free"].map((plan) => (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all",
                  filterPlan === plan
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {plan}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriber..."
              className="bg-slate-900 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-purple-500 outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Subscriber
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Active Plan
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Monthly Value
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                  Syncing subscription datastores...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                  No subscribers match the current filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const plan = user.rank || "Free";
                const isPaid = plan !== "Free";
                const monthlyValue = PLAN_RATES[plan] || 0;

                return (
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
                      <span
                        className={cn(
                          "px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border",
                          getRankColor(plan)
                        )}
                      >
                        {plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">
                        {monthlyValue > 0 ? `$${monthlyValue}/mo` : "$0"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPaid ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Active Subscription
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                          Free Account
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
