/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SuperadminController],
  providers: [SuperadminService],
  exports: [SuperadminService],
})
export class SuperadminModule {}
