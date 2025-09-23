/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { ComplianceModule } from '../compliance/compliance.module';

import { IPDService } from './ipd.service';
import { IPDController } from './ipd.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule, ComplianceModule],
  controllers: [IPDController],
  providers: [IPDService],
  exports: [IPDService],
})
export class IPDModule {}
