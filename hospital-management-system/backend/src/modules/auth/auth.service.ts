/*[object Object]*/
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';

import { MFAService } from './mfa.service';

/**
 *
 */
@Injectable()
export class AuthService {
  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mfaService: MFAService,
  ) {}

  /**
   *
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true,
        nurse: true,
        receptionist: true,
        labTechnician: true,
        pharmacist: true,
        admin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  /**
   *
   */
  private async handleFailedLogin(userId: string, currentAttempts: number) {
    const newAttempts = currentAttempts + 1;
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    if (newAttempts >= maxAttempts) {
      // Lock account
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: new Date(Date.now() + lockoutDuration),
        },
      });
    } else {
      // Just increment attempts
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
        },
      });
    }
  }

  /**
   *
   */
  async login(user: any) {
    const mfaRequired = await this.mfaService.isMFARequired(user.id);

    if (mfaRequired) {
      // Return temporary token for MFA verification
      const tempPayload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        mfaRequired: true,
        temp: true,
      };

      return {
        requiresMFA: true,
        temp_token: this.jwtService.sign(tempPayload, { expiresIn: '5m' }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    }

    // Generate full access token
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   *
   */
  async verifyMFA(tempToken: string, mfaToken: string) {
    try {
      const decoded = this.jwtService.verify(tempToken);
      if (!decoded.temp || !decoded.mfaRequired) {
        throw new UnauthorizedException('Invalid token');
      }

      const isValidMFA = await this.mfaService.verifyTOTP(decoded.sub, mfaToken);
      if (!isValidMFA) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      // Generate full access token
      const payload = {
        email: decoded.email,
        sub: decoded.sub,
        role: decoded.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: decoded.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('MFA verification failed');
    }
  }

  /**
   *
   */
  async verifyBackupCode(tempToken: string, backupCode: string) {
    try {
      const decoded = this.jwtService.verify(tempToken);
      if (!decoded.temp || !decoded.mfaRequired) {
        throw new UnauthorizedException('Invalid token');
      }

      const isValidBackup = await this.mfaService.verifyBackupCode(decoded.sub, backupCode);
      if (!isValidBackup) {
        throw new UnauthorizedException('Invalid backup code');
      }

      // Generate full access token
      const payload = {
        email: decoded.email,
        sub: decoded.sub,
        role: decoded.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: decoded.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Backup code verification failed');
    }
  }

  /**
   *
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as any,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  /**
   *
   */
  async loginWithCredentials(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.login(user);
  }

  /**
   *
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   *
   */
  async logout(userId: string) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just log the logout
    console.log(`User ${userId} logged out`);
    return { success: true };
  }

  /**
   *
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   *
   */
  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   *
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   *
   */
  async getAllUsers(page: number = 1, limit: number = 10, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   *
   */
  async updateUserRole(userId: string, newRole: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  /**
   *
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   *
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token (in a real app, this would be sent via email)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Here you would typically send an email with the reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true, message: 'Password reset email sent' };
  }

  /**
   *
   */
  async confirmPasswordReset(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || user.email !== decoded.email) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   *
   */
  async getAuditLogs(page: number = 1, limit: number = 10, userId?: string, action?: string) {
    // This is a placeholder - in a real application, you would have an audit log table
    const logs = [
      {
        id: '1',
        userId: userId || 'user1',
        action: action || 'login',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: 'User logged in',
      },
    ];

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total: logs.length,
        pages: 1,
      },
    };
  }
}
