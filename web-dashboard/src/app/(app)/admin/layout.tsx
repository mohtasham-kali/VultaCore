"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  Target, 
  Settings, 
  Shield, 
  LayoutDashboard, 
  ArrowLeft,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Sales Pipeline", href: "/admin/leads", icon: Target },
  { name: "Sales POS", href: "/admin/pos", icon: CreditCard },
  { name: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col p-4 fixed h-full z-50">
        <div className="flex items-center gap-3 px-4 py-8">
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">VultaCore Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                  isActive 
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-white/5">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
