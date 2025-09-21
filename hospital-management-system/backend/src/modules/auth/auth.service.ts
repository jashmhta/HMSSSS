import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { MFAService } from './mfa.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mfaService: MFAService,
  ) {}

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
}
