import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
