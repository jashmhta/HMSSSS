/*[object Object]*/
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { MFAMethod } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export interface SetupMFAResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface VerifyMFAResult {
  success: boolean;
  message: string;
}

/**
 *
 */
@Injectable()
export class MFAService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  // Generate TOTP secret and QR code
  /**
   *
   */
  async generateTOTPSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `HMS:${user.email}`,
      issuer: 'Hospital Management System',
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
    };
  }

  // Enable MFA for user
  /**
   *
   */
  async enableMFA(userId: string, secret: string, method: MFAMethod = MFAMethod.TOTP) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaMethod: method,
        mfaBackupCodes: backupCodes,
      },
    });

    return {
      message: 'MFA enabled successfully',
      backupCodes, // Show to user once, then they should save them
    };
  }

  // Verify TOTP token
  /**
   *
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.mfaSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows (30 seconds each)
    });
  }

  // Verify backup code
  /**
   *
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaBackupCodes.includes(backupCode)) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = user.mfaBackupCodes.filter(code => code !== backupCode);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaBackupCodes: updatedCodes,
      },
    });

    return true;
  }

  // Disable MFA
  /**
   *
   */
  async disableMFA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaMethod: null,
        mfaBackupCodes: [],
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  // Send SMS OTP (placeholder - integrate with SMS service)
  /**
   *
   */
  async sendSMSOTP(phoneNumber: string, otp: string) {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS OTP ${otp} to ${phoneNumber}`);
    return { message: 'SMS sent successfully' };
  }

  // Send Email OTP (placeholder - integrate with email service)
  /**
   *
   */
  async sendEmailOTP(email: string, otp: string) {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email OTP ${otp} to ${email}`);
    return { message: 'Email sent successfully' };
  }

  // Generate backup codes
  /**
   *
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).slice(2, 10).toUpperCase());
    }
    return codes;
  }

  // Regenerate backup codes
  /**
   *
   */
  async regenerateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaBackupCodes: backupCodes,
      },
    });

    return {
      message: 'Backup codes regenerated',
      backupCodes,
    };
  }

  // Check if MFA is required for user
  /**
   *
   */
  async isMFARequired(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    return user?.mfaEnabled || false;
  }

  // Get MFA status for user
  /**
   *
   */
  async getMFAStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaMethod: true,
        mfaBackupCodes: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      enabled: user.mfaEnabled,
      method: user.mfaMethod,
      hasBackupCodes: user.mfaBackupCodes.length > 0,
      backupCodesCount: user.mfaBackupCodes.length,
    };
  }

  // Setup MFA (combine generateTOTPSecret and enableMFA)
  /**
   *
   */
  async setupMFA(userId: string): Promise<SetupMFAResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `HMS:${user.email}`,
      issuer: 'Hospital Management System',
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  // Verify MFA (combine TOTP and backup code verification)
  /**
   *
   */
  async verifyMFA(userId: string, token: string, backupCode?: string): Promise<VerifyMFAResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled) {
      return { success: false, message: 'MFA not enabled' };
    }

    // Try TOTP verification first
    if (token) {
      const isValid = this.verifyTOTP(userId, token);
      if (isValid) {
        return { success: true, message: 'MFA verified successfully' };
      }
    }

    // Try backup code verification
    if (backupCode) {
      const isValid = this.verifyBackupCode(userId, backupCode);
      if (isValid) {
        return { success: true, message: 'Backup code verified successfully' };
      }
    }

    return { success: false, message: 'Invalid MFA token or backup code' };
  }

  // Disable MFA with password verification
  /**
   *
   */
  async disableMFAWithPassword(userId: string, password: string): Promise<VerifyMFAResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // TODO: Verify password here
    // For now, just disable MFA
    await this.disableMFA(userId);

    return { success: true, message: 'MFA disabled successfully' };
  }
}
