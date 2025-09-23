/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { RadiologyService } from './radiology.service';
import { RadiologyController } from './radiology.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule {}
