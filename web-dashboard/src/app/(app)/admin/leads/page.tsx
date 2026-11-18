"use client";

import { useState, useEffect, useMemo } from "react";
import { User, Users, Building2, Calendar, Phone, Mail, MessageSquare, ShieldCheck, Search, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companySize: string;
  interest: string;
  phone: string;
  challenges: string;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/leads`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.firstName?.toLowerCase().includes(q) ||
        l.lastName?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.companyName?.toLowerCase().includes(q) ||
        l.interest?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-400">Review and manage incoming enterprise inquiries.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 border border-purple-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-2">
            <span className="text-purple-400 font-bold text-lg">{leads.length}</span>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Leads</span>
          </div>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors"
            title="Refresh Leads"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, name, email, or interest..."
          className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 italic">
          Fetching latest inquiries...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 border border-white/5 rounded-3xl">
          <div className="bg-slate-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <User className="w-6 h-6 text-slate-700" />
          </div>
          <p className="text-slate-500 font-medium">
            {search ? `No inquiries matching "${search}"` : "No inquiries found yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building2 className="w-32 h-32" />
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20">
                    {lead.firstName ? lead.firstName[0] : "L"}{lead.lastName ? lead.lastName[0] : ""}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white line-clamp-1">{lead.firstName} {lead.lastName}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {lead.companyName || "Independent"}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {lead.companySize || "N/A"}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Recent"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold">
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold">
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Inquiry Interest
                  </h4>
                  <div className="bg-slate-950/50 border border-white/5 px-4 py-3 rounded-xl text-slate-300 font-medium inline-block">
                    {lead.interest ? lead.interest.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "General Enterprise"}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Business Challenges
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed italic">
                    &quot;{lead.challenges || "No additional challenges specified."}&quot;
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}