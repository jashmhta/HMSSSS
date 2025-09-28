/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessMonitoringService } from './access-monitoring.service';
import { ComplianceDashboardService } from './compliance-dashboard.service';
import { AutomatedComplianceService } from './automated-compliance.service';

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
    AutomatedComplianceService,
  ],
  exports: [
    ComplianceService,
    DataRetentionService,
    AccessMonitoringService,
    ComplianceDashboardService,
    AutomatedComplianceService,
  ], // Export services for use in other modules
})
export class ComplianceModule {}
