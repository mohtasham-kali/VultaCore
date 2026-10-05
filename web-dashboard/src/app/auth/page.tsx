"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Lazily import Tauri plugins – they are only available inside the desktop app.
// Using dynamic import prevents Next.js from bundling them into the web build.
async function getTauriModules() {
  const [{ openUrl }, { onOpenUrl, getCurrent }, { listen }] = await Promise.all([
    import("@tauri-apps/plugin-opener"),
    import("@tauri-apps/plugin-deep-link"),
    import("@tauri-apps/api/event"),
  ]);
  return { openUrl, onOpenUrl, getCurrent, listen };
}

/** Extract a hash-parameter from a URL string (e.g. access_token from vultacore://auth-callback#...) */
function extractHashParam(url: string, key: string): string | null {
  try {
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const params = new URLSearchParams(hash);
    return params.get(key);
  } catch {
    return null;
  }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState(false);

  const router = useRouter();

  // Detect Tauri and hook up the deep-link listener
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    setIsTauri(true);

    let unlisten: (() => void) | null = null;

    const setupDeepLink = async () => {
      const { onOpenUrl, getCurrent, listen } = await getTauriModules();

      // Handle deep links if the app was kept open in the background (plugin-deep-link)
      unlisten = await onOpenUrl(async (urls) => {
        const url = Array.isArray(urls) ? urls[0] : urls;
        await handleDeepLinkUrl(url);
      });

      // Handle deep links from single-instance intercept (on Linux/Windows second-instances)
      const unlistenEvent = await listen<string>("deep-link-url", async (event) => {
        if (event.payload) await handleDeepLinkUrl(event.payload);
      });

      // Handle the case where the app was launched directly via the deep-link URL
      const initial = await getCurrent();
      if (initial) {
        const url = Array.isArray(initial) ? initial[0] : initial;
        if (url) await handleDeepLinkUrl(url);
      }

      // Hack to combine both unlisteners simply
      const oldUnlisten = unlisten;
      unlisten = () => {
        if (oldUnlisten) oldUnlisten();
        unlistenEvent();
      };
    };

    setupDeepLink();
    return () => { if (unlisten) unlisten(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Parse the vultacore://auth-callback deep link URL for session info or code */
  const handleDeepLinkUrl = async (url: string) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      setError("Invalid redirect URL format.");
      return;
    }

    // Check for errors returned by Supabase
    const errQuery = parsedUrl.searchParams.get("error_description") || parsedUrl.searchParams.get("error");
    const errHash = extractHashParam(url, "error_description") || extractHashParam(url, "error");
    if (errQuery || errHash) {
      setError(`Authentication failed: ${errQuery || errHash}`);
      return;
    }

    // 1. Try PKCE code flow (default in modern supabase-js)
    const code = parsedUrl.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(`Authentication error: ${error.message}`);
      } else {
        router.push("/");
      }
      return;
    }

    // 2. Try Implicit flow (access_token in hash)
    const accessToken = extractHashParam(url, "access_token");
    const refreshToken = extractHashParam(url, "refresh_token");

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setError(`Authentication error: ${error.message}`);
      } else {
        router.push("/");
      }
      return;
    }

    setError("Authentication failed: received an incomplete response. Please try again.");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const getRedirectUrl = () => {
    // Inside Tauri: redirect to our custom deep-link scheme
    if (isTauri) return "vultacore://auth-callback";
    // Mobile (Capacitor)
    if (typeof window !== "undefined" && (window as Window & { Capacitor?: { isNativePlatform: () => boolean } }).Capacitor?.isNativePlatform()) {
      return "com.vultacore.app://auth-callback";
    }
    return `${window.location.origin}/`;
  };

  const signInWithProvider = async (provider: "google" | "apple" | "github") => {
    setLoading(true);
    setError(null);

    try {
      if (isTauri) {
        // Desktop path: get the authorization URL from Supabase but DON'T redirect
        // the webview. Open the system browser (Chrome/Firefox) instead.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: getRedirectUrl(),
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error("No OAuth URL returned by Supabase.");

        // Open the returned URL in the system default browser via tauri-plugin-opener
        const { openUrl } = await getTauriModules();
        await openUrl(data.url);
        // The window now waits for the deep-link callback handled by the useEffect above.
        setLoading(false);
      } else {
        // Web path: standard redirect flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError((err as Error).message || "OAuth sign-in failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Join the future of Development & Security"}
            </p>
          </div>

          {/* OAuth Buttons – shown on both web and desktop */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => signInWithProvider("google")}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => signInWithProvider("apple")}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
              <span>Continue with Apple</span>
            </button>
            <button
              onClick={() => signInWithProvider("github")}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {isTauri && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs p-3 rounded-lg text-center mb-4">
              🔒 Clicking a provider will open your system browser securely. Return here after signing in.
            </div>
          )}

          <div className="relative flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">Or email</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl py-3 mt-4 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
