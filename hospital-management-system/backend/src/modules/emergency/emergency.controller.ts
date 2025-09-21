import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { Roles } from '../../shared/decorators/roles.decorator';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('visits')
  @Roles('nurse', 'doctor', 'admin')
  async registerEmergencyPatient(@Body() data: any) {
    return this.emergencyService.registerEmergencyPatient(data);
  }

  @Get('visits')
  @Roles('doctor', 'nurse', 'admin')
  async getEmergencyVisits() {
    return this.emergencyService.getEmergencyVisits();
  }

  @Get('visits/:id')
  @Roles('doctor', 'nurse', 'admin')
  async getEmergencyVisitById(@Param('id') id: string) {
    return this.emergencyService.getEmergencyVisitById(id);
  }

  @Put('visits/:id/triage')
  @Roles('nurse', 'doctor')
  async updateTriage(@Param('id') id: string, @Body() triageData: any) {
    return this.emergencyService.updateTriage(id, triageData);
  }

  @Put('visits/:id/assign-doctor')
  @Roles('nurse', 'admin')
  async assignDoctor(@Param('id') id: string, @Body() body: { doctorId: string }) {
    return this.emergencyService.assignDoctor(id, body.doctorId);
  }

  @Put('visits/:id/status')
  @Roles('doctor', 'nurse')
  async updateVisitStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.emergencyService.updateVisitStatus(id, body.status);
  }

  @Post('visits/:id/vitals')
  @Roles('nurse', 'doctor')
  async addVitals(@Param('id') id: string, @Body() vitals: any) {
    return this.emergencyService.addVitals(id, vitals);
  }

  @Post('visits/:id/medications')
  @Roles('doctor')
  async addMedication(@Param('id') id: string, @Body() medication: any) {
    return this.emergencyService.addMedication(id, medication);
  }

  @Post('visits/:id/procedures')
  @Roles('doctor', 'nurse')
  async addProcedure(@Param('id') id: string, @Body() procedure: any) {
    return this.emergencyService.addProcedure(id, procedure);
  }

  @Get('queue')
  @Roles('doctor', 'nurse', 'admin')
  async getWaitingQueue() {
    return this.emergencyService.getWaitingQueue();
  }
}
