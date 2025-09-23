/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessMonitoringService } from './access-monitoring.service';
import { ComplianceDashboardService } from './compliance-dashboard.service';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    DataRetentionService,
    AccessMonitoringService,
    ComplianceDashboardService,
  ],
  exports: [
    ComplianceService,
    DataRetentionService,
    AccessMonitoringService,
    ComplianceDashboardService,
  ], // Export services for use in other modules
})
export class ComplianceModule {}
