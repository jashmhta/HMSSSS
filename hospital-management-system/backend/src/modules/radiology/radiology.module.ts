import { Module } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { RadiologyController } from './radiology.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule {}
