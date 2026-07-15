import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventOrmEntity } from '../../events/infrastructure/adapters/event.orm-entity';
import { AttemptOrmEntity } from '../../delivery/infrastructure/adapters/attempt.orm-entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly eventRepo: Repository<EventOrmEntity>,
    @InjectRepository(AttemptOrmEntity)
    private readonly attemptRepo: Repository<AttemptOrmEntity>,
  ) {}

  async getMetrics(userId: string, endpointId?: string) {
    const query = this.eventRepo.createQueryBuilder('event');
    query.innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpointId')
         .where('endpoint.user_id = :userId', { userId });
         
    if (endpointId) {
      query.andWhere('event.endpointId = :endpointId', { endpointId });
    }

    // Getting counts using conditional aggregation
    query.select([
      'COUNT(*) as total_events',
      `COUNT(CASE WHEN event.status = 'delivered' THEN 1 END) as delivered_events`,
      `COUNT(CASE WHEN event.status = 'retrying' THEN 1 END) as retrying_events`,
      `COUNT(CASE WHEN event.status = 'dead' THEN 1 END) as dead_events`,
    ]);

    const stats = await query.getRawOne();
    
    const totalEvents = parseInt(stats.total_events || '0', 10);
    const deliveredEvents = parseInt(stats.delivered_events || '0', 10);
    const retryingEvents = parseInt(stats.retrying_events || '0', 10);
    const deadEvents = parseInt(stats.dead_events || '0', 10);

    const successRate = totalEvents > 0 ? (deliveredEvents / totalEvents) * 100 : 0;

    // Get average latency
    const latencyQuery = this.attemptRepo.createQueryBuilder('attempt');
    latencyQuery.innerJoin('events', 'event', 'event.id = attempt.eventId')
                .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpointId')
                .where('endpoint.user_id = :userId', { userId });

    if (endpointId) {
      latencyQuery.andWhere('event.endpointId = :endpointId', { endpointId });
    }
    
    latencyQuery.select('AVG(attempt.latencyMs)', 'average_latency');
    const latencyResult = await latencyQuery.getRawOne();
    const averageLatency = parseFloat(latencyResult?.average_latency || '0');

    return {
      totalEvents,
      deliveredEvents,
      retryingEvents,
      deadEvents,
      successRate,
      averageLatency,
    };
  }

  async getTimeSeries(userId: string, endpointId?: string, hours: number = 24) {
    // Generate buckets for the last N hours
    const query = this.eventRepo.createQueryBuilder('event');
    query.innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpointId')
         .where('endpoint.user_id = :userId', { userId });
    
    if (endpointId) {
      query.andWhere('event.endpointId = :endpointId', { endpointId });
    }
    
    // Postgres specific: date_trunc to hour
    query.select([
      `date_trunc('hour', event.created_at) as bucket`,
      `COUNT(CASE WHEN event.status = 'delivered' THEN 1 END) as delivered`,
      `COUNT(CASE WHEN event.status IN ('dead', 'retrying') THEN 1 END) as failed`,
    ]);
    
    // Filter by last N hours
    query.andWhere(`event.created_at >= NOW() - INTERVAL '${hours} hours'`);
    query.groupBy('bucket');
    query.orderBy('bucket', 'ASC');
    
    const results = await query.getRawMany();
    
    // Format the results into a sparse array to fill gaps in frontend
    return results.map(row => ({
      timestamp: row.bucket,
      delivered: parseInt(row.delivered || '0', 10),
      failed: parseInt(row.failed || '0', 10),
    }));
  }

  async getEndpointsHealth(userId: string) {
    const query = this.eventRepo.createQueryBuilder('event');
    query.innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpointId')
         .where('endpoint.user_id = :userId', { userId });
    query.select([
      'event.endpointId as endpoint_id',
      'COUNT(*) as events_count',
      `COUNT(CASE WHEN event.status = 'delivered' THEN 1 END) as success_count`,
    ]);
    query.groupBy('event.endpointId');
    
    const results = await query.getRawMany();
    
    return results.map(row => ({
      endpointId: row.endpoint_id,
      eventsCount: parseInt(row.events_count || '0', 10),
      successCount: parseInt(row.success_count || '0', 10),
    }));
  }
}
