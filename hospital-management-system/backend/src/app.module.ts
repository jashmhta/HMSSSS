import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';

// Core modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';

// HMS Feature modules
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { OPDModule } from './modules/opd/opd.module';
import { IPDModule } from './modules/ipd/ipd.module';
import { OTModule } from './modules/ot/ot.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { BloodBankModule } from './modules/blood-bank/blood-bank.module';
import { BillingModule } from './modules/billing/billing.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { PriceEstimatorModule } from './modules/price-estimator/price-estimator.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { StaffModule } from './modules/staff/staff.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

// Shared modules
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // requests per ttl
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),

    // Background jobs
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Database
    DatabaseModule,

    // Core modules
    AuthModule,

    // HMS Feature modules
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PharmacyModule,
    LaboratoryModule,
    RadiologyModule,
    OPDModule,
    IPDModule,
    OTModule,
    EmergencyModule,
    BloodBankModule,
    BillingModule,
    SuperadminModule,
    PriceEstimatorModule,
    AccountingModule,
    StaffModule,
    InventoryModule,
    ReportsModule,
    ComplianceModule,

    // Shared utilities
    SharedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}