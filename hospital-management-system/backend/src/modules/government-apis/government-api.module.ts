import { Module } from '@nestjs/common';
import { GovernmentAPIService } from './government-api.service';
import { GovernmentAPIController } from './government-api.controller';

@Module({
  providers: [GovernmentAPIService],
  controllers: [GovernmentAPIController],
  exports: [GovernmentAPIService],
})
export class GovernmentAPIModule {}
