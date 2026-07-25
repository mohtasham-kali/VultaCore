"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Server, ShieldCheck, Mail, Database } from "lucide-react";
import { cn } from "@/lib/utils";

import { API_BASE_URL } from "@/lib/constants";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load settings');
        return res.json();
      })
      .then(data => {
        if (data.maintenanceMode === 'true') setMaintenanceMode(true);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: maintenanceMode.toString() }),
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 italic">Accessing VultaCore configuration...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage global configuration for the VultaCore platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">General Info</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Platform Name</label>
              <input type="text" defaultValue="VultaCore" className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Support Email</label>
              <input type="email" defaultValue="support@vultacore.io" className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:border-purple-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Engine Config */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Engine Configuration</h2>
          </div>
          
          <div className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Analytics Engine URL</label>
              <input type="text" defaultValue="http://localhost:8080" className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-white/5">
              <div>
                <div className="text-sm font-bold text-white">Maintenance Mode</div>
                <div className="text-xs text-slate-500">Disable access for non-admin users</div>
              </div>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors",
                  maintenanceMode ? "bg-red-500" : "bg-slate-800"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                    maintenanceMode ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-500/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
