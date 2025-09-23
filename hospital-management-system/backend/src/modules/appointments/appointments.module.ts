/*[object Object]*/
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';

/**
 *
 */
@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
