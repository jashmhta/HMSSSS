/*[object Object]*/
import { Module } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { EncryptionService } from './services/encryption.service';

/**
 *
 */
@Module({
  providers: [
    JwtAuthGuard,
    RolesGuard,
    LoggingInterceptor,
    TransformInterceptor,
    AllExceptionsFilter,
    EncryptionService,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    LoggingInterceptor,
    TransformInterceptor,
    AllExceptionsFilter,
    EncryptionService,
  ],
})
export class SharedModule {}
