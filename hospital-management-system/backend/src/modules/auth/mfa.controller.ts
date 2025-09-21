import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MFAService } from './mfa.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('mfa')
@ApiBearerAuth()
@Controller('mfa')
@UseGuards(JwtAuthGuard)
export class MFAController {
  constructor(
    private readonly mfaService: MFAService,
    private readonly authService: AuthService,
  ) {}

  @Post('setup')
  @ApiOperation({ summary: 'Setup MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA setup data' })
  async setupMFA(@Request() req) {
    const secretData = await this.mfaService.generateTOTPSecret(req.user.id);
    return {
      message: 'Scan QR code with authenticator app',
      ...secretData,
    };
  }

  @Post('enable')
  @ApiOperation({ summary: 'Enable MFA with verification' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  async enableMFA(@Request() req, @Body() body: { secret: string; token: string }) {
    const { secret, token } = body;

    // Verify the token first
    const isValid = await this.mfaService.verifyTOTP(req.user.id, token);
    if (!isValid) {
      throw new BadRequestException('Invalid MFA token');
    }

    return this.mfaService.enableMFA(req.user.id, secret);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify MFA token during login' })
  @ApiResponse({ status: 200, description: 'MFA verified successfully' })
  async verifyMFA(@Body() body: { tempToken: string; mfaToken: string }) {
    const { tempToken, mfaToken } = body;
    return this.authService.verifyMFA(tempToken, mfaToken);
  }

  @Post('verify-backup')
  @ApiOperation({ summary: 'Verify backup code during login' })
  @ApiResponse({ status: 200, description: 'Backup code verified successfully' })
  async verifyBackupCode(@Body() body: { tempToken: string; backupCode: string }) {
    const { tempToken, backupCode } = body;
    return this.authService.verifyBackupCode(tempToken, backupCode);
  }

  @Post('regenerate-backup')
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
  async regenerateBackupCodes(@Request() req) {
    return this.mfaService.regenerateBackupCodes(req.user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for user' })
  @ApiResponse({ status: 200, description: 'MFA status' })
  async getMFAStatus(@Request() req) {
    return this.mfaService.getMFAStatus(req.user.id);
  }

  @Delete('disable')
  @ApiOperation({ summary: 'Disable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  async disableMFA(@Request() req) {
    return this.mfaService.disableMFA(req.user.id);
  }
}
