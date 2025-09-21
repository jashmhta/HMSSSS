import { Module } from '@nestjs/common';
import { OTService } from './ot.service';
import { OTController } from './ot.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OTController],
  providers: [OTService],
  exports: [OTService],
})
export class OTModule {}
