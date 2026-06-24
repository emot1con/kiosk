import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAttemptRepository } from '../../domain/ports/attempt-repository.port';
import { DeliveryAttempt } from '../../domain/entities/delivery-attempt.entity';
import { AttemptOrmEntity } from './attempt.orm-entity';

@Injectable()
export class PostgresAttemptRepository implements IAttemptRepository {
  constructor(
    @InjectRepository(AttemptOrmEntity)
    private readonly repository: Repository<AttemptOrmEntity>,
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

  async findByUserId(userId: string): Promise<DeliveryAttempt[]> {
    const ormEntities = await this.repository.createQueryBuilder('attempt')
      .innerJoin('events', 'event', 'event.id = attempt.event_id')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('endpoint.user_id = :userId', { userId })
      .orderBy('attempt.attempted_at', 'DESC')
      .getMany();
      
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async getAvgLatencyByEndpoint(endpointId: string): Promise<number> {
    const result = await this.repository.createQueryBuilder('attempt')
      .select('AVG(attempt.latency_ms)', 'avg')
      .innerJoin('events', 'event', 'event.id = attempt.event_id')
      .where('event.endpoint_id = :endpointId', { endpointId })
      .getRawOne();
      
    return result && result.avg ? Math.round(parseFloat(result.avg)) : 0;
  }
}
