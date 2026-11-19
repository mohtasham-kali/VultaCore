"use client";

import { useState, useEffect, useMemo } from "react";
import { User as UserIcon, Search, ShieldCheck, RefreshCw, Loader2, Check } from "lucide-react";
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

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const token = session?.access_token;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      // Fallback: try fetching public or keep list empty
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
        prev.map((u) => (u.id === userId ? { ...u, rank: newRank } : u))
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
          "Failed to update user tier. Make sure you are signed in as an administrator."
      );
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setUpdatingId(null);
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
        u.rank?.toLowerCase().includes(query)
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
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <p className="text-emerald-400 font-semibold text-sm">✓ {syncStatus}</p>
          <button
            onClick={() => setSyncStatus(null)}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <p className="text-red-400 font-semibold text-sm">⚠️ {errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
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
                Status
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
                              : "text-slate-400"
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
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
