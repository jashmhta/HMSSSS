import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LaboratoryService } from './laboratory.service';
import { LISIntegrationService } from './lis-integration.service';
import { BarcodeService } from './barcode.service';
import { LabReportService } from './lab-report.service';
import { QualityControlService } from './quality-control.service';
import { LabInventoryService } from './lab-inventory.service';
import { LabAnalyticsService } from './lab-analytics.service';
import { LaboratoryController } from './laboratory.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [LaboratoryController],
  providers: [
    LaboratoryService,
    LISIntegrationService,
    BarcodeService,
    LabReportService,
    QualityControlService,
    LabInventoryService,
    LabAnalyticsService,
  ],
  exports: [
    LaboratoryService,
    LISIntegrationService,
    BarcodeService,
    LabReportService,
    QualityControlService,
    LabInventoryService,
    LabAnalyticsService,
  ],
})
export class LaboratoryModule {}
