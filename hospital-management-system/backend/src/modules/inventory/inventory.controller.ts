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
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Medication Management
  @Post('medications')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Add a new medication to inventory' })
  @ApiResponse({ status: 201, description: 'Medication added successfully' })
  async createMedication(@Body() data: any, @Request() req) {
    return this.inventoryService.createMedication({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('medications')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.NURSE)
  @ApiOperation({ summary: 'Get all medications' })
  @ApiResponse({ status: 200, description: 'List of medications' })
  async getMedications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.inventoryService.getMedications(page, limit, search, category, lowStock);
  }

  @Get('medications/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.NURSE)
  @ApiOperation({ summary: 'Get medication by ID' })
  @ApiResponse({ status: 200, description: 'Medication details' })
  async getMedicationById(@Param('id') id: string) {
    return this.inventoryService.getMedicationById(id);
  }

  @Put('medications/:id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Update medication' })
  @ApiResponse({ status: 200, description: 'Medication updated successfully' })
  async updateMedication(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.inventoryService.updateMedication(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('medications/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete medication' })
  @ApiResponse({ status: 200, description: 'Medication deleted successfully' })
  async deleteMedication(@Param('id') id: string) {
    return this.inventoryService.deleteMedication(id);
  }

  // Stock Management
  @Post('medications/:id/stock/add')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Add stock to medication' })
  @ApiResponse({ status: 201, description: 'Stock added successfully' })
  async addStock(
    @Param('id') id: string,
    @Body() data: { quantity: number; batchNumber?: string; expiryDate?: Date; costPrice?: number },
    @Request() req,
  ) {
    return this.inventoryService.addStock(id, data, req.user.id);
  }

  @Post('medications/:id/stock/issue')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Issue stock from medication' })
  @ApiResponse({ status: 201, description: 'Stock issued successfully' })
  async issueStock(
    @Param('id') id: string,
    @Body() data: { quantity: number; reason: string; issuedTo?: string },
    @Request() req,
  ) {
    return this.inventoryService.issueStock(id, data, req.user.id);
  }

  @Post('medications/:id/stock/adjust')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Adjust medication stock' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  async adjustStock(
    @Param('id') id: string,
    @Body() data: { quantity: number; reason: string },
    @Request() req,
  ) {
    return this.inventoryService.adjustStock(id, data, req.user.id);
  }

  // Inventory Logs
  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get inventory logs' })
  @ApiResponse({ status: 200, description: 'List of inventory logs' })
  async getInventoryLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('medicationId') medicationId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getInventoryLogs(
      page,
      limit,
      medicationId,
      action,
      startDate,
      endDate,
    );
  }

  // Reports and Analytics
  @Get('reports/low-stock')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get low stock report' })
  @ApiResponse({ status: 200, description: 'Low stock medications' })
  async getLowStockReport() {
    return this.inventoryService.getLowStockReport();
  }

  @Get('reports/expiring-soon')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get medications expiring soon' })
  @ApiResponse({ status: 200, description: 'Medications expiring soon' })
  async getExpiringSoonReport(@Query('days') days: number = 30) {
    return this.inventoryService.getExpiringSoonReport(days);
  }

  @Get('reports/stock-movement')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get stock movement report' })
  @ApiResponse({ status: 200, description: 'Stock movement data' })
  async getStockMovementReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.inventoryService.getStockMovementReport(startDate, endDate);
  }

  // Statistics
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics' })
  async getInventoryStats() {
    return this.inventoryService.getInventoryStats();
  }

  // Bulk operations
  @Post('bulk-import')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Bulk import medications' })
  @ApiResponse({ status: 201, description: 'Medications imported successfully' })
  async bulkImportMedications(@Body() data: { medications: any[] }, @Request() req) {
    return this.inventoryService.bulkImportMedications(data.medications, req.user.id);
  }
}
