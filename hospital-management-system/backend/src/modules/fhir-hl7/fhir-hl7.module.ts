import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

import { FhirHl7Controller } from './fhir-hl7.controller';
import { FhirHl7Service } from './fhir-hl7.service';
import { Hl7Service } from './hl7.service';
import { FhirService } from './fhir.service';
import { ExternalSystemsService } from './external-systems.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FhirHl7Controller],
  providers: [FhirHl7Service, Hl7Service, FhirService, ExternalSystemsService],
  exports: [FhirHl7Service, Hl7Service, FhirService, ExternalSystemsService],
})
export class FhirHl7Module {}
