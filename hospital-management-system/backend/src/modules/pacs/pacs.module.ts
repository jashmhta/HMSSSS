import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

import { PacsController } from './pacs.controller';
import { PacsService } from './pacs.service';
import { DicomService } from './dicom.service';
import { PacsIntegrationService } from './pacs-integration.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PacsController],
  providers: [PacsService, DicomService, PacsIntegrationService],
  exports: [PacsService, DicomService, PacsIntegrationService],
})
export class PacsModule {}
