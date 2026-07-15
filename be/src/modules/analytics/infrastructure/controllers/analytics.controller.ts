import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from '../../application/analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  async getMetrics(@Request() req: any, @Query('endpointId') endpointId?: string) {
    return this.analyticsService.getMetrics(req.user.id, endpointId);
  }

  @Get('timeseries')
  async getTimeSeries(@Request() req: any, @Query('endpointId') endpointId?: string, @Query('hours') hours?: number) {
    return this.analyticsService.getTimeSeries(req.user.id, endpointId, hours ? Number(hours) : 24);
  }

  @Get('endpoints-health')
  async getEndpointsHealth(@Request() req: any) {
    return this.analyticsService.getEndpointsHealth(req.user.id);
  }
}
