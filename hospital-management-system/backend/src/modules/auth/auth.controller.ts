/*[object Object]*/
import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  Patch,
  Param,
  Query,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { MFAService, SetupMFAResult, VerifyMFAResult } from './mfa.service';
import { RBACService } from './rbac.service';

/**
 *
 */
@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  /**
   *
   */
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MFAService,
    private readonly rbacService: RBACService,
  ) {}

  /**
   *
   */
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      return await this.authService.loginWithCredentials(loginDto.email, loginDto.password);
    } catch (error) {
      this.logger.error(`Login failed for email: ${loginDto.email}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   *
   */
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(
    @Body()
    registerDto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role?: UserRole;
    },
  ) {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);
      return await this.authService.register({
        ...registerDto,
        role: registerDto.role || 'PATIENT',
      });
    } catch (error) {
      this.logger.error(`Registration failed for email: ${registerDto.email}`, error.stack);
      throw new BadRequestException('Registration failed');
    }
  }

  /**
   *
   */
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(@Body() refreshTokenDto: { refreshToken: string }) {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   *
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req) {
    try {
      await this.authService.logout(req.user.sub);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new BadRequestException('Logout failed');
    }
  }

  /**
   *
   */
  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async setupMFA(@Request() req) {
    try {
      return await this.mfaService.setupMFA(req.user.sub);
    } catch (error) {
      throw new BadRequestException('MFA setup failed');
    }
  }

  /**
   *
   */
  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA verified successfully' })
  async verifyMFA(@Request() req, @Body() verifyDto: { token: string; backupCode?: string }) {
    try {
      return await this.mfaService.verifyMFA(req.user.sub, verifyDto.token, verifyDto.backupCode);
    } catch (error) {
      throw new BadRequestException('Invalid MFA token');
    }
  }

  /**
   *
   */
  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  async disableMFA(@Request() req, @Body() disableDto: { password: string }) {
    try {
      return await this.mfaService.disableMFAWithPassword(req.user.sub, disableDto.password);
    } catch (error) {
      throw new BadRequestException('Failed to disable MFA');
    }
  }

  /**
   *
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    try {
      return await this.authService.getProfile(req.user.sub);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   *
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req,
    @Body()
    updateDto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ) {
    try {
      return await this.authService.updateProfile(req.user.sub, updateDto);
    } catch (error) {
      throw new BadRequestException('Profile update failed');
    }
  }

  /**
   *
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Request() req,
    @Body()
    passwordDto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    try {
      return await this.authService.changePassword(
        req.user.sub,
        passwordDto.currentPassword,
        passwordDto.newPassword,
      );
    } catch (error) {
      throw new BadRequestException('Password change failed');
    }
  }

  /**
   *
   */
  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getUserPermissions(@Request() req) {
    try {
      return await this.rbacService.getRolePermissions(req.user.role);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve permissions');
    }
  }

  /**
   *
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    try {
      return await this.authService.getAllUsers(page, limit, role, search);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  /**
   *
   */
  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    try {
      return await this.authService.getUserById(id);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   *
   */
  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateUserRole(@Param('id') id: string, @Body() roleDto: { role: UserRole }) {
    try {
      return await this.authService.updateUserRole(id, roleDto.role);
    } catch (error) {
      throw new BadRequestException('Failed to update user role');
    }
  }

  /**
   *
   */
  @Patch('users/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateUserStatus(@Param('id') id: string, @Body() statusDto: { isActive: boolean }) {
    try {
      return await this.authService.updateUserStatus(id, statusDto.isActive);
    } catch (error) {
      throw new BadRequestException('Failed to update user status');
    }
  }

  /**
   *
   */
  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async requestPasswordReset(@Body() resetDto: { email: string }) {
    try {
      return await this.authService.requestPasswordReset(resetDto.email);
    } catch (error) {
      throw new BadRequestException('Password reset request failed');
    }
  }

  /**
   *
   */
  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async confirmPasswordReset(@Body() confirmDto: { token: string; newPassword: string }) {
    try {
      return await this.authService.confirmPasswordReset(confirmDto.token, confirmDto.newPassword);
    } catch (error) {
      throw new BadRequestException('Password reset confirmation failed');
    }
  }

  /**
   *
   */
  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    try {
      return await this.authService.getAuditLogs(page, limit, userId, action);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve audit logs');
    }
  }
}
