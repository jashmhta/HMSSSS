import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenantId from the authenticated user
 */
export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return user?.tenantId;
});
