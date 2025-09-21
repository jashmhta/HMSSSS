import { Module } from '@nestjs/common';
import { OPDService } from './opd.service';
import { OPDController } from './opd.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OPDController],
  providers: [OPDService],
  exports: [OPDService],
})
export class OPDModule {}
