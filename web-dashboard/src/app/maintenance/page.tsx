"use client";

import { AlertTriangle, ShieldCheck, RefreshCw, ArrowRight, Settings, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mohtasham.siddiqui17@gmail.com"
)
  .toLowerCase()
  .trim();

export default function MaintenancePage() {
  const { user, isLoading, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isAdmin = Boolean(
    user &&
      (user.email?.toLowerCase().trim() === ADMIN_EMAIL ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin" ||
        (user as any).isAdmin === true)
  );

  const handleCheckAgain = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-white/10 rounded-3xl p-8 lg:p-10 text-center shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Maintenance Icon Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
          </span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
            System Maintenance Mode
          </div>
          {/* Exact required heading */}
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            App Is On Maintenance
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            VultaCore is currently undergoing scheduled platform upgrades and maintenance.
            Standard access is temporarily paused. The system will be back online shortly!
          </p>
        </div>

        {/* 1. Admin Bypass Notice (When signed in as Admin) */}
        {!isLoading && isAdmin && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-left space-y-3">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Administrator Access Recognized
            </div>
            <p className="text-xs text-slate-300">
              You are signed in as <span className="font-semibold text-white">{user?.email}</span>. You retain full access to disable maintenance mode or manage platform infrastructure.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin Settings (Disable Maintenance)
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                Bypass to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 2. Non-admin signed-in user notice */}
        {!isLoading && user && !isAdmin && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                <User className="w-4 h-4 text-slate-400" />
                <span>Signed in as <span className="text-white font-semibold">{user.email}</span></span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              This account does not have platform administrator privileges. If you are an administrator, please sign out and log in with your admin credentials.
            </p>
          </div>
        )}

        {/* Actions Section */}
        <div className="space-y-3 pt-2">
          {/* Sign In button for unauthenticated users so admins can log back in */}
          {!isLoading && !user && (
            <Link
              href="/auth"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-purple-500/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Admin Login
            </Link>
          )}

          <button 
            onClick={handleCheckAgain} 
            disabled={checking}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking System Status..." : "Check Again"}
          </button>
        </div>

        <div className="pt-2 text-[11px] text-slate-500">
          Need urgent access or platform support? Contact{" "}
          <span className="text-slate-400 font-medium">support@vultacore.io</span>
        </div>
      </div>
    </div>
  );
}
