import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { BloodBankService } from './blood-bank.service';
import { BloodBankController } from './blood-bank.controller';

@Module({
  imports: [DatabaseModule, ComplianceModule],
  controllers: [BloodBankController],
  providers: [BloodBankService],
  exports: [BloodBankService],
})
export class BloodBankModule {}
