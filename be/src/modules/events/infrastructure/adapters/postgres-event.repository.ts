import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IEventRepository } from '../../domain/ports/event-repository.port';
import { WebhookEvent } from '../../domain/entities/event.entity';
import { EventOrmEntity } from './event.orm-entity';

@Injectable()
export class PostgresEventRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly repository: Repository<EventOrmEntity>,
  ) {}

  private mapToDomain(ormEntity: EventOrmEntity): WebhookEvent {
    return new WebhookEvent({
      id: ormEntity.id,
      endpointId: ormEntity.endpointId,
      provider: ormEntity.provider,
      status: ormEntity.status as any,
      headers: ormEntity.headers,
      payload: ormEntity.payload,
      retryCount: ormEntity.retryCount,
      maxRetries: ormEntity.maxRetries,
      nextRetryAt: ormEntity.nextRetryAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  async findById(id: string): Promise<WebhookEvent | null> {
    const ormEntity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByEndpointId(endpointId: string, filters?: any): Promise<WebhookEvent[]> {
    const ormEntities = await this.repository.find({
      where: { endpointId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async findByUserId(userId: string, filters?: any): Promise<WebhookEvent[]> {
    const ormEntities = await this.repository.createQueryBuilder('event')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('endpoint.user_id = :userId', { userId })
      .andWhere('event.deleted_at IS NULL')
      .orderBy('event.created_at', 'DESC')
      .getMany();
      
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async create(data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const ormEntity = this.repository.create({
      endpointId: data.endpointId,
      provider: data.provider || null,
      status: data.status || 'pending',
      headers: data.headers || {},
      payload: data.payload || {},
      retryCount: data.retryCount ?? 0,
      maxRetries: data.maxRetries ?? 5,
      nextRetryAt: data.nextRetryAt || null,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async updateStatus(id: string, status: string, retryData?: { retryCount: number; nextRetryAt: Date | null }): Promise<void> {
    const updatePayload: any = { status };
    if (retryData) {
      updatePayload.retryCount = retryData.retryCount;
      updatePayload.nextRetryAt = retryData.nextRetryAt;
    }
    await this.repository.update(id, updatePayload);
  }

  async findRetryQueue(): Promise<WebhookEvent[]> {
    const now = new Date();
    const ormEntities = await this.repository.createQueryBuilder('event')
      .where('event.status = :status', { status: 'retrying' })
      .andWhere('event.next_retry_at <= :now', { now })
      .andWhere('event.deleted_at IS NULL')
      .getMany();
      
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async getStatusCounts(userId: string): Promise<{ pending: number; delivered: number; retrying: number; dead: number }> {
    const result = await this.repository.createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(event.id)', 'count')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('endpoint.user_id = :userId', { userId })
      .andWhere('event.deleted_at IS NULL')
      .groupBy('event.status')
      .getRawMany();
      
    const counts = { pending: 0, delivered: 0, retrying: 0, dead: 0 };
    result.forEach(row => {
      if (row.status in counts) {
        counts[row.status] = parseInt(row.count, 10);
      }
    });
    return counts;
  }
}
