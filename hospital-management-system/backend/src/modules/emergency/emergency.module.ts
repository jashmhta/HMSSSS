/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
