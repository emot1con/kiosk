import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAttemptRepository } from '../../domain/ports/attempt-repository.port';
import { DeliveryAttempt } from '../../domain/entities/delivery-attempt.entity';
import { AttemptOrmEntity } from './attempt.orm-entity';
import { RedisCacheService } from '../../../../shared/infrastructure/redis-cache.service';

@Injectable()
export class PostgresAttemptRepository implements IAttemptRepository {
  constructor(
    @InjectRepository(AttemptOrmEntity)
    private readonly repository: Repository<AttemptOrmEntity>,
    private readonly cache: RedisCacheService,
  ) {}

  private mapToDomain(ormEntity: AttemptOrmEntity): DeliveryAttempt {
    return new DeliveryAttempt({
      id: ormEntity.id,
      eventId: ormEntity.eventId,
      responseStatus: ormEntity.responseStatus,
      responseBody: ormEntity.responseBody,
      latencyMs: ormEntity.latencyMs,
      attemptedAt: ormEntity.attemptedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  async create(data: Partial<DeliveryAttempt>): Promise<DeliveryAttempt> {
    const ormEntity = this.repository.create({
      eventId: data.eventId,
      responseStatus: data.responseStatus,
      responseBody: data.responseBody,
      latencyMs: data.latencyMs || 0,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async findByEventId(eventId: string): Promise<DeliveryAttempt[]> {
    const ormEntities = await this.repository.find({
      where: { eventId },
      order: { attemptedAt: 'DESC' },
    });
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async findAll(filters?: { page?: number; limit?: number }): Promise<{ data: DeliveryAttempt[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;
    const skip = (page - 1) * limit;

    const [ormEntities, total] = await this.repository.createQueryBuilder('attempt')
      .innerJoin('events', 'event', 'event.id = attempt.event_id')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .orderBy('attempt.attempted_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
      
    return {
      data: ormEntities.map(e => this.mapToDomain(e)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAvgLatencyByEndpoint(endpointId: string): Promise<number> {
    const cacheKey = `attempts:latency:${endpointId}`;

    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.repository.createQueryBuilder('attempt')
      .select('AVG(attempt.latency_ms)', 'avg')
      .innerJoin('events', 'event', 'event.id = attempt.event_id')
      .where('event.endpoint_id = :endpointId', { endpointId })
      .getRawOne();
      
    const avg = result && result.avg ? Math.round(parseFloat(result.avg)) : 0;

    await this.cache.set(cacheKey, avg, 60);

    return avg;
  }
}
