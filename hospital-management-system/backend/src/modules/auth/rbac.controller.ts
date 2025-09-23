/*[object Object]*/
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';

import { RBACService, RolePermissions } from './rbac.service';
import { RolesGuard } from './roles.guard';

/**
 *
 */
@ApiTags('rbac')
@ApiBearerAuth()
@Controller('rbac')
@UseGuards(RolesGuard)
export class RBACController {
  /**
   *
   */
  constructor(private readonly rbacService: RBACService) {}

  /**
   *
   */
  @Get('roles')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all roles and their permissions' })
  @ApiResponse({
    status: 200,
    description: 'Roles and permissions retrieved successfully',
    type: [Object],
  })
  async getAllRoles(): Promise<RolePermissions[]> {
    return this.rbacService.getAllRoles();
  }

  /**
   *
   */
  @Get('permissions')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get permissions for current user role' })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
  })
  async getUserPermissions(@Request() req: any) {
    const permissions = this.rbacService.getRolePermissions(req.user.role);
    return {
      role: req.user.role,
      permissions,
      count: permissions.length,
    };
  }

  /**
   *
   */
  @Get('hierarchy')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get role hierarchy' })
  @ApiResponse({
    status: 200,
    description: 'Role hierarchy retrieved successfully',
  })
  async getRoleHierarchy() {
    return this.rbacService.getRoleHierarchy();
  }
}
