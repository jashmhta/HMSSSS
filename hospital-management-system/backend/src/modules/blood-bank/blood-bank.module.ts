import { Module } from '@nestjs/common';
import { BloodBankService } from './blood-bank.service';
import { BloodBankController } from './blood-bank.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BloodBankController],
  providers: [BloodBankService],
  exports: [BloodBankService],
})
export class BloodBankModule {}
