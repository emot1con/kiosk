import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './application/analytics.service';
import { AnalyticsController } from './infrastructure/controllers/analytics.controller';
import { EventOrmEntity } from '../events/infrastructure/adapters/event.orm-entity';
import { UserEventStatsOrmEntity } from '../events/infrastructure/adapters/user-event-stats.orm-entity';
import { AttemptOrmEntity } from '../delivery/infrastructure/adapters/attempt.orm-entity';
import { EndpointOrmEntity } from '../endpoints/infrastructure/adapters/endpoint.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventOrmEntity, AttemptOrmEntity, EndpointOrmEntity, UserEventStatsOrmEntity]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
