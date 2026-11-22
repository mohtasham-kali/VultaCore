"use client";

import { useState, useEffect, useMemo } from "react";
import {
  User as UserIcon,
  Search,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Check,
  MoreVertical,
  Shield,
  Sparkles,
  X,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
  points: number;
}

interface Feature {
  id: string;
  key: string;
  name: string;
  category: string;
  defaultLimit: number | null;
}

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // User Dropdown State
  const [openDropdownUserId, setOpenDropdownUserId] = useState<string | null>(null);

  // Enterprise Customization Modal State
  const [selectedUserForEnterprise, setSelectedUserForEnterprise] = useState<User | null>(null);
  const [enterpriseInquiryData, setEnterpriseInquiryData] = useState<any | null>(null);
  const [enterpriseForm, setEnterpriseForm] = useState({
    approvedFeatures: [] as string[],
    featureLimits: {} as Record<string, number | null>,
    allowedModels: ["claude-3-5-sonnet-20241022", "llama-3.3-70b-versatile", "gemini-1.5-pro", "llama-3.1-8b-instant"],
    customPrice: 299,
    billingInterval: "month",
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "active",
    adminNotes: "",
  });
  const [isSavingEnterprise, setIsSavingEnterprise] = useState(false);

  const token = session?.access_token;

  const fetchUsersAndFeatures = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [resUsers, resFeats] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/features`, { headers }).then((r) => r.json()).catch(() => []),
      ]);

      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setFeatures(Array.isArray(resFeats) ? resFeats : []);
    } catch (err) {
      console.error("Failed to fetch users or features:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndFeatures();
  }, [token]);

  const handleUpdateRank = async (userId: string, newRank: string) => {
    try {
      setUpdatingId(userId);
      setErrorMessage(null);
      const res = await fetch(`${API_BASE_URL}/users/${userId}/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan: newRank }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update rank");
      }

      const updated = await res.json().catch(() => null);

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rank: newRank } : u)),
      );
      setSuccessId(userId);

      if (updated?.paddleSync?.message) {
        setSyncStatus(`Updated to ${newRank}: ${updated.paddleSync.message}`);
        setTimeout(() => setSyncStatus(null), 5000);
      }

      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setErrorMessage(
        (err as Error).message ||
          "Failed to update user tier. Make sure you are signed in as an administrator.",
      );
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Enterprise Customization for a specific user
  const handleOpenCustomizeEnterprise = async (user: User) => {
    setOpenDropdownUserId(null);
    setSelectedUserForEnterprise(user);

    // Look up any pending enterprise inquiry for this user
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const inquiryRes = await fetch(
        `${API_BASE_URL}/enterprise/inquiries/user?email=${encodeURIComponent(user.email)}&userId=${user.id}`,
        { headers },
      );
      if (inquiryRes.ok) {
        const inq = await inquiryRes.json();
        setEnterpriseInquiryData(inq);

        let requestedList: string[] = [];
        try {
          requestedList = inq?.requestedFeatures ? JSON.parse(inq.requestedFeatures) : [];
        } catch {
          requestedList = [];
        }

        const approved = requestedList.length > 0 ? requestedList : [
          "sla_guarantees",
          "dedicated_ai_instance",
          "phone_support_24_7",
          "private_security_hub",
          "advanced_threat_intel",
        ];

        setEnterpriseForm((prev) => ({
          ...prev,
          approvedFeatures: approved,
          adminNotes: inq?.reference ? `Converted from inquiry ${inq.reference}` : "",
        }));
      } else {
        setEnterpriseInquiryData(null);
        setEnterpriseForm((prev) => ({
          ...prev,
          approvedFeatures: [
            "sla_guarantees",
            "dedicated_ai_instance",
            "phone_support_24_7",
            "private_security_hub",
            "advanced_threat_intel",
          ],
        }));
      }
    } catch {
      setEnterpriseInquiryData(null);
    }
  };

  const handleSaveEnterpriseCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserForEnterprise) return;

    try {
      setIsSavingEnterprise(true);
      const res = await fetch(
        `${API_BASE_URL}/subscriptions/user/${selectedUserForEnterprise.id}/enterprise`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(enterpriseForm),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to customize Enterprise agreement");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForEnterprise.id ? { ...u, rank: "Enterprise" } : u)),
      );

      setSelectedUserForEnterprise(null);
      setSyncStatus(`Enterprise plan activated with custom entitlements for ${selectedUserForEnterprise.username}`);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      console.error("Enterprise customization error:", err);
      setErrorMessage(err.message || "Failed to save enterprise customization");
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setIsSavingEnterprise(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query) ||
        u.rank?.toLowerCase().includes(query),
    );
  }, [users, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Accounts Directory</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} registered account{users.length === 1 ? "" : "s"} across the platform.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, plan..."
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-colors"
            />
          </div>
          <button
            onClick={fetchUsersAndFeatures}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-purple-400")} />
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-semibold animate-in fade-in duration-300">
          <Check className="w-5 h-5 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/40">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                User Identity
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Account Tier
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Reward Points
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                  Loading user accounts from database...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                  {search ? `No accounts matching "${search}"` : "No accounts registered yet."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isUpdating = updatingId === user.id;
                const isSuccess = successId === user.id;
                const isDropdownOpen = openDropdownUserId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {user.username}
                            {isSuccess && (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Updated
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.rank || "Free"}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateRank(user.id, e.target.value)}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full outline-none bg-slate-950 border border-white/10 cursor-pointer transition-colors",
                            user.rank === "Enterprise"
                              ? "text-blue-400 border-blue-500/30"
                              : user.rank === "Premium"
                              ? "text-purple-400 border-purple-500/30"
                              : user.rank === "Standard"
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-slate-400",
                          )}
                        >
                          <option value="Free">Free</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                        {isUpdating && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">
                        {typeof user.points === "number" ? user.points : 0}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">pts</span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setOpenDropdownUserId(isDropdownOpen ? null : user.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="User Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* User Action Dropdown */}
                        {isDropdownOpen && (
                          <div className="absolute right-6 top-14 z-30 w-56 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl p-1.5 text-left text-xs animate-in fade-in duration-150">
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5">
                              Subscription Actions
                            </div>

                            <button
                              onClick={() => handleOpenCustomizeEnterprise(user)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 text-blue-300 hover:text-blue-200 transition-colors font-medium text-xs"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Customize Enterprise Plan</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenDropdownUserId(null);
                                handleUpdateRank(user.id, "Standard");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-xs"
                            >
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                              <span>Assign Standard Tier</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenDropdownUserId(null);
                                handleUpdateRank(user.id, "Premium");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-xs"
                            >
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span>Assign Premium Tier</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenDropdownUserId(null);
                                handleUpdateRank(user.id, "Free");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors text-xs border-t border-white/5 mt-1"
                            >
                              <span>Reset to Free Tier</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ENTERPRISE CUSTOMIZATION MODAL FOR SPECIFIC USER */}
      {selectedUserForEnterprise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUserForEnterprise(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                Isolated Enterprise Plan Customization
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {selectedUserForEnterprise.username}
              </h2>
              <p className="text-xs text-slate-400">{selectedUserForEnterprise.email}</p>
            </div>

            {enterpriseInquiryData && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-purple-500/20 text-xs space-y-1.5">
                <div className="font-bold text-purple-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customer Inquiry: {enterpriseInquiryData.reference}</span>
                </div>
                <div className="text-slate-300">
                  Company: <strong>{enterpriseInquiryData.companyName}</strong> • Seats: <strong>{enterpriseInquiryData.numberOfUsers}</strong>
                </div>
                {enterpriseInquiryData.customRequirements && (
                  <div className="text-slate-400 italic">
                    &quot;{enterpriseInquiryData.customRequirements}&quot;
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveEnterpriseCustomization} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreed Monthly Price ($)</label>
                  <input
                    type="number"
                    value={enterpriseForm.customPrice}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, customPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Billing Interval</label>
                  <select
                    value={enterpriseForm.billingInterval}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, billingInterval: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Annual</option>
                    <option value="custom">Custom Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreement Start Date</label>
                  <input
                    type="date"
                    value={enterpriseForm.startDate}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expiration / Renewal Date</label>
                  <input
                    type="date"
                    value={enterpriseForm.expirationDate}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, expirationDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              {/* Select Approved Features */}
              <div>
                <label className="block font-bold text-sm text-white mb-2">
                  Administrator-Approved Features (Specific Customer Entitlements)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2">
                  {features.map((feat) => {
                    const isChecked = enterpriseForm.approvedFeatures.includes(feat.key);
                    return (
                      <button
                        type="button"
                        key={feat.key}
                        onClick={() => {
                          const updated = isChecked
                            ? enterpriseForm.approvedFeatures.filter((k) => k !== feat.key)
                            : [...enterpriseForm.approvedFeatures, feat.key];
                          setEnterpriseForm({ ...enterpriseForm, approvedFeatures: updated });
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-2 rounded-xl border text-left transition-colors",
                          isChecked
                            ? "bg-blue-500/10 border-blue-500/40 text-white font-medium"
                            : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/15",
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            isChecked ? "bg-blue-500 border-blue-500 text-white" : "border-white/20 bg-slate-900",
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{feat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Authorized AI Models */}
              <div>
                <label className="block font-bold text-sm text-white mb-2">
                  Authorized AI Reasoning Models
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
                    { id: "claude-3-opus", label: "Claude 3 Opus" },
                    { id: "llama-3.3-70b-versatile", label: "Meta Llama 3.3 70B" },
                    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
                    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
                  ].map((m) => {
                    const isAllowed = enterpriseForm.allowedModels.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          const updated = isAllowed
                            ? enterpriseForm.allowedModels.filter((id) => id !== m.id)
                            : [...enterpriseForm.allowedModels, m.id];
                          setEnterpriseForm({ ...enterpriseForm, allowedModels: updated });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5",
                          isAllowed
                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                            : "bg-slate-950 border-white/10 text-slate-500",
                        )}
                      >
                        {isAllowed && <Check className="w-3 h-3" />}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contract / Provisioning Notes</label>
                <textarea
                  rows={2}
                  value={enterpriseForm.adminNotes}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, adminNotes: e.target.value })}
                  placeholder="e.g. Approved SLA: 99.9%, dedicated AI endpoint provisioned, SLA credits applicable..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEnterprise(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEnterprise}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSavingEnterprise ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Activate Customer Enterprise Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
