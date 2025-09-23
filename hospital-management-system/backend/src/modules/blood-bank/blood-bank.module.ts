/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { BloodBankService } from './blood-bank.service';
import { BloodBankController } from './blood-bank.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [BloodBankController],
  providers: [BloodBankService],
  exports: [BloodBankService],
})
export class BloodBankModule {}
