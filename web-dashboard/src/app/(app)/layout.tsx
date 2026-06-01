"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/settings`)
      .then(res => res.json())
      .then(settings => {
        if (settings.maintenanceMode === 'true') {
          fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users`)
            .then(res => res.json())
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
