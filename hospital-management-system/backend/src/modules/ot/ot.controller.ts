import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OTService } from './ot.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('ot')
@ApiBearerAuth()
@Controller('ot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OTController {
  constructor(private readonly otService: OTService) {}

  @Post('surgeries')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule a new surgery' })
  @ApiResponse({ status: 201, description: 'Surgery scheduled successfully' })
  async scheduleSurgery(@Body() data: any, @Request() req) {
    return this.otService.scheduleSurgery({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('surgeries')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all surgeries' })
  @ApiResponse({ status: 200, description: 'List of surgeries' })
  async getSurgeries(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.otService.getSurgeries(page, limit, status, date);
  }

  @Get('surgeries/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get surgery by ID' })
  @ApiResponse({ status: 200, description: 'Surgery details' })
  async getSurgeryById(@Param('id') id: string) {
    return this.otService.getSurgeryById(id);
  }

  @Put('surgeries/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Update surgery' })
  @ApiResponse({ status: 200, description: 'Surgery updated successfully' })
  async updateSurgery(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.otService.updateSurgery(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('surgeries/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Cancel surgery' })
  @ApiResponse({ status: 200, description: 'Surgery cancelled successfully' })
  async cancelSurgery(@Param('id') id: string, @Request() req) {
    return this.otService.cancelSurgery(id, req.user.id);
  }

  @Get('schedule/:otId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get OT schedule' })
  @ApiResponse({ status: 200, description: 'OT schedule for the specified date' })
  async getOTSchedule(@Param('otId') otId: string, @Query('date') date: string) {
    return this.otService.getOTSchedule(otId, new Date(date));
  }

  @Get('available')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get available OTs' })
  @ApiResponse({ status: 200, description: 'List of available operating theaters' })
  async getAvailableOTs(@Query('startTime') startTime: string, @Query('endTime') endTime: string) {
    return this.otService.getAvailableOTs(new Date(startTime), new Date(endTime));
  }

  @Post('surgeries/:id/pre-op-notes')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Add pre-operative notes' })
  @ApiResponse({ status: 201, description: 'Pre-operative notes added successfully' })
  async addPreOpNote(@Param('id') id: string, @Body() note: any, @Request() req) {
    return this.otService.addPreOpNote(id, note, req.user.id);
  }

  @Post('surgeries/:id/intra-op-notes')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Add intra-operative notes' })
  @ApiResponse({ status: 201, description: 'Intra-operative notes added successfully' })
  async addIntraOpNote(@Param('id') id: string, @Body() note: any, @Request() req) {
    return this.otService.addIntraOpNote(id, note, req.user.id);
  }

  @Post('surgeries/:id/post-op-notes')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Add post-operative notes' })
  @ApiResponse({ status: 201, description: 'Post-operative notes added successfully' })
  async addPostOpNote(@Param('id') id: string, @Body() note: any, @Request() req) {
    return this.otService.addPostOpNote(id, note, req.user.id);
  }

  @Get('theaters')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all operating theaters' })
  @ApiResponse({ status: 200, description: 'List of operating theaters' })
  async getOperatingTheaters() {
    return this.otService.getOperatingTheaters();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get OT statistics' })
  @ApiResponse({ status: 200, description: 'OT statistics' })
  async getOTStats() {
    return this.otService.getOTStats();
  }
}
