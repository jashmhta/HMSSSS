import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

import { DrugInteractionsController } from './drug-interactions.controller';
import { DrugInteractionsService } from './drug-interactions.service';
import { DrugDatabaseService } from './drug-database.service';
import { InteractionCheckerService } from './interaction-checker.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DrugInteractionsController],
  providers: [DrugInteractionsService, DrugDatabaseService, InteractionCheckerService],
  exports: [DrugInteractionsService, DrugDatabaseService, InteractionCheckerService],
})
export class DrugInteractionsModule {}
