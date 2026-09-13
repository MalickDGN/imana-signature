import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminRequest } from './admin-auth.guard';

/** Reads the AdminUser that AdminAccessGuard already resolved onto the request. */
export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AdminRequest>();
    return request.adminUser;
  },
);
