"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/constants";
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mohtasham.siddiqui17@gmail.com"
)
  .toLowerCase()
  .trim();

export function MaintenanceGuard() {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [maintenanceModeActive, setMaintenanceModeActive] = useState<boolean | null>(null);

  const isAdmin = Boolean(
    user &&
      (user.email?.toLowerCase().trim() === ADMIN_EMAIL ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin" ||
        (user as any).isAdmin === true)
  );

  const isAuthRoute = pathname.startsWith("/auth");
  const isMaintenanceRoute = pathname === "/maintenance";

  useEffect(() => {
    let isCancelled = false;

    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const isActive =
          data.maintenanceMode === "true" || data.maintenanceMode === true;

        if (!isCancelled) {
          setMaintenanceModeActive(isActive);
        }

        if (isActive) {
          // If auth is still resolving, hold off until auth resolves
          if (authLoading) return;

          // Never block or redirect from the authentication flow (/auth) or /maintenance
          if (!isAdmin && !isAuthRoute && !isMaintenanceRoute) {
            window.location.replace("/maintenance");
          }
        } else {
          // If maintenance mode is off and user is currently on /maintenance, return to home
          if (isMaintenanceRoute) {
            window.location.replace("/");
          }
        }
      } catch (err) {
        // Fail gracefully
      }
    };

    checkMaintenance();

    // Fast polling every 5 seconds so status changes take effect immediately
    const interval = setInterval(checkMaintenance, 5000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [pathname, user, authLoading, isAdmin, isAuthRoute, isMaintenanceRoute]);

  // If maintenance mode is active, auth is confirmed, user is NOT admin, and not on /maintenance or /auth:
  // Render an immediate blocking overlay so the user NEVER sees the app content while redirecting
  if (
    maintenanceModeActive === true &&
    !authLoading &&
    !isAdmin &&
    !isAuthRoute &&
    !isMaintenanceRoute
  ) {
    return (
      <div className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-white/10 rounded-3xl p-8 lg:p-10 text-center shadow-2xl backdrop-blur-xl space-y-6">
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              App Is On Maintenance
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              VultaCore is currently undergoing scheduled platform upgrades and maintenance.
              Standard access is temporarily paused. The system will be back online shortly!
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/auth"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-purple-500/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Admin Login
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-white/5"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
