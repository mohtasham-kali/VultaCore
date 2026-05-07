"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  Download,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";


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
      { name: "Downloads", icon: Download, href: "/download" },
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

  const { user, signOut } = useAuth();


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
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              V
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              VultaCore
            </span>
          </div>
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

        {/* User Info */}
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden shrink-0">
               {user?.user_metadata?.avatar_url ? (
                 <Image src={user.user_metadata.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" unoptimized />
               ) : (
                 <span>{user?.email?.[0].toUpperCase() || 'U'}</span>
               )}
             </div>
             <div className="min-w-0">
               <p className="text-xs font-bold text-white truncate">{user?.user_metadata?.full_name || 'Authorized User'}</p>
               <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
             </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">

          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

