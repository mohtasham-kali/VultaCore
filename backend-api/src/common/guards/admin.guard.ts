import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User must be authenticated before checking admin permissions');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'mohtasham.siddiqui17@gmail.com').toLowerCase().trim();
    const userEmail = (user.email || '').toLowerCase().trim();

    const isMatch = userEmail === adminEmail || user.role === 'admin' || user.app_metadata?.role === 'admin';

    if (!isMatch) {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    return true;
  }
}

