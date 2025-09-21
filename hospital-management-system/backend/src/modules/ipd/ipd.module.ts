import { Module } from '@nestjs/common';
import { IPDService } from './ipd.service';
import { IPDController } from './ipd.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IPDController],
  providers: [IPDService],
  exports: [IPDService],
})
export class IPDModule {}
