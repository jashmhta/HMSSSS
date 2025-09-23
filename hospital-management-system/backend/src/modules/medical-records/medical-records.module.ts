/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
