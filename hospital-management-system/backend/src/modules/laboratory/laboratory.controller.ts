/*[object Object]*/
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
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

import { LaboratoryService } from './laboratory.service';

/**
 *
 */
@ApiTags('laboratory')
@ApiBearerAuth()
@Controller('laboratory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaboratoryController {
  /**
   *
   */
  constructor(private readonly laboratoryService: LaboratoryService) {}

  /**
   *
   */
  @Post('tests')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Order a new lab test' })
  @ApiResponse({ status: 201, description: 'Lab test ordered successfully' })
  createTest(@Body() createTestDto: any, @Request() req) {
    return this.laboratoryService.createTestOrder({
      ...createTestDto,
      orderedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Get('tests')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.LAB_TECHNICIAN,
    UserRole.RECEPTIONIST,
  )
  @ApiOperation({ summary: 'Get all lab tests with filtering' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'urgent', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAllTests(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('category') category?: string,
    @Query('urgent') urgent?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (patientId) filters.patientId = patientId;
    if (category) filters.category = category;
    if (urgent !== undefined) filters.urgent = urgent === 'true';
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.laboratoryService.getTestOrders(page, limit, filters);
  }

  /**
   *
   */
  @Get('tests/stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get laboratory statistics' })
  @ApiResponse({ status: 200, description: 'Laboratory statistics' })
  getLabStats() {
    return this.laboratoryService.getLabStatistics();
  }

  /**
   *
   */
  @Get('tests/categories')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get test count by category' })
  @ApiResponse({ status: 200, description: 'Test categories with counts' })
  getTestsByCategory() {
    return this.laboratoryService.getTestCatalog();
  }

  /**
   *
   */
  @Get('tests/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.LAB_TECHNICIAN,
    UserRole.RECEPTIONIST,
  )
  @ApiOperation({ summary: 'Get lab test by ID' })
  @ApiResponse({ status: 200, description: 'Lab test details' })
  findOneTest(@Param('id') id: string) {
    return this.laboratoryService.getTestOrder(id);
  }

  /**
   *
   */
  @Patch('tests/:id')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Update lab test' })
  @ApiResponse({ status: 200, description: 'Lab test updated successfully' })
  updateTest(@Param('id') id: string, @Body() updateTestDto: any) {
    return this.laboratoryService.updateTestStatus(
      id,
      updateTestDto.status,
      updateTestDto.updatedBy,
      updateTestDto.notes,
    );
  }

  /**
   *
   */
  @Post('tests/:id/collect-specimen')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.NURSE)
  @ApiOperation({ summary: 'Collect specimen for lab test' })
  @ApiResponse({ status: 200, description: 'Specimen collected successfully' })
  collectSpecimen(@Param('id') id: string, @Body() collectSpecimenDto: any, @Request() req) {
    return this.laboratoryService.collectSample(id, {
      ...collectSpecimenDto,
      collectedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('tests/:id/submit-results')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Submit lab test results' })
  @ApiResponse({ status: 200, description: 'Results submitted successfully' })
  submitResults(@Param('id') id: string, @Body() submitResultsDto: any, @Request() req) {
    return this.laboratoryService.enterResults(id, submitResultsDto.results, req.user.id);
  }

  /**
   *
   */
  @Post('tests/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Cancel lab test' })
  @ApiResponse({ status: 200, description: 'Lab test cancelled successfully' })
  cancelTest(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    if (!body.reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.laboratoryService.cancelTestOrder(id, body.reason, req.user.id);
  }

  /**
   *
   */
  @Delete('tests/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete lab test' })
  @ApiResponse({ status: 200, description: 'Lab test deleted successfully' })
  removeTest(@Param('id') id: string) {
    // Note: In a real system, you might want to soft delete instead
    return this.laboratoryService.getTestOrder(id).then(() => ({
      message: 'Lab test deletion not implemented - use cancel instead',
    }));
  }
}
