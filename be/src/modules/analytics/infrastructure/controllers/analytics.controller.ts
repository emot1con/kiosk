import { Controller, Get, Query } from '@nestjs/common';

import { AnalyticsService } from '../../application/analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  async getMetrics(@Query('endpointId') endpointId?: string) {
    return this.analyticsService.getMetrics(endpointId);
  }

  @Get('timeseries')
  async getTimeSeries(@Query('endpointId') endpointId?: string, @Query('hours') hours?: number) {
    return this.analyticsService.getTimeSeries(endpointId, hours ? Number(hours) : 24);
  }

  @Get('endpoints-health')
  async getEndpointsHealth() {
    return this.analyticsService.getEndpointsHealth();
  }
}
