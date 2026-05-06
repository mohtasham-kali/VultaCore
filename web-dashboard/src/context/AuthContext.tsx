"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Capacitor import moved to useEffect to prevent SSR/Build errors

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Handle Capacitor Deep Links (for Mobile Auth Redirects)
    const setupDeepLinks = async () => {
      try {
        const { App } = await import("@capacitor/app");
        App.addListener('appUrlOpen', async (event: { url: string }) => {
          const url = new URL(event.url);
          const hash = url.hash.substring(1);
          
          if (hash) {
            const { error } = await supabase.auth.setSession({
              access_token: new URLSearchParams(hash).get('access_token') || "",
              refresh_token: new URLSearchParams(hash).get('refresh_token') || "",
            });
            if (error) console.error("Session sync error:", error.message);
          }
        });
      } catch (e) {
        console.warn("Capacitor App plugin not available", e);
      }
    };

    setupDeepLinks();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
