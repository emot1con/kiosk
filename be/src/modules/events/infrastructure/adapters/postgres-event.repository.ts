import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/ports/event-repository.port';
import { WebhookEvent } from '../../domain/entities/event.entity';
import { EventOrmEntity } from './event.orm-entity';
import { UserEventStatsOrmEntity } from './user-event-stats.orm-entity';
import { RedisCacheService } from '../../../../shared/infrastructure/redis-cache.service';

@Injectable()
export class PostgresEventRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly repository: Repository<EventOrmEntity>,
    @InjectRepository(UserEventStatsOrmEntity)
    private readonly statsRepository: Repository<UserEventStatsOrmEntity>,
    private readonly cache: RedisCacheService,
    private readonly dataSource: DataSource,
  ) {}

  private mapToDomain(ormEntity: EventOrmEntity): WebhookEvent {
    return new WebhookEvent({
      id: ormEntity.id,
      endpointId: ormEntity.endpointId,
      provider: ormEntity.provider,
      status: ormEntity.status as any,
      idempotencyKey: ormEntity.idempotencyKey,
      isProcessing: ormEntity.isProcessing,
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

  async findByUserId(userId: string, filters?: { page?: number; limit?: number }): Promise<{ data: WebhookEvent[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;
    const skip = (page - 1) * limit;

    const [ormEntities, total] = await this.repository.createQueryBuilder('event')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('endpoint.user_id = :userId', { userId })
      .andWhere('event.deleted_at IS NULL')
      .orderBy('event.created_at', 'DESC')
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

  async create(data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const ormEntity = this.repository.create({
      endpointId: data.endpointId,
      provider: data.provider || null,
      status: data.status || 'pending',
      idempotencyKey: data.idempotencyKey || null,
      isProcessing: data.isProcessing ?? false,
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
    const updatePayload: any = { status, isProcessing: false };
    if (retryData) {
      updatePayload.retryCount = retryData.retryCount;
      updatePayload.nextRetryAt = retryData.nextRetryAt;
    }
    await this.repository.update(id, updatePayload);
  }

  async lockForProcessing(id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, isProcessing: false, status: In(['pending', 'retrying']) },
      { isProcessing: true }
    );
    return !!(result.affected && result.affected > 0);
  }

  async findRetryQueue(): Promise<WebhookEvent[]> {
    const now = new Date();
    const ormEntities = await this.repository.createQueryBuilder('event')
      .where('event.status = :status', { status: 'retrying' })
      .andWhere('event.is_processing = false')
      .andWhere('event.next_retry_at <= :now', { now })
      .andWhere('event.deleted_at IS NULL')
      .limit(100)
      .getMany();
      
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async getStatusCounts(userId: string): Promise<{ pending: number; delivered: number; retrying: number; dead: number }> {
    // O(1) read from pre-aggregated counter table — no full scan
    const stats = await this.statsRepository.findOne({ where: { userId } });
    if (stats) {
      return {
        pending:   stats.pending,
        delivered: stats.delivered,
        retrying:  stats.retrying,
        dead:      stats.dead,
      };
    }

    // Fallback: if counter row doesn't exist yet, compute and create it
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
        counts[row.status as keyof typeof counts] = parseInt(row.count, 10);
      }
    });

    const total = counts.pending + counts.delivered + counts.retrying + counts.dead;
    await this.statsRepository.upsert(
      { userId, total, ...counts },
      ['userId'],
    );

    return counts;
  }

  /**
   * Increment counter when a new event is created (status = pending).
   * Called from IngressService after create().
   */
  async incrementStat(userId: string, status: 'pending'): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_event_stats (user_id, total, pending, delivered, retrying, dead)
       VALUES ($1, 1, 1, 0, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET
         total   = user_event_stats.total   + 1,
         pending = user_event_stats.pending + 1,
         updated_at = NOW()`,
      [userId],
    );
  }

  /**
   * Atomically transition counters when event status changes.
   * @param userId   - owner of the event
   * @param from     - previous status (before lock/processing)
   * @param to       - new status
   */
  async transitionStat(
    userId: string,
    from: 'pending' | 'retrying',
    to: 'delivered' | 'retrying' | 'dead',
  ): Promise<void> {
    if (from === to) {
      return;
    }
    await this.dataSource.query(
      `INSERT INTO user_event_stats (user_id, total, pending, delivered, retrying, dead)
       VALUES ($1, 0, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET
         "${from}" = GREATEST(user_event_stats."${from}" - 1, 0),
         "${to}"   = user_event_stats."${to}"   + 1,
         updated_at = NOW()`,
      [userId],
    );
  }

  async resetAllDeadEvents(userId: string): Promise<string[]> {
    const deadEvents = await this.repository.createQueryBuilder('event')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('endpoint.user_id = :userId', { userId })
      .andWhere('event.status = :status', { status: 'dead' })
      .andWhere('event.deleted_at IS NULL')
      .getMany();

    const ids = deadEvents.map(e => e.id);
    if (ids.length > 0) {
      await this.repository.update(ids, {
        status: 'pending',
        isProcessing: false,
        retryCount: 0,
        nextRetryAt: null
      });
    }
    return ids;
  }

  async resetEvent(id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, isProcessing: false },
      { status: 'pending', isProcessing: false, retryCount: 0, nextRetryAt: null }
    );
    return !!(result.affected && result.affected > 0);
  }
}
