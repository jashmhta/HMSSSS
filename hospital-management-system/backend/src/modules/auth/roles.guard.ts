/*[object Object]*/
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { RBACService } from './rbac.service';

/**
 *
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   *
   */
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  /**
   *
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      return false;
    }

    // Check role-based access
    if (requiredRoles) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check permission-based access
    if (requiredPermissions) {
      for (const permission of requiredPermissions) {
        const [resource, action] = permission.split('.');
        const hasPermission = await this.rbacService.hasPermission(user.id, resource, action);

        if (!hasPermission) {
          // Check if user can access specific patient data
          if (resource === 'patients' && request.params?.id) {
            const canAccessPatient = await this.rbacService.canAccessPatientData(
              user.id,
              request.params.id,
              action,
            );
            if (!canAccessPatient) {
              throw new ForbiddenException(`Access denied to patient data: ${permission}`);
            }
          } else {
            throw new ForbiddenException(`Insufficient permissions: ${permission}`);
          }
        }
      }
    }

    // Validate business rules
    if (requiredPermissions && request.body) {
      const action = requiredPermissions[0]?.split('.')[1] || 'access';
      const resource = requiredPermissions[0]?.split('.')[0] || 'unknown';

      await this.rbacService.validateBusinessRules(user.id, action, resource, request.body);
    }

    return true;
  }
}
