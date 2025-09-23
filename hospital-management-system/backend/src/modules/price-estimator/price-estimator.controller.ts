/*[object Object]*/
import { Controller, Get, Post, Put, Body, Query, Param } from '@nestjs/common';

import { PriceEstimatorService } from './price-estimator.service';

/**
 *
 */
@Controller('price-estimator')
export class PriceEstimatorController {
  /**
   *
   */
  constructor(private readonly priceEstimatorService: PriceEstimatorService) {}

  /**
   *
   */
  @Post('estimate')
  async estimatePrice(@Body() estimationRequest: any) {
    return this.priceEstimatorService.estimatePrice(estimationRequest);
  }

  /**
   *
   */
  @Get('packages/popular')
  async getPopularPackages() {
    return this.priceEstimatorService.getPopularPackages();
  }

  /**
   *
   */
  @Get('packages/:code/estimate')
  async getPackageEstimate(@Param('code') code: string, @Query('patientType') patientType: string) {
    return this.priceEstimatorService.getPackageEstimate(code, patientType);
  }

  /**
   *
   */
  @Get('pricing')
  async getServicePricing() {
    return this.priceEstimatorService.getServicePricing();
  }

  /**
   *
   */
  @Put('pricing')
  async updateServicePricing(@Body() pricingData: any) {
    return this.priceEstimatorService.updateServicePricing(pricingData);
  }
}
