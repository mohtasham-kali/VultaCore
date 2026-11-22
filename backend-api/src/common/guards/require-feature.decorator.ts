import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'require_feature';

/**
 * Decorator to enforce that the authenticated user must have an active entitlement
 * to the specified feature key in their dynamic subscription.
 *
 * Example:
 *   @UseGuards(SupabaseAuthGuard, EntitlementGuard)
 *   @RequireFeature('private_security_hub')
 *   @Get('security-hub')
 */
export const RequireFeature = (featureKey: string) => SetMetadata(REQUIRE_FEATURE_KEY, featureKey);

