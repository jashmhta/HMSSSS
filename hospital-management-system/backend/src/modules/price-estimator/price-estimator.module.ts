import { Module } from '@nestjs/common';
import { PriceEstimatorService } from './price-estimator.service';
import { PriceEstimatorController } from './price-estimator.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PriceEstimatorController],
  providers: [PriceEstimatorService],
  exports: [PriceEstimatorService],
})
export class PriceEstimatorModule {}
