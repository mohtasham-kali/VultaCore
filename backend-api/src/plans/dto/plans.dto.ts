export interface PlanFeatureAssignmentDto {
  featureId: string;
  isEnabled?: boolean;
  limitValue?: number | null;
  config?: Record<string, any> | string;
}

export class CreatePlanDto {
  name: string;
  slug?: string;
  description?: string;
  category?: string; // 'developer' | 'security' | 'enterprise' | 'general'
  monthlyPrice: number;
  yearlyPrice?: number;
  currency?: string;
  interval?: string; // 'month' | 'year' | 'both'
  isCustomPricing?: boolean;
  isActive?: boolean;
  isPublic?: boolean;
  isPublished?: boolean;
  isRecommended?: boolean;
  badge?: string;
  displayOrder?: number;
  inheritsPlanId?: string;
  inheritsPlanSlug?: string;
  planChangePolicy?: string; // 'immediate' | 'renewal' | 'new_subscribers'
  paddlePriceIdMonth?: string;
  paddlePriceIdYear?: string;
  features?: PlanFeatureAssignmentDto[];
}

export class UpdatePlanDto {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency?: string;
  interval?: string;
  isCustomPricing?: boolean;
  isActive?: boolean;
  isPublic?: boolean;
  isPublished?: boolean;
  isRecommended?: boolean;
  badge?: string;
  displayOrder?: number;
  inheritsPlanId?: string;
  inheritsPlanSlug?: string;
  planChangePolicy?: string;
  paddlePriceIdMonth?: string;
  paddlePriceIdYear?: string;
  features?: PlanFeatureAssignmentDto[];
}

export class CreateFeatureDto {
  key: string;
  name: string;
  description?: string;
  category?: string; // 'community' | 'ai' | 'analytics' | 'security' | 'api' | 'enterprise'
  type?: string; // 'boolean' | 'quota' | 'tier'
  defaultLimit?: number | null;
  enterprisePrice?: number;
  isActive?: boolean;
  metadata?: Record<string, any> | string;
}

export class UpdateFeatureDto {
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  defaultLimit?: number | null;
  enterprisePrice?: number;
  isActive?: boolean;
  metadata?: Record<string, any> | string;
}

export class CalculateEnterprisePriceDto {
  basePrice?: number;
  selectedFeatures: string[];
  customFeaturePrices?: Record<string, number>;
}

export class EnterpriseInquiryDto {
  fullName: string;
  companyName: string;
  email: string;
  phone?: string;
  requestedFeatures: string[];
  numberOfUsers?: string;
  expectedUsage?: string;
  customRequirements?: string;
  additionalMessage?: string;
  userId?: string;
}

export class CustomizeEnterpriseDto {
  approvedFeatures: string[]; // List of feature keys
  featureLimits?: Record<string, number | null>; // featureKey -> limit
  allowedModels?: string[];
  customPrice?: number;
  billingInterval?: string; // 'month' | 'year' | 'custom'
  startDate?: string;
  expirationDate?: string;
  status?: string; // 'active' | 'suspended' | 'expired'
  adminNotes?: string;
}

