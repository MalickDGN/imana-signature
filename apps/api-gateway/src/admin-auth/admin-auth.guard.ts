import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthService, AdminUser } from './admin-auth.service';
import { AdminRole, hasAnyRole } from './roles';

export const ADMIN_ROLES_KEY = 'admin_roles';

export const RequireRoles = (...roles: AdminRole[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);

export interface AdminRequest {
  headers: Record<string, string | string[] | undefined>;
  adminUser?: AdminUser;
}

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    this.auth.assertImportToken(header(request, 'x-admin-import-token'));
    const user = await this.auth.resolveSession(
      header(request, 'x-admin-session'),
    );
    request.adminUser = user;
    const allowed =
      this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (allowed.length > 0 && !hasAnyRole(user.roles, allowed)) {
      throw new ForbiddenException('Droits insuffisants pour cette action.');
    }
    return true;
  }
}

function header(
  request: AdminRequest,
  name: string,
): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
