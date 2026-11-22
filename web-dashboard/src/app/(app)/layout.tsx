"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/constants";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mohtasham.siddiqui17@gmail.com").toLowerCase().trim();
    const isAdmin = Boolean(
      user && (
        user.email?.toLowerCase().trim() === ADMIN_EMAIL ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin"
      )
    );

    if (isAdmin) return;

    fetch(`${API_BASE_URL}/settings?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
      })
      .then(settings => {
        if (settings.maintenanceMode === 'true' || settings.maintenanceMode === true) {
          window.location.replace('/maintenance');
        }
      })
      .catch(err => console.error(err));
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
      <MobileHeader 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <Header />
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
