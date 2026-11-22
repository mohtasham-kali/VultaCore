"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/constants";

const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mohtasham.siddiqui17@gmail.com"
)
  .toLowerCase()
  .trim();

export function MaintenanceGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [maintenanceModeActive, setMaintenanceModeActive] = useState<boolean | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const isActive =
          data.maintenanceMode === "true" || data.maintenanceMode === true;

        if (!isCancelled) {
          setMaintenanceModeActive(isActive);
        }

        if (isActive) {
          // If auth is still resolving, hold off until we know if user is admin
          if (authLoading) return;

          const isAdmin = Boolean(
            user &&
              (user.email?.toLowerCase().trim() === ADMIN_EMAIL ||
                user.user_metadata?.role === "admin" ||
                user.app_metadata?.role === "admin")
          );

          // All users except Admin must be redirected to /maintenance
          if (!isAdmin && pathname !== "/maintenance") {
            router.replace("/maintenance");
          }
        } else {
          // If maintenance mode is off and user is currently on /maintenance, return to home
          if (pathname === "/maintenance") {
            router.replace("/");
          }
        }
      } catch (err) {
        // In case API is temporarily unavailable, don't crash
      }
    };

    checkMaintenance();

    // Poll every 10 seconds to detect when admin enables/disables maintenance mode
    const interval = setInterval(checkMaintenance, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [pathname, user, authLoading, router]);

  return null;
}

