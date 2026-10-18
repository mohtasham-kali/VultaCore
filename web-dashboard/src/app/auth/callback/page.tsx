"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/";
        const errParam = searchParams.get("error_description") || searchParams.get("error");

        if (errParam) {
          if (isMounted) setError(errParam);
          return;
        }

        // If PKCE auth code is present, exchange it for session
        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error("Code exchange error:", exchangeErr);
            if (isMounted) setError(exchangeErr.message);
            return;
          }
          if (data?.session) {
            // Check if deep link is needed for Tauri desktop app
            if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window)) {
              router.replace("/");
              return;
            }
            router.replace(next);
            return;
          }
        }

        // Check if hash has implicit tokens
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionErr) {
              if (isMounted) setError(sessionErr.message);
              return;
            }
            if (data?.session) {
              window.location.hash = "";
              router.replace(next);
              return;
            }
          }
        }

        // Fallback: check if session already exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
        } else {
          // If no session found within 2 seconds, redirect to home
          setTimeout(() => {
            if (isMounted) router.replace("/");
          }, 1500);
        }
      } catch (err: any) {
        console.error("Auth callback exception:", err);
        if (isMounted) setError(err.message || "Authentication process failed.");
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Issue</h1>
        <p className="text-slate-400 text-sm max-w-md mb-8">{error}</p>
        <Link
          href="/auth"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center backdrop-blur-xl">
          <ShieldCheck className="w-10 h-10 text-purple-400" />
        </div>
        <div className="absolute -bottom-2 -right-2">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Authenticating with VultaCore</h2>
      <p className="text-slate-400 text-sm animate-pulse">Establishing secure session, redirecting shortly...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Validating credentials...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
