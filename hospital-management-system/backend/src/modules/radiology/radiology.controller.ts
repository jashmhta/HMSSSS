import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RadiologyService } from './radiology.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('radiology')
@ApiBearerAuth()
@Controller('radiology')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RadiologyController {
  constructor(private readonly radiologyService: RadiologyService) {}

  @Post('tests')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Order a new radiology test' })
  @ApiResponse({ status: 201, description: 'Radiology test ordered successfully' })
  createTest(@Body() createTestDto: any, @Request() req) {
    return this.radiologyService.create({
      ...createTestDto,
      orderedBy: req.user.id,
    });
  }

  @Get('tests')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all radiology tests with filtering' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'modality', required: false })
  @ApiQuery({ name: 'urgent', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAllTests(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('modality') modality?: string,
    @Query('urgent') urgent?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (patientId) filters.patientId = patientId;
    if (modality) filters.modality = modality;
    if (urgent !== undefined) filters.urgent = urgent === 'true';
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.radiologyService.findAll(page, limit, filters);
  }

  @Get('tests/stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get radiology statistics' })
  @ApiResponse({ status: 200, description: 'Radiology statistics' })
  getRadiologyStats() {
    return this.radiologyService.getRadiologyStats();
  }

  @Get('tests/modalities')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get test count by modality' })
  @ApiResponse({ status: 200, description: 'Test modalities with counts' })
  getTestsByModality() {
    return this.radiologyService.getTestsByModality();
  }

  @Get('tests/scheduled/:date')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get scheduled tests for a specific date' })
  @ApiResponse({ status: 200, description: 'Scheduled tests for the date' })
  getScheduledTests(@Param('date') date: string) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return this.radiologyService.getScheduledTests(parsedDate);
  }

  @Get('tests/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get radiology test by ID' })
  @ApiResponse({ status: 200, description: 'Radiology test details' })
  findOneTest(@Param('id') id: string) {
    return this.radiologyService.findOne(id);
  }

  @Patch('tests/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update radiology test' })
  @ApiResponse({ status: 200, description: 'Radiology test updated successfully' })
  updateTest(@Param('id') id: string, @Body() updateTestDto: any) {
    return this.radiologyService.update(id, updateTestDto);
  }

  @Post('tests/:id/schedule')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Schedule radiology test' })
  @ApiResponse({ status: 200, description: 'Test scheduled successfully' })
  scheduleTest(@Param('id') id: string, @Body() scheduleTestDto: any) {
    return this.radiologyService.scheduleTest(id, scheduleTestDto);
  }

  @Post('tests/:id/start')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Start radiology test procedure' })
  @ApiResponse({ status: 200, description: 'Test started successfully' })
  startTest(@Param('id') id: string, @Request() req) {
    return this.radiologyService.startTest(id, req.user.id);
  }

  @Post('tests/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Complete radiology test with report' })
  @ApiResponse({ status: 200, description: 'Test completed successfully' })
  completeTest(@Param('id') id: string, @Body() completeTestDto: any, @Request() req) {
    return this.radiologyService.completeTest(id, {
      ...completeTestDto,
      performedBy: req.user.id,
    });
  }

  @Post('tests/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Cancel radiology test' })
  @ApiResponse({ status: 200, description: 'Radiology test cancelled successfully' })
  cancelTest(@Param('id') id: string, @Body() body: { reason: string }) {
    if (!body.reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.radiologyService.cancelTest(id, body.reason);
  }

  @Delete('tests/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete radiology test' })
  @ApiResponse({ status: 200, description: 'Radiology test deleted successfully' })
  removeTest(@Param('id') id: string) {
    // Note: In a real system, you might want to soft delete instead
    return this.radiologyService.findOne(id).then(() => ({
      message: 'Radiology test deletion not implemented - use cancel instead',
    }));
  }
}
