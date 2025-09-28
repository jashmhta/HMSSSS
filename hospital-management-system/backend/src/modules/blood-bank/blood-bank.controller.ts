import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UserRole, BloodType } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { BloodBankService } from './blood-bank.service';
import {
  CreateBloodDonationDto,
  UpdateBloodDonationDto,
  BloodDonationFilterDto,
  BloodRequestDto,
  BloodTransfusionDto,
} from './dto/blood-donation.dto';

@Controller('blood-bank')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BloodBankController {
  constructor(private readonly bloodBankService: BloodBankService) {}

  /**
   * Create a new blood donation
   */
  @Post('donations')
  @Roles(UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async createDonation(@Body(ValidationPipe) data: CreateBloodDonationDto) {
    return this.bloodBankService.createDonation(data);
  }

  /**
   * Update blood donation status and screening
   */
  @Put('donations/:id')
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async updateDonation(
    @Param('id') id: string,
    @Body(ValidationPipe) data: UpdateBloodDonationDto,
  ) {
    return this.bloodBankService.updateDonation(id, data);
  }

  /**
   * Get blood donations with filtering
   */
  @Get('donations')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getDonations(
    @Query() filters: BloodDonationFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.bloodBankService.getDonations(filters, page, limit);
  }

  /**
   * Get blood donation by ID
   */
  @Get('donations/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getDonationById(@Param('id') id: string) {
    return this.bloodBankService.getDonationById(id);
  }

  /**
   * Get blood inventory by blood type
   */
  @Get('inventory')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getBloodInventory() {
    return this.bloodBankService.getBloodInventory();
  }

  /**
   * Check blood availability
   */
  @Get('availability/:bloodType')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async checkBloodAvailability(
    @Param('bloodType') bloodType: BloodType,
    @Query('units', ParseIntPipe) units: number,
  ) {
    const available = await this.bloodBankService.checkBloodAvailability(bloodType, units);
    return { available, bloodType, unitsRequired: units };
  }

  /**
   * Create blood request
   */
  @Post('requests')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  async createBloodRequest(@Body(ValidationPipe) data: BloodRequestDto) {
    return this.bloodBankService.createBloodRequest(data);
  }

  /**
   * Record blood transfusion
   */
  @Post('transfusions')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN)
  async recordTransfusion(@Body(ValidationPipe) data: BloodTransfusionDto) {
    return this.bloodBankService.recordTransfusion(data);
  }

  /**
   * Get blood bank statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  async getBloodBankStats() {
    return this.bloodBankService.getBloodBankStats();
  }
}
