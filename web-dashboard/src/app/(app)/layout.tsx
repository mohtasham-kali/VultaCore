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

    fetch(`${API_BASE_URL}/settings`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
      })
      .then(settings => {
        if (settings.maintenanceMode === 'true') {
          fetch(`${API_BASE_URL}/users`)
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch users');
              return res.json();
            })
            .then(users => {
              const dbUser = users.find((u: any) => u.email === user?.email);
              if (!dbUser || !dbUser.isAdmin) {
                window.location.href = '/maintenance';
              }
            })
            .catch(err => console.error(err));
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
