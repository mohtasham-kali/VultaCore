"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  TrendingUp,
  Users,
  Activity,
  Search,
  RefreshCw,
  Plus,
  Layers,
  Settings,
  Sparkles,
  Shield,
  Check,
  X,
  Copy,
  Archive,
  Edit,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

type AdminTab = "overview" | "plans" | "features" | "subscribers" | "enterprise";

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  type: string;
  defaultLimit: number | null;
  enterprisePrice?: number;
  isActive: boolean;
  metadata?: string | null;
}

interface PlanFeatureItem {
  featureId: string;
  isEnabled: boolean;
  limitValue: number | null;
  feature?: Feature;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  interval: string;
  isCustomPricing: boolean;
  isActive: boolean;
  isPublic: boolean;
  isPublished: boolean;
  isRecommended: boolean;
  badge?: string | null;
  displayOrder: number;
  version: number;
  inheritsPlanSlug?: string | null;
  inheritsPlanId?: string | null;
  planChangePolicy: string;
  paddlePriceIdMonth?: string | null;
  paddlePriceIdYear?: string | null;
  planFeatures?: PlanFeatureItem[];
  subscribersCount?: number;
}

interface SubscriberRow {
  userId: string;
  username: string;
  email: string;
  planName: string;
  status: string;
  billingInterval: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  isEnterpriseCustom: boolean;
  customPrice: number | null;
  customFeatures?: any;
  subscriptionId: string | null;
}

interface EnterpriseInquiry {
  id: string;
  reference: string;
  userId?: string | null;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  requestedFeatures: string; // JSON array
  numberOfUsers: string;
  expectedUsage?: string | null;
  customRequirements?: string | null;
  additionalMessage?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data states
  const [overview, setOverview] = useState<any>({
    totalPlans: 0,
    activePlans: 0,
    totalSubscribers: 0,
    freeSubscribers: 0,
    standardSubscribers: 0,
    premiumSubscribers: 0,
    enterpriseSubscribers: 0,
    mrr: 0,
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [inquiries, setInquiries] = useState<EnterpriseInquiry[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState("ALL");
  const [subscriberPlanFilter, setSubscriberPlanFilter] = useState("ALL");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("ALL");

  // Plan Modal Editor
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "developer",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    interval: "both",
    isCustomPricing: false,
    isActive: true,
    isPublic: true,
    isPublished: true,
    isRecommended: false,
    badge: "",
    displayOrder: 0,
    inheritsPlanSlug: "",
    planChangePolicy: "immediate",
    selectedFeatures: [] as { featureId: string; isEnabled: boolean; limitValue: number | null }[],
  });

  // Feature Modal Editor
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [featureForm, setFeatureForm] = useState({
    key: "",
    name: "",
    description: "",
    category: "community",
    type: "boolean",
    defaultLimit: "" as string | number,
    enterprisePrice: "5.00",
    isActive: true,
  });

  // Enterprise Customization from Inquiry/User
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [selectedUserForEnterprise, setSelectedUserForEnterprise] = useState<SubscriberRow | null>(null);
  const [enterpriseForm, setEnterpriseForm] = useState({
    approvedFeatures: [] as string[],
    featureLimits: {} as Record<string, number | null>,
    allowedModels: ["claude-3-5-sonnet-20241022", "llama-3.3-70b-versatile", "gemini-1.5-pro", "llama-3.1-8b-instant"],
    customPrice: 299,
    billingInterval: "month",
    status: "active",
    adminNotes: "",
  });

  const notify = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const loadAllData = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [resOverview, resPlans, resFeatures, resSubs, resInquiries] = await Promise.all([
        fetch(`${API_BASE_URL}/subscriptions/overview`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/plans`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/features`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/subscriptions/users`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/enterprise/inquiries`, { headers }).then((r) => r.json()).catch(() => []),
      ]);

      if (resOverview) setOverview(resOverview);
      if (Array.isArray(resPlans)) setPlans(resPlans);
      if (Array.isArray(resFeatures)) setFeatures(resFeatures);
      if (Array.isArray(resSubs)) setSubscribers(resSubs);
      if (Array.isArray(resInquiries)) setInquiries(resInquiries);
    } catch (err: any) {
      console.error("Admin subscriptions load error:", err);
      notify("Failed to load subscription administration data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Plan Management Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      slug: "",
      description: "",
      category: "developer",
      monthlyPrice: 29,
      yearlyPrice: 348,
      currency: "USD",
      interval: "both",
      isCustomPricing: false,
      isActive: true,
      isPublic: true,
      isPublished: true,
      isRecommended: false,
      badge: "",
      displayOrder: plans.length,
      inheritsPlanSlug: "",
      planChangePolicy: "immediate",
      selectedFeatures: features.map((f) => ({
        featureId: f.id,
        isEnabled: false,
        limitValue: f.defaultLimit,
      })),
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    const assignedMap = new Map(
      (plan.planFeatures || []).map((pf) => [pf.featureId, { isEnabled: pf.isEnabled, limitValue: pf.limitValue }]),
    );

    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      category: plan.category || "developer",
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
      currency: plan.currency || "USD",
      interval: plan.interval || "both",
      isCustomPricing: plan.isCustomPricing,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      isPublished: plan.isPublished,
      isRecommended: plan.isRecommended,
      badge: plan.badge || "",
      displayOrder: plan.displayOrder,
      inheritsPlanSlug: plan.inheritsPlanSlug || "",
      planChangePolicy: plan.planChangePolicy || "immediate",
      selectedFeatures: features.map((f) => {
        const assigned = assignedMap.get(f.id);
        return {
          featureId: f.id,
          isEnabled: assigned ? assigned.isEnabled : false,
          limitValue: assigned ? assigned.limitValue : f.defaultLimit,
        };
      }),
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        name: planForm.name,
        slug: planForm.slug,
        description: planForm.description,
        category: planForm.category,
        monthlyPrice: Number(planForm.monthlyPrice),
        yearlyPrice: Number(planForm.yearlyPrice),
        currency: planForm.currency,
        interval: planForm.interval,
        isCustomPricing: planForm.isCustomPricing,
        isActive: planForm.isActive,
        isPublic: planForm.isPublic,
        isPublished: planForm.isPublished,
        isRecommended: planForm.isRecommended,
        badge: planForm.badge || null,
        displayOrder: Number(planForm.displayOrder),
        inheritsPlanSlug: planForm.inheritsPlanSlug || null,
        planChangePolicy: planForm.planChangePolicy,
        features: planForm.selectedFeatures.filter((f) => f.isEnabled),
      };

      const url = editingPlan ? `${API_BASE_URL}/plans/${editingPlan.id}` : `${API_BASE_URL}/plans`;
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save plan");
      }

      notify(editingPlan ? `Plan "${planForm.name}" updated successfully` : `Plan "${planForm.name}" created successfully`);
      setIsPlanModalOpen(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error saving plan", "error");
    }
  };

  const handleDuplicatePlan = async (planId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/plans/${planId}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to duplicate plan");
      notify("Plan duplicated successfully");
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error duplicating plan", "error");
    }
  };

  const handleArchivePlan = async (planId: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to archive this plan? Existing subscribers will remain unaffected.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/plans/${planId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to archive plan");
      notify("Plan archived successfully");
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error archiving plan", "error");
    }
  };

  // Feature Registry Handlers
  const handleOpenCreateFeature = () => {
    setEditingFeature(null);
    setFeatureForm({
      key: "",
      name: "",
      description: "",
      category: "community",
      type: "boolean",
      defaultLimit: "",
      enterprisePrice: "5.00",
      isActive: true,
    });
    setIsFeatureModalOpen(true);
  };

  const handleOpenEditFeature = (feat: Feature) => {
    setEditingFeature(feat);
    setFeatureForm({
      key: feat.key,
      name: feat.name,
      description: feat.description,
      category: feat.category,
      type: feat.type,
      defaultLimit: feat.defaultLimit !== null ? feat.defaultLimit : "",
      enterprisePrice: feat.enterprisePrice !== undefined && feat.enterprisePrice !== null ? String(feat.enterprisePrice) : "5.00",
      isActive: feat.isActive,
    });
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        key: featureForm.key,
        name: featureForm.name,
        description: featureForm.description,
        category: featureForm.category,
        type: featureForm.type,
        defaultLimit: featureForm.defaultLimit === "" ? null : Number(featureForm.defaultLimit),
        enterprisePrice: featureForm.enterprisePrice === "" ? 5.0 : Number(featureForm.enterprisePrice),
        isActive: featureForm.isActive,
      };

      const url = editingFeature ? `${API_BASE_URL}/features/${editingFeature.id}` : `${API_BASE_URL}/features`;
      const method = editingFeature ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save feature");
      }

      notify(editingFeature ? `Feature "${featureForm.name}" updated` : `Feature "${featureForm.name}" created`);
      setIsFeatureModalOpen(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error saving feature", "error");
    }
  };

  // Enterprise Customization Handler
  const handleOpenCustomizeEnterprise = (sub: SubscriberRow) => {
    setSelectedUserForEnterprise(sub);
    const existingApproved = sub.customFeatures?.approvedFeatures || [
      "sla_guarantees",
      "dedicated_ai_instance",
      "phone_support_24_7",
      "private_security_hub",
      "advanced_threat_intel",
    ];

    setEnterpriseForm({
      approvedFeatures: existingApproved,
      featureLimits: sub.customFeatures?.featureLimits || {},
      allowedModels: sub.customFeatures?.allowedModels || [
        "claude-3-5-sonnet-20241022",
        "llama-3.3-70b-versatile",
        "gemini-1.5-pro",
        "llama-3.1-8b-instant",
      ],
      customPrice: sub.customPrice || 299,
      billingInterval: sub.billingInterval || "month",
      status: sub.status || "active",
      adminNotes: sub.customFeatures?.adminNotes || "",
    });
    setIsEnterpriseModalOpen(true);
  };

  const handleSaveEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserForEnterprise) return;
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/user/${selectedUserForEnterprise.userId}/enterprise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(enterpriseForm),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to customize enterprise subscription");
      }

      notify(`Enterprise plan customized for ${selectedUserForEnterprise.username}`);
      setIsEnterpriseModalOpen(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error customizing enterprise plan", "error");
    }
  };

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesSearch =
        s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.planName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = subscriberPlanFilter === "ALL" || s.planName.toLowerCase() === subscriberPlanFilter.toLowerCase();
      return matchesSearch && matchesPlan;
    });
  }, [subscribers, searchQuery, subscriberPlanFilter]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = featureCategoryFilter === "ALL" || f.category.toLowerCase() === featureCategoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [features, searchQuery, featureCategoryFilter]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch =
        inq.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = inquiryStatusFilter === "ALL" || inq.status.toLowerCase() === inquiryStatusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchQuery, inquiryStatusFilter]);

  return (
    <div className="space-y-8">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300",
            actionMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-red-500/15 border-red-500/40 text-red-300",
          )}
        >
          {actionMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header and Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
              Administration
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Subscription &amp; Entitlement Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure dynamic plans, feature registries, usage quotas, and customer-specific Enterprise agreements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-purple-400")} />
          </button>

          {activeTab === "plans" && (
            <button
              onClick={handleOpenCreatePlan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          )}

          {activeTab === "features" && (
            <button
              onClick={handleOpenCreateFeature}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Feature</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "plans", label: `Plans (${plans.length})`, icon: Layers },
          { id: "features", label: `Feature Registry (${features.length})`, icon: Sliders },
          { id: "subscribers", label: `Subscribers (${subscribers.length})`, icon: Users },
          { id: "enterprise", label: `Enterprise Inquiries (${inquiries.length})`, icon: Shield },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUBSCRIPTION OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Subscribers</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{overview.totalSubscribers}</div>
              <div className="text-xs text-slate-500 mt-1">Across all registered user accounts</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active MRR</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">${overview.mrr}</div>
              <div className="text-xs text-slate-500 mt-1">Monthly Recurring Revenue projection</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Dynamic Plans</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{overview.activePlans}</div>
              <div className="text-xs text-slate-500 mt-1">{overview.totalPlans} total configured plans</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Enterprise Accounts</span>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{overview.enterpriseSubscribers}</div>
              <div className="text-xs text-slate-500 mt-1">Custom isolated SLAs &amp; models</div>
            </div>
          </div>

          {/* Plan Distribution Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Subscriber Tier Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5">
                <div className="text-xs text-slate-500 font-semibold uppercase">Free Tier</div>
                <div className="text-2xl font-extrabold text-white mt-1">{overview.freeSubscribers}</div>
                <div className="text-[10px] text-slate-500 mt-1">5 AI msgs/day quota</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 font-semibold uppercase">Standard ($29)</div>
                <div className="text-2xl font-extrabold text-white mt-1">{overview.standardSubscribers}</div>
                <div className="text-[10px] text-slate-400 mt-1">Gemini Pro &amp; API access</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <div className="text-xs text-purple-400 font-semibold uppercase">Premium ($99)</div>
                <div className="text-2xl font-extrabold text-white mt-1">{overview.premiumSubscribers}</div>
                <div className="text-[10px] text-slate-400 mt-1">Claude 3, Llama 3 &amp; Security Hub</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="text-xs text-blue-400 font-semibold uppercase">Enterprise (Custom)</div>
                <div className="text-2xl font-extrabold text-white mt-1">{overview.enterpriseSubscribers}</div>
                <div className="text-[10px] text-slate-400 mt-1">Custom SLAs &amp; dedicated weights</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLANS MANAGEMENT */}
      {activeTab === "plans" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((p) => {
              const activeFeatures = (p.planFeatures || []).filter((pf) => pf.isEnabled);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative flex flex-col p-6 rounded-2xl bg-slate-900 border transition-all shadow-xl",
                    p.isRecommended ? "border-purple-500/50" : "border-white/10",
                    !p.isActive && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{p.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          /{p.slug}
                        </span>
                        {p.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                            {p.badge}
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white">
                        {p.isCustomPricing ? "Custom" : `$${p.monthlyPrice}`}
                        {!p.isCustomPricing && <span className="text-xs text-slate-500">/mo</span>}
                      </div>
                      {!p.isCustomPricing && (
                        <div className="text-[10px] text-slate-500">${p.yearlyPrice}/yr billed annually</div>
                      )}
                    </div>
                  </div>

                  {/* Feature Pills */}
                  <div className="flex-1 mb-6">
                    <div className="text-xs font-semibold text-slate-400 mb-2">
                      Enabled Features ({activeFeatures.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFeatures.map((pf, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-white/5 text-slate-300 flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{pf.feature?.name || pf.featureId}</span>
                          {pf.limitValue && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded">
                              {pf.limitValue}/d
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>v{p.version}</span>
                      <span>•</span>
                      <span>Order: {p.displayOrder}</span>
                      <span>•</span>
                      <span>{p.isPublished ? "Published" : "Draft"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPlan(p)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Edit Plan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicatePlan(p.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Duplicate Plan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {p.isActive && (
                        <button
                          onClick={() => handleArchivePlan(p.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                          title="Archive Plan"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FEATURE REGISTRY */}
      {activeTab === "features" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {["ALL", "community", "ai", "analytics", "security", "api", "enterprise"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFeatureCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors",
                    featureCategoryFilter === cat
                      ? "bg-purple-500 text-white"
                      : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Internal Key</th>
                  <th className="px-5 py-3">Display Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Default Limit</th>
                  <th className="px-5 py-3">Ent. Price</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFeatures.map((f) => (
                  <tr key={f.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-purple-400">{f.key}</td>
                    <td className="px-5 py-3 font-semibold text-white">
                      <div>{f.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{f.description}</div>
                    </td>
                    <td className="px-5 py-3 uppercase text-slate-400">{f.category}</td>
                    <td className="px-5 py-3 uppercase text-slate-400">{f.type}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono">
                      {f.defaultLimit === null ? "Unlimited" : `${f.defaultLimit}/day`}
                    </td>
                    <td className="px-5 py-3 text-emerald-400 font-mono font-bold">
                      ${Number(f.enterprisePrice !== undefined && f.enterprisePrice !== null ? f.enterprisePrice : 5.0).toFixed(2)}/mo
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenEditFeature(f)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER SUBSCRIBERS */}
      {activeTab === "subscribers" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {["ALL", "Free", "Standard", "Premium", "Enterprise"].map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSubscriberPlanFilter(plan)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors",
                    subscriberPlanFilter === plan
                      ? "bg-purple-500 text-white"
                      : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white",
                  )}
                >
                  {plan}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or email..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Interval</th>
                  <th className="px-5 py-3">Custom Enterprise</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubscribers.map((s) => (
                  <tr key={s.userId} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-bold text-white">{s.username}</div>
                      <div className="text-[10px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-white">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          s.planName === "Enterprise"
                            ? "bg-blue-500/20 text-blue-300"
                            : s.planName === "Premium"
                            ? "bg-purple-500/20 text-purple-300"
                            : s.planName === "Standard"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-400",
                        )}
                      >
                        {s.planName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 uppercase text-slate-400">{s.billingInterval}</td>
                    <td className="px-5 py-3">
                      {s.isEnterpriseCustom ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                          Custom Overrides
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenCustomizeEnterprise(s)}
                        className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-semibold transition-colors"
                      >
                        Customize Enterprise
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ENTERPRISE INQUIRIES */}
      {activeTab === "enterprise" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Seats</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                      No enterprise inquiries received yet.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inq) => {
                    let reqList: string[] = [];
                    try {
                      reqList = JSON.parse(inq.requestedFeatures);
                    } catch {
                      reqList = [];
                    }

                    return (
                      <tr key={inq.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-purple-400">{inq.reference}</td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-white">{inq.fullName}</div>
                          <div className="text-[10px] text-slate-500">{inq.email}</div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-300">{inq.companyName}</td>
                        <td className="px-5 py-3 text-slate-400">{inq.numberOfUsers}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold uppercase">
                            {inq.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              // Find user or match email
                              const userSub = subscribers.find(
                                (s) => s.email.toLowerCase() === inq.email.toLowerCase(),
                              );
                              if (userSub) {
                                handleOpenCustomizeEnterprise(userSub);
                              } else {
                                alert(`No registered account found matching ${inq.email}. User must register first.`);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold transition-all hover:brightness-110"
                          >
                            Customize Agreement
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAN MODAL EDITOR */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-extrabold text-white mb-6">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Subscription Plan"}
            </h2>

            <form onSubmit={handleSavePlan} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Developer Pro"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unique Slug</label>
                  <input
                    type="text"
                    value={planForm.slug}
                    onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                    placeholder="e.g. developer-pro"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    value={planForm.monthlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    value={planForm.yearlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Billing Interval</label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="both">Both Monthly &amp; Annual</option>
                    <option value="month">Monthly Only</option>
                    <option value="year">Annual Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={planForm.displayOrder}
                    onChange={(e) => setPlanForm({ ...planForm, displayOrder: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Inherit Features From (Hierarchy)
                  </label>
                  <select
                    value={planForm.inheritsPlanSlug}
                    onChange={(e) => setPlanForm({ ...planForm, inheritsPlanSlug: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  >
                    <option value="">None (Root Tier - e.g. Free)</option>
                    <option value="free">Free Plan (Inherit Free features)</option>
                    <option value="standard">Standard Plan (Inherit Free + Standard)</option>
                    <option value="premium">Premium Plan (Inherit Free + Standard + Premium)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={planForm.isCustomPricing}
                      onChange={(e) => setPlanForm({ ...planForm, isCustomPricing: e.target.checked })}
                      className="rounded bg-slate-950 border-white/20"
                    />
                    <span>Custom Pricing (Contact Sales flow)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={planForm.isRecommended}
                      onChange={(e) => setPlanForm({ ...planForm, isRecommended: e.target.checked })}
                      className="rounded bg-slate-950 border-white/20"
                    />
                    <span>Recommended Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={planForm.isPublished}
                      onChange={(e) => setPlanForm({ ...planForm, isPublished: e.target.checked })}
                      className="rounded bg-slate-950 border-white/20"
                    />
                    <span>Published to Website</span>
                  </label>
                </div>
              </div>

              {/* Assign Features */}
              <div className="border-t border-white/10 pt-4">
                <div className="font-bold text-sm text-white mb-3">Assign Features from Registry</div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {features.map((feat) => {
                    const selected = planForm.selectedFeatures.find((f) => f.featureId === feat.id);
                    const isEnabled = Boolean(selected?.isEnabled);

                    return (
                      <div
                        key={feat.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
                          isEnabled ? "bg-purple-500/10 border-purple-500/30" : "bg-slate-950 border-white/5",
                        )}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const updated = planForm.selectedFeatures.map((sf) =>
                                sf.featureId === feat.id ? { ...sf, isEnabled: e.target.checked } : sf,
                              );
                              if (!updated.some((sf) => sf.featureId === feat.id)) {
                                updated.push({ featureId: feat.id, isEnabled: e.target.checked, limitValue: feat.defaultLimit });
                              }
                              setPlanForm({ ...planForm, selectedFeatures: updated });
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white">{feat.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{feat.key}</div>
                          </div>
                        </label>

                        {isEnabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Limit:</span>
                            <input
                              type="number"
                              placeholder="Uncapped"
                              value={selected?.limitValue ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value);
                                const updated = planForm.selectedFeatures.map((sf) =>
                                  sf.featureId === feat.id ? { ...sf, limitValue: val } : sf,
                                );
                                setPlanForm({ ...planForm, selectedFeatures: updated });
                              }}
                              className="w-20 bg-slate-900 border border-white/10 rounded-lg py-1 px-2 text-white text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEATURE MODAL EDITOR */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsFeatureModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-white mb-4">
              {editingFeature ? `Edit Feature: ${editingFeature.name}` : "Register New Feature"}
            </h2>

            <form onSubmit={handleSaveFeature} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Feature Key * (Unique &amp; Stable)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingFeature)}
                  value={featureForm.key}
                  onChange={(e) => setFeatureForm({ ...featureForm, key: e.target.value })}
                  placeholder="e.g. darknet_leak_monitor"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={featureForm.name}
                  onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                  placeholder="e.g. Darknet Leak Monitor"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  placeholder="What does this feature unlock?"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={featureForm.category}
                    onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="community">Community</option>
                    <option value="ai">AI</option>
                    <option value="analytics">Analytics</option>
                    <option value="security">Security</option>
                    <option value="api">API</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Default Daily Quota</label>
                  <input
                    type="number"
                    placeholder="Uncapped"
                    value={featureForm.defaultLimit}
                    onChange={(e) => setFeatureForm({ ...featureForm, defaultLimit: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Enterprise Add-On Price ($/mo)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={featureForm.enterprisePrice}
                    onChange={(e) => setFeatureForm({ ...featureForm, enterprisePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold"
                >
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENTERPRISE CUSTOMIZATION MODAL */}
      {isEnterpriseModalOpen && selectedUserForEnterprise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                Enterprise Custom Agreement
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Customize Enterprise: {selectedUserForEnterprise.username}
              </h2>
              <p className="text-xs text-slate-400">{selectedUserForEnterprise.email}</p>
            </div>

            <form onSubmit={handleSaveEnterprise} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreed Monthly Price ($)</label>
                  <input
                    type="number"
                    value={enterpriseForm.customPrice}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, customPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreement Status</label>
                  <select
                    value={enterpriseForm.status}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Approve Specific Features */}
              <div>
                <label className="block font-bold text-sm text-white mb-2">
                  Select Customer-Approved Features (Isolated Access)
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
                            : "bg-slate-950 border-white/5 text-slate-400",
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

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contract / Provisioning Notes</label>
                <textarea
                  rows={2}
                  value={enterpriseForm.adminNotes}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, adminNotes: e.target.value })}
                  placeholder="e.g. Provisioned dedicated private instance on VPC us-east-1..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEnterpriseModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                >
                  Activate Custom Enterprise Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
