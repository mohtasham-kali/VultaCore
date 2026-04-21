"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  ShieldAlert, 
  Bot, 
  Cpu,
  BarChart2, 
  Settings, 
  User, 
  LogOut, 
  LayoutDashboard,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    category: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/" },
      { name: "Analytics", icon: BarChart2, href: "/analytics" },
    ]
  },
  {
    category: "Forums",
    items: [
      { name: "Dev Forum", icon: MessageSquare, href: "/forum/dev" },
      { name: "Security Hub", icon: ShieldAlert, href: "/forum/cyber" },
    ]
  },
  {
    category: "AI Automation",
    items: [
      { name: "General Bots", icon: Bot, href: "/bots/general" },
      { name: "Cyber Bots", icon: Cpu, href: "/bots/cyber" },
    ]
  },
  {
    category: "Account",
    items: [
      { name: "Settings", icon: Settings, href: "/settings" },
      { name: "Profile", icon: User, href: "/profile" },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <div className={cn(
        "w-64 min-h-screen bg-slate-950/50 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 overflow-y-auto transition-transform duration-300 z-[70]",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            SaaS 2.0
          </h1>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 px-4 space-y-6 pb-6 mt-4 lg:mt-0">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-3">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                        isActive 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5" 
                          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 transition-transform duration-300", isActive && "scale-110")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
