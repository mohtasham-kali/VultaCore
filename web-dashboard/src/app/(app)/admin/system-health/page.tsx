"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  Cpu,
  Zap,
  Circle,
  Clock,
} from "lucide-react";

interface BootData {
  logs: string[];
  hasErrors: boolean;
  uptime: number;
  ports: { backend: number | null; dashboard: number | null; ai: number | null };
  booted: boolean;
  ts: string;
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function logClass(line: string) {
  if (line.includes("❌")) return "text-red-400";
  if (line.includes("⚠️")) return "text-amber-400";
  if (line.includes("✨") || line.includes("✅")) return "text-emerald-400";
  if (line.includes("📡")) return "text-blue-400";
  if (line.includes("🧹")) return "text-purple-400";
  return "text-slate-300";
}

export default function SystemHealthPage() {
  const [data, setData] = useState<BootData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/boot-logs", { cache: "no-store" });
      if (res.ok) {
        const json: BootData = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch (_) {
      // proxy not ready — keep previous data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 10s
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(), 10_000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const engines = [
    {
      name: "Backend API",
      icon: Server,
      port: data?.ports.backend,
      color: "purple",
    },
    {
      name: "Dashboard",
      icon: Cpu,
      port: data?.ports.dashboard,
      color: "blue",
    },
    {
      name: "AI Engine",
      icon: Zap,
      port: data?.ports.ai,
      color: "amber",
    },
  ];

  const errorCount = data?.logs.filter((l) => l.includes("❌")).length ?? 0;
  const warnCount  = data?.logs.filter((l) => l.includes("⚠️")).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            System Health
          </h1>
          <p className="text-slate-500 mt-2 font-medium italic">
            Live boot diagnostics &amp; engine status — admin eyes only
          </p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      {data && (
        <div
          className={`flex items-center gap-4 p-5 rounded-2xl border ${
            data.booted && !data.hasErrors
              ? "bg-emerald-500/10 border-emerald-500/20"
              : data.booted && data.hasErrors
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          {data.booted && !data.hasErrors ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle
              className={`w-6 h-6 shrink-0 ${
                data.booted ? "text-amber-400" : "text-red-400"
              }`}
            />
          )}
          <div>
            <div className="font-bold text-white text-sm">
              {data.booted && !data.hasErrors
                ? "All engines running normally"
                : data.booted
                ? `Running with ${errorCount} error(s) and ${warnCount} warning(s)`
                : "Engines failed to start — check logs below"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Uptime: {formatUptime(data.uptime)} · Last checked:{" "}
              {lastRefresh?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Engine status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {engines.map(({ name, icon: Icon, port, color }) => {
          const online = !!port;
          return (
            <div
              key={name}
              className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  online
                    ? `bg-${color}-500/10 text-${color}-400`
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Circle
                    className={`w-2 h-2 fill-current ${
                      online ? "text-emerald-400" : "text-red-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      online ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {online ? `Port ${port}` : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boot Log Terminal */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">Boot Log</span>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
            <Clock className="w-3 h-3" />
            {data?.ts ? new Date(data.ts).toLocaleString() : "—"}
          </div>
        </div>

        <div className="p-6 font-mono text-xs space-y-1 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {loading && (
            <p className="text-slate-500 animate-pulse">
              Fetching boot diagnostics…
            </p>
          )}
          {!loading && (!data || data.logs.length === 0) && (
            <p className="text-slate-500">
              No logs available yet. The proxy may still be booting.
            </p>
          )}
          {data?.logs.map((line, i) => (
            <div
              key={i}
              className={`leading-relaxed whitespace-pre-wrap break-all ${logClass(line)}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
