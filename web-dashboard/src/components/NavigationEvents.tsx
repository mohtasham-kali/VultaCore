"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useSearchParams } from "next/navigation";

// Configure NProgress
// TS note: typed via @types/nprogress (installed in dev deps).
// If you still get build-time TS errors, add a local declaration in a typings.d.ts.
NProgress.configure({ showSpinner: false, speed: 500, minimum: 0.3 });


export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on route change
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 500);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
