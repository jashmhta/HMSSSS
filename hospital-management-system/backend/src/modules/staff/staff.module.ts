/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
