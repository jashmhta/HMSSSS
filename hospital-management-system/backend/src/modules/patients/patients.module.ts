import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ComplianceModule } from '../compliance/compliance.module';

import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

@Module({
  imports: [DatabaseModule, ComplianceModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
