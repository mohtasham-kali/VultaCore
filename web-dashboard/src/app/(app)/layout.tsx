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
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            `[Settings API Error] Status: ${res.status}, ` +
            `Response: ${errorText || '(empty)'}, ` +
            `URL: ${API_BASE_URL}/settings`
          );
          return;
        }
        
        const settings = await res.json();
        
        if (settings.maintenanceMode === 'true') {
          setIsMaintenanceMode(true);
          
          try {
            const usersRes = await fetch(`${API_BASE_URL}/users`);
            
            if (!usersRes.ok) {
              console.error(
                `[Users API Error] Status: ${usersRes.status}, ` +
                `URL: ${API_BASE_URL}/users`
              );
              return;
            }
            
            const users = await usersRes.json();
            const dbUser = users.find((u: any) => u.email === user?.email);
            
            if (dbUser && dbUser.isAdmin) {
              setIsAdmin(true);
            } else {
              window.location.href = '/maintenance';
            }
          } catch (error) {
            console.error('[Users Fetch Error]', error);
          }
        }
      } catch (error) {
        console.error(
          '[Settings Fetch Error]',
          error,
          `API_BASE_URL: ${API_BASE_URL}`
        );
      }
    };

    fetchSettings();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
      {isMaintenanceMode && isAdmin && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          System is currently in Maintenance Mode. Normal users cannot access the platform.
        </div>
      )}
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
