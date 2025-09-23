/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
