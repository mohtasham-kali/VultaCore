"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  User,
  CreditCard,
  Download,
  Shield,
  Zap,
  Building2,
  ArrowRight,
  Clock,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_COMMANDS: Command[] = [
  // ── Quick Actions ──────────────────────────────────────────
  {
    id: "quick-scan",
    label: "Run Security Scan",
    description: "Quick vulnerability scan",
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    href: "/bots/cyber",
    group: "Quick Actions",
    keywords: "scan security run quick vuln",
  },
  {
    id: "quick-debug",
    label: "Debug Code",
    description: "Open bug fixer bot",
    icon: <Bot className="w-4 h-4 text-purple-400" />,
    href: "/bots/general",
    group: "Quick Actions",
    keywords: "debug code bug fix",
  },
  {
    id: "quick-upgrade",
    label: "Upgrade Plan",
    description: "Get more AI chats & features",
    icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
    href: "/subscription",
    group: "Quick Actions",
    keywords: "upgrade plan billing premium",
  },
  // ── Navigation ─────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview & stats",
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: "/",
    group: "Navigation",
    keywords: "home overview stats",
  },
  {
    id: "bots-general",
    label: "General Bots",
    description: "Code tools, bug fixers & more",
    icon: <Bot className="w-4 h-4" />,
    href: "/bots/general",
    group: "Navigation",
    keywords: "bots ai code debug",
  },
  {
    id: "bots-cyber",
    label: "Cyber Bots",
    description: "Security & vulnerability scanning",
    icon: <Shield className="w-4 h-4" />,
    href: "/bots/cyber",
    group: "Navigation",
    keywords: "bots security cyber hack vuln",
  },
  {
    id: "forum",
    label: "Community Forum",
    description: "Discussions & support",
    icon: <MessageSquare className="w-4 h-4" />,
    href: "/forum",
    group: "Navigation",
    keywords: "forum community chat discussion",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Usage & performance metrics",
    icon: <BarChart3 className="w-4 h-4" />,
    href: "/analytics",
    group: "Navigation",
    keywords: "analytics stats metrics data",
  },
  {
    id: "subscription",
    label: "Subscription",
    description: "Manage your plan",
    icon: <CreditCard className="w-4 h-4" />,
    href: "/subscription",
    group: "Navigation",
    keywords: "plan billing upgrade payment",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Your account & settings",
    icon: <User className="w-4 h-4" />,
    href: "/profile",
    group: "Navigation",
    keywords: "profile account user me",
  },
  {
    id: "settings",
    label: "Settings",
    description: "App preferences",
    icon: <Settings className="w-4 h-4" />,
    href: "/settings",
    group: "Navigation",
    keywords: "settings config preferences",
  },
  {
    id: "download",
    label: "Download App",
    description: "Desktop & mobile apps",
    icon: <Download className="w-4 h-4" />,
    href: "/download",
    group: "Navigation",
    keywords: "download desktop app install",
  },
  {
    id: "enterprise",
    label: "Enterprise Contact",
    description: "Custom plans for teams",
    icon: <Building2 className="w-4 h-4" />,
    href: "/enterprise-contact",
    group: "Navigation",
    keywords: "enterprise contact sales team",
  },
];

function filterCommands(query: string): Command[] {
  if (!query.trim()) return ALL_COMMANDS;
  const q = query.toLowerCase();
  return ALL_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q)
  );
}

function groupCommands(commands: Command[]): Record<string, Command[]> {
  return commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>
  );
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = filterCommands(query);
  const grouped = groupCommands(filtered);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const executeCommand = useCallback(
    (cmd: Command) => {
      if (cmd.action) cmd.action();
      else if (cmd.href) router.push(cmd.href);
      onClose();
    },
    [router, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) executeCommand(filtered[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, filtered, selectedIndex, executeCommand, onClose]);

  // Scroll selected into view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      className="palette-backdrop fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="palette-panel relative w-full max-w-2xl overflow-hidden"
        style={{
          background: "rgba(15, 23, 42, 0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, bots, actions..."
            className="flex-1 bg-transparent text-white text-base placeholder:text-slate-500 outline-none border-none"
          />
          <kbd
            className="hidden sm:flex items-center px-2 py-1 text-[10px] font-bold shrink-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#64748b",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto py-2" style={{ maxHeight: "55vh" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Hash className="w-8 h-8 text-slate-700" />
              <p className="text-slate-500 text-sm">
                No results for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, commands]) => (
              <div key={group}>
                {/* Group label */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#475569" }}
                  >
                    {group}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>

                {commands.map((cmd) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-index={idx}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left transition-colors duration-75"
                      style={{
                        background: isSelected ? "rgba(139,92,246,0.15)" : "transparent",
                        borderLeft: isSelected ? "2px solid #8b5cf6" : "2px solid transparent",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected
                            ? "rgba(139,92,246,0.25)"
                            : "rgba(255,255,255,0.05)",
                          color: isSelected ? "#c4b5fd" : "#94a3b8",
                        }}
                      >
                        {cmd.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold truncate"
                          style={{ color: isSelected ? "#fff" : "#cbd5e1" }}
                        >
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-xs truncate" style={{ color: "#475569" }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "#8b5cf6" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#334155" }}>
            <Clock className="w-3 h-3" /> {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          {[
            { key: "↑↓", label: "Navigate" },
            { key: "↵", label: "Open" },
            { key: "Esc", label: "Close" },
          ].map((k) => (
            <span key={k.key} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#334155" }}>
              <kbd
                className="px-1.5 py-0.5"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                }}
              >
                {k.key}
              </kbd>
              {k.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
