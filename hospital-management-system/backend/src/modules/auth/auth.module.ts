/*[object Object]*/
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DatabaseModule } from '../../database/database.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MFAController } from './mfa.controller';
import { RBACController } from './rbac.controller';
import { MFAService } from './mfa.service';
import { RBACService } from './rbac.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 *
 */
@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, MFAController, RBACController],
  providers: [AuthService, MFAService, RBACService, JwtStrategy, LocalStrategy],
  exports: [AuthService, MFAService, RBACService],
})
export class AuthModule {}
