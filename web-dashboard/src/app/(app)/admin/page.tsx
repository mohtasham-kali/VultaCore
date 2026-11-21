"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Activity,
  CreditCard,
  RefreshCw,
  Mail,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  totalLeads: number;
  totalRevenue: number;
  payingUsers: number;
}

interface ActivityItem {
  id: string;
  type: "user" | "lead" | "subscription";
  title: string;
  subtitle: string;
  timeAgo: string;
  timestamp: number;
}

const PLAN_RATES: Record<string, number> = {
  Standard: 29,
  Premium: 99,
  Enterprise: 299,
};

function formatTimeAgo(dateString?: string | number): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function AdminOverview() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLeads: 0,
    totalRevenue: 0,
    payingUsers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token;

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [usersRes, leadsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`${API_BASE_URL}/leads`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);

      const userList = Array.isArray(usersRes) ? usersRes : [];
      const leadList = Array.isArray(leadsRes) ? leadsRes : [];

      const paying = userList.filter(
        (u) => u.rank && u.rank !== "Free" && u.rank !== "Level 1"
      ).length;

      const revenue = userList.reduce((acc: number, u: { rank?: string }) => {
        return acc + (PLAN_RATES[u.rank || ""] || 0);
      }, 0);

      setStats({
        totalUsers: userList.length,
        totalLeads: leadList.length,
        totalRevenue: revenue,
        payingUsers: paying,
      });

      // Construct live activity stream from real user accounts and inquiries
      const activities: ActivityItem[] = [];

      // Add recent leads
      leadList.forEach((lead: any) => {
        activities.push({
          id: `lead-${lead.id}`,
          type: "lead",
          title: `New enterprise inquiry from ${lead.companyName || lead.firstName}`,
          subtitle: `${lead.email} · Interested in ${lead.interest || "Platform"}`,
          timeAgo: formatTimeAgo(lead.createdAt),
          timestamp: lead.createdAt ? new Date(lead.createdAt).getTime() : 0,
        });
      });

      // Add recent user accounts
      userList.forEach((user: any) => {
        const isPaid = user.rank && user.rank !== "Free" && user.rank !== "Level 1";
        activities.push({
          id: `user-${user.id}`,
          type: isPaid ? "subscription" : "user",
          title: isPaid
            ? `${user.rank} tier subscription active`
            : `User account registered: ${user.username}`,
          subtitle: `${user.email}`,
          timeAgo: formatTimeAgo(user.createdAt || Date.now() - 3600000),
          timestamp: user.createdAt ? new Date(user.createdAt).getTime() : 0,
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 6));
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const paidRatio =
    stats.totalUsers > 0
      ? Math.round((stats.payingUsers / stats.totalUsers) * 100)
      : 0;

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-slate-500 mt-2 font-medium italic">
            VultaCore Platform Real-Time Intelligence Overlay
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Sync
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              Live Real-Time
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-purple-500/20 transition-all rounded-bl-3xl">
            <Users className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Total Accounts
          </div>
          <div className="text-5xl font-black text-white mb-2">{stats.totalUsers}</div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            {stats.payingUsers} paying subscriber{stats.payingUsers === 1 ? "" : "s"} ({paidRatio}%)
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-blue-500/20 transition-all rounded-bl-3xl">
            <Target className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Sales Leads Pipeline
          </div>
          <div className="text-5xl font-black text-white mb-2">{stats.totalLeads}</div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            Active Enterprise Inquiries
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:bg-amber-500/20 transition-all rounded-bl-3xl">
            <DollarSign className="w-16 h-16" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Active Monthly Recurring Revenue
          </div>
          <div className="text-5xl font-black text-white mb-2">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Estimated Contract Run-Rate
          </div>
        </div>
      </div>

      {/* Quick Actions & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Live Activity Stream
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Database Sync
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-500 text-sm italic py-6 text-center">
                Fetching latest platform events...
              </p>
            ) : recentActivities.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-6 text-center">
                No recent activity recorded yet.
              </p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        act.type === "subscription"
                          ? "bg-emerald-400"
                          : act.type === "lead"
                          ? "bg-blue-400"
                          : "bg-purple-400"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{act.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {act.timeAgo}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Administrative Hub</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/subscriptions"
                className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-purple-500 transition-all group"
              >
                <CreditCard className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mb-4 transition-colors" />
                <div className="text-sm font-bold text-white">Subscription Monitor</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  Track Tiers &amp; MRR
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-blue-500 transition-all group"
              >
                <Users className="w-6 h-6 text-slate-500 group-hover:text-blue-400 mb-4 transition-colors" />
                <div className="text-sm font-bold text-white">Accounts Matrix</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  Manage Tiers &amp; Roles
                </div>
              </Link>
              <Link
                href="/admin/leads"
                className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-emerald-500 transition-all group"
              >
                <Target className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 mb-4 transition-colors" />
                <div className="text-sm font-bold text-white">Sales Pipeline</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  Enterprise Leads
                </div>
              </Link>
              <Link
                href="/admin/system-health"
                className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-amber-500 transition-all group"
              >
                <Activity className="w-6 h-6 text-slate-500 group-hover:text-amber-400 mb-4 transition-colors" />
                <div className="text-sm font-bold text-white">System Telemetry</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  Engine Health &amp; Logs
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
