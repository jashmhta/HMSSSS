/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { OPDService } from './opd.service';
import { OPDController } from './opd.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule],
  controllers: [OPDController],
  providers: [OPDService],
  exports: [OPDService],
})
export class OPDModule {}
