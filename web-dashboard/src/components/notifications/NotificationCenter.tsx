"use client";

import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Trash2, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'alert' | 'info' | 'success' | 'warning';
  createdAt: string;
  link?: string;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/notifications/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/notifications/user/${user.id}/read-all`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'alert': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
      >
        <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-slate-950">
            <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className={cn(
        "absolute right-0 mt-4 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 transition-all duration-300 origin-top-right",
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      )}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/30">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            Notifications
            {unreadCount > 0 && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </h3>
          {notifications.length > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {loading && (
            <div className="p-12 text-center text-slate-500 italic text-xs">
              Synchronizing data...
            </div>
          )}
          
          {!loading && notifications.length === 0 && (
            <div className="py-16 px-8 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-slate-700" />
              </div>
              <p className="text-slate-500 text-sm font-medium">All caught up!</p>
              <p className="text-slate-600 text-xs mt-1">No new alerts to show.</p>
            </div>
          )}

          {!loading && notifications.map((n) => (
            <div 
              key={n.id} 
              className={cn(
                "p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all relative group",
                !n.isRead && "bg-purple-500/[0.03]"
              )}
            >
              <div className="flex gap-3">
                <div className="mt-1 flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn("text-xs font-bold leading-none truncate pr-4", n.isRead ? "text-slate-300" : "text-white")}>
                      {n.title}
                    </p>
                    <span className="text-[8px] text-slate-500 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                    {n.message}
                  </p>
                </div>
              </div>

              {/* Actions on hover */}
              <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.isRead && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 bg-slate-800 rounded-lg text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-1.5 bg-slate-800 rounded-lg text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950/30 border-t border-white/5 text-center">
          <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}
