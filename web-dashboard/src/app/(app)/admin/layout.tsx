"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Target,
  Settings,
  Shield,
  LayoutDashboard,
  ArrowLeft,
  CreditCard,
  Activity,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "mohtasham.siddiqui17@gmail.com";

const NAV_ITEMS = [
  { name: "Overview",          href: "/admin",                 icon: LayoutDashboard },
  { name: "Users",             href: "/admin/users",           icon: Users },
  { name: "Subscriptions",     href: "/admin/subscriptions",   icon: Target },
  { name: "Sales Pipeline",    href: "/admin/leads",           icon: Target },
  { name: "Sales POS",         href: "/admin/pos",             icon: CreditCard },
  { name: "Platform Settings", href: "/admin/settings",        icon: Settings },
  { name: "System Health",     href: "/admin/system-health",   icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isLoading } = useAuth();

  const isAdmin = !user ? false : (
    user.email === ADMIN_EMAIL ||
    user.user_metadata?.isAdmin === true ||
    user.app_metadata?.role === "admin" ||
    process.env.NODE_ENV !== "production"
  );

  // Redirect non-admins once auth resolves
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAdmin, router]);

  // Loading spinner while Supabase resolves the session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Access denied screen (shown briefly before redirect kicks in)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-slate-500 text-sm">This area is restricted to authorised administrators.</p>
        <Link
          href="/"
          className="mt-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          ← Return to App
        </Link>
      </div>
    );
  }

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
          <div className="px-4 py-2 mb-1">
            <div className="text-[10px] text-slate-600 font-mono truncate">{user?.email ?? "admin@vultacore.io"}</div>
          </div>
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
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
