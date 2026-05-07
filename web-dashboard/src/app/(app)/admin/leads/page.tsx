"use client";

import { useState, useEffect } from "react";
import { User, Users, Building2, Calendar, Phone, Mail, MessageSquare, ShieldCheck } from "lucide-react";

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/leads`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching leads:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-400">Review and manage incoming enterprise inquiries.</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 px-6 py-3 rounded-2xl">
          <span className="text-purple-400 font-bold text-xl">{leads.length}</span>
          <span className="text-slate-500 text-sm ml-2 font-medium">Total Leads</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 italic">
          Fetching latest inquiries...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 border border-white/5 rounded-3xl">
          <div className="bg-slate-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <User className="w-6 h-6 text-slate-700" />
          </div>
          <p className="text-slate-500 font-medium">No inquiries found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:bg-slate-900 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building2 className="w-32 h-32" />
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white line-clamp-1">{lead.firstName} {lead.lastName}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {lead.companyName}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {lead.companySize}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a href={`mailto:${lead.email}`} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold">
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                  <a href={`tel:${lead.phone}`} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold">
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Inquiry Interest
                  </h4>
                  <div className="bg-slate-950/50 border border-white/5 px-4 py-3 rounded-xl text-slate-300 font-medium inline-block">
                    {lead.interest.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Business Challenges
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed italic">
                    &quot;{lead.challenges}&quot;
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
