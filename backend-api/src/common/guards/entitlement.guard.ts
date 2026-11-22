import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY } from './require-feature.decorator';
import { EntitlementsService } from '../../plans/entitlements.service';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required to verify subscription entitlements');
    }

    const hasAccess = await this.entitlementsService.hasEntitlement(user.id, requiredFeature);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Feature "${requiredFeature}" is not included in your active subscription plan. Please upgrade at /subscription to unlock access.`,
      );
    }

    return true;
  }
}

