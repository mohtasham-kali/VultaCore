"use client";

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false }) as ComponentType<any>;
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false }) as ComponentType<any>;
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false }) as ComponentType<any>;
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false }) as ComponentType<any>;
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false }) as ComponentType<any>;
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false }) as ComponentType<any>;
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false }) as ComponentType<any>;
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false }) as ComponentType<any>;
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false }) as ComponentType<any>;

import { BarChart as LucideBarChart, Activity, CheckCircle, Zap, Loader2, RefreshCw } from "lucide-react";
import { useSettings } from '@/providers/SettingsProvider';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { fetchAnalytics } from '@/lib/api';
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ActivityLogEntry {
  type: 'post' | 'comment';
  title: string;
  date: string;
  points: number;
}

interface AnalyticsStats {
  total_points: number;
  rank_estimate: string;
  engagement_score: number;
  completion_rate?: number;
  activityLog?: ActivityLogEntry[];
  temporalData?: { name: string; value: number }[];
}

export default function AnalyticsPage() {
  const { chartType } = useSettings();
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (isManual = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (isManual) setRefreshing(true);
    try {
      const data = await fetchAnalytics(user.id);
      setStats(data);
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Real-time socket sync: refresh analytics when posts or activities occur
  useEffect(() => {
    if (!user?.id) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("subscribeToUserEvents", user.id);
    });

    socket.on("activityLogged", () => {
      loadStats();
    });

    socket.on("subscriptionUpdated", () => {
      loadStats();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, loadStats]);

  const chartData = stats?.temporalData || [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
  ];

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              itemStyle={{ color: 'white' }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              itemStyle={{ color: 'white' }}
            />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} />
          </LineChart>
        );
      default:
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              itemStyle={{ color: 'white' }}
            />
            <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 3 }} />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Performance Analytics
            <LucideBarChart className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-slate-400">
            Real-time activity telemetry, points breakdown, and performance analytics.
          </p>
        </div>

        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          Sync Analytics
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Points", value: stats?.total_points?.toLocaleString() || "0", icon: Activity, color: "text-purple-400" },
          { label: "Rank Tier", value: stats?.rank_estimate || "Recruit", icon: CheckCircle, color: "text-emerald-400" },
          { label: "Engagement", value: `${stats?.engagement_score ?? 0}%`, icon: Zap, color: "text-amber-400" },
          { label: "Completion", value: `${stats?.completion_rate ?? 100}%`, icon: LucideBarChart, color: "text-blue-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Points & Usage Chart */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 uppercase text-xs tracking-widest opacity-50">
            7-Day Activity Telemetry ({chartType.toUpperCase()})
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl h-[400px] overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-white mb-4">Live Activity Log</h3>
          <div className="space-y-4">
            {stats?.activityLog?.map((action: ActivityLogEntry, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/5",
                  action.type === 'post' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                )}>
                  {action.type === 'post' ? 'P' : 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">
                    {action.type === 'post' ? `Created post: ${action.title}` : action.title}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{new Date(action.date).toLocaleString()}</p>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-md border shrink-0",
                  action.type === 'post' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                )}>
                  +{action.points} pts
                </span>
              </div>
            ))}
            {(!stats?.activityLog || stats.activityLog.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50 py-20">
                <Activity className="w-12 h-12" />
                <p className="text-sm font-medium">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
