"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart as LucideBarChart, Activity, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSettings } from '@/providers/SettingsProvider';
import { useEffect, useState } from 'react';
import { fetchAnalytics } from '@/lib/api';
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { chartType } = useSettings();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchAnalytics('mock-uuid');
        setStats(data);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const chartData = stats ? [
    { name: 'Engagement', value: stats.engagement_score, color: '#10b981' },
    { name: 'Points', value: Math.min(stats.total_points / 10, 100), color: '#8b5cf6' },
    { name: 'Remaining', value: 100 - stats.engagement_score, color: '#334155' },
  ] : [];

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
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              itemStyle={{ color: 'white' }}
            />
          </PieChart>
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Performance Analytics
          <LucideBarChart className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-slate-400">Track your overall usage, points, and QnA statistics using Rust-powered analytics.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Points", value: stats?.total_points?.toLocaleString() || "0", icon: Activity, color: "text-purple-400" },
          { label: "Rank", value: stats?.rank_estimate || "Calculating...", icon: CheckCircle, color: "text-emerald-400" },
          { label: "Engagement", value: `${stats?.engagement_score || 0}%`, icon: XCircle, color: "text-red-400" },
          { label: "Completion", value: "60%", icon: LucideBarChart, color: "text-blue-400" },
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
          <h3 className="text-lg font-bold text-white mb-6 uppercase text-xs tracking-widest opacity-50">Rust Analytics Engine Output ({chartType})</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-[-20px]">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-400 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl h-[400px] overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-white mb-4">Live Activity Log</h3>
          <div className="space-y-4">
            {stats?.activityLog?.map((action: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs border border-white/5",
                  action.type === 'post' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                )}>
                  {action.type === 'post' ? 'P' : 'C'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">
                    {action.type === 'post' ? `Created post: ${action.title}` : action.title}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{new Date(action.date).toLocaleString()}</p>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-md border",
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
