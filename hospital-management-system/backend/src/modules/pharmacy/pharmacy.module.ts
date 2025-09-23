/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
