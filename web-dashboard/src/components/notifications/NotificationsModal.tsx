"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  CheckCheck,
  ArrowRight,
  Clock,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/constants";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: "alert" | "info" | "success" | "warning";
  createdAt: string;
  link?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateString: string): string {
  try {
    const past = new Date(dateString).getTime();
    if (isNaN(past)) return "Recently";
    const now = Date.now();
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "alert">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/notifications/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setFilter("all");
      setSelectedIndex(0);
      fetchNotifications();
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/user/${user.id}/read-all`, {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleOpenNotification = (n: NotificationItem) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (n.link) {
      onClose();
      router.push(n.link);
    }
  };

  // Safe filtered notifications
  const safeList = Array.isArray(notifications) ? notifications : [];
  const filtered = safeList.filter((n) => {
    if (!n) return false;
    if (filter === "unread" && n.isRead) return false;
    if (filter === "alert" && n.type !== "alert" && n.type !== "warning") return false;

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.message && n.message.toLowerCase().includes(q)) ||
      (n.type && n.type.toLowerCase().includes(q))
    );
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleOpenNotification(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filter]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const unreadCount = safeList.filter((n) => !n?.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "alert":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const modalContent = (
    <div
      className="palette-backdrop fixed inset-0 z-[99999] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-150"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="palette-panel relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
        style={{
          background: "rgba(15, 23, 42, 0.98)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Search Bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-white/10"
          style={{ background: "rgba(30, 41, 59, 0.4)" }}
        >
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all notifications, security alerts, messages..."
            className="flex-1 bg-transparent text-white text-base placeholder:text-slate-500 outline-none border-none"
          />

          {unreadCount > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {unreadCount} unread
            </span>
          )}

          <kbd
            className="hidden sm:flex items-center px-2 py-1 text-[10px] font-bold shrink-0 text-slate-400"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
            }}
          >
            ESC
          </kbd>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Actions */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/40 border-b border-white/5 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all",
                filter === "all"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              All ({safeList.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all",
                filter === "unread"
                  ? "bg-purple-500/20 text-purple-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("alert")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all",
                filter === "alert"
                  ? "bg-rose-500/20 text-rose-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Alerts & Warnings
            </button>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div
          ref={listRef}
          className="overflow-y-auto py-2 divide-y divide-white/[0.04]"
          style={{ maxHeight: "54vh" }}
        >
          {loading && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              <p className="text-xs font-medium">Loading notifications...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-white text-sm font-semibold">
                {query ? `No notifications matching "${query}"` : "All caught up!"}
              </p>
              <p className="text-slate-500 text-xs max-w-sm">
                {query
                  ? "Try searching for a different keyword or check your filter settings."
                  : "You have no active alerts or messages. New updates will appear here."}
              </p>
            </div>
          )}

          {!loading &&
            filtered.map((n, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={n.id}
                  data-index={idx}
                  onClick={() => handleOpenNotification(n)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-start gap-4 px-5 py-3.5 text-left transition-colors duration-75 group cursor-pointer relative",
                    !n.isRead && "bg-purple-500/[0.04]"
                  )}
                  style={{
                    background: isSelected
                      ? "rgba(139,92,246,0.12)"
                      : !n.isRead
                      ? "rgba(168,85,247,0.03)"
                      : "transparent",
                    borderLeft: isSelected ? "3px solid #8b5cf6" : "3px solid transparent",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isSelected
                        ? "rgba(139,92,246,0.22)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {getIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-sm font-semibold truncate",
                          n.isRead ? "text-slate-300" : "text-white"
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                      )}
                      <span className="text-[10px] text-slate-500 ml-auto shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {n.link && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium">
                        <span>Open related link</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={(e) => markAsRead(n.id, e)}
                        className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {n.link && (
                      <ArrowRight className="w-4 h-4 text-purple-400 ml-1" />
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between border-t border-white/5 bg-slate-950/60"
        >
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "↵", label: "Open" },
              { key: "Esc", label: "Close" },
            ].map((k) => (
              <span
                key={k.key}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
              >
                <kbd
                  className="px-1.5 py-0.5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    color: "#94a3b8",
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
    </div>
  );

  return createPortal(modalContent, document.body);
}
