"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure isLoading NEVER hangs longer than 2.5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2500);

    const initAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          // 1. Check for PKCE 'code' query parameter in URL (OAuth redirect callback on web)
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          if (code) {
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && data?.session && isMounted) {
                setSession(data.session);
                setUser(data.session.user);
                // Clean code query parameter from URL without page reload
                const cleanUrl = new URL(window.location.href);
                cleanUrl.searchParams.delete("code");
                window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
                setIsLoading(false);
                clearTimeout(safetyTimeout);
                return;
              }
            } catch (err) {
              console.warn("PKCE exchange error in AuthContext:", err);
            }
          }

          // 2. Check for implicit hash parameters in URL (#access_token=...&refresh_token=...)
          const hash = window.location.hash ? window.location.hash.substring(1) : "";
          if (hash) {
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
              try {
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                if (!error && data?.session && isMounted) {
                  setSession(data.session);
                  setUser(data.session.user);
                  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                  setIsLoading(false);
                  clearTimeout(safetyTimeout);
                  return;
                }
              } catch (err) {
                console.warn("Hash session sync error in AuthContext:", err);
              }
            }
          }
        }

        // 3. Standard session check from storage
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
        if (isMounted) {
          setIsLoading(false);
        }
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    initAuth();

    // Handle Capacitor Deep Links (for Mobile Auth Redirects)
    const setupDeepLinks = async () => {
      try {
        const { App } = await import("@capacitor/app");
        App.addListener('appUrlOpen', async (event: { url: string }) => {
          try {
            const url = new URL(event.url);
            const hash = url.hash.substring(1);
            if (hash) {
              const hashParams = new URLSearchParams(hash);
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');
              if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                if (error) console.error("Session sync error:", error.message);
              }
            }
          } catch (e) {
            console.error("Deep link parse error:", e);
          }
        });
      } catch (_) {
        // Capacitor App plugin not available in browser
      }
    };

    setupDeepLinks();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
