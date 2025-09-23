/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { OTService } from './ot.service';
import { OTController } from './ot.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [OTController],
  providers: [OTService],
  exports: [OTService],
})
export class OTModule {}
