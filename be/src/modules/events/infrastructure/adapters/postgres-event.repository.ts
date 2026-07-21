import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/ports/event-repository.port';
import { WebhookEvent } from '../../domain/entities/event.entity';
import { EventOrmEntity } from './event.orm-entity';
import { RedisCacheService } from '../../../../shared/infrastructure/redis-cache.service';

@Injectable()
export class PostgresEventRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly repository: Repository<EventOrmEntity>,
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

  async findAll(filters?: { page?: number; limit?: number }): Promise<{ data: WebhookEvent[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;
    const skip = (page - 1) * limit;

    const [ormEntities, total] = await this.repository.createQueryBuilder('event')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('event.deleted_at IS NULL')
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

  async getStatusCounts(): Promise<{ pending: number; delivered: number; retrying: number; dead: number }> {
    // O(1) read from pre-aggregated counter table — no full scan
    // using 'global' as the id for single-tenant
    const stats = await this.dataSource.query(`SELECT * FROM global_event_stats WHERE id = 'global'`);
    if (stats && stats.length > 0) {
      return {
        pending:   stats[0].pending,
        delivered: stats[0].delivered,
        retrying:  stats[0].retrying,
        dead:      stats[0].dead,
      };
    }

    // Fallback: if counter row doesn't exist yet, compute and create it
    const result = await this.repository.createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(event.id)', 'count')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('event.deleted_at IS NULL')
      .groupBy('event.status')
      .getRawMany();

    const counts = { pending: 0, delivered: 0, retrying: 0, dead: 0 };
    result.forEach(row => {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = parseInt(row.count, 10);
      }
    });

    const total = counts.pending + counts.delivered + counts.retrying + counts.dead;
    await this.dataSource.query(
      `INSERT INTO global_event_stats (id, total, pending, delivered, retrying, dead)
       VALUES ('global', $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         total = $1, pending = $2, delivered = $3, retrying = $4, dead = $5, updated_at = NOW()`,
      [total, counts.pending, counts.delivered, counts.retrying, counts.dead]
    );

    return counts;
  }

  /**
   * Increment counter when a new event is created (status = pending).
   * Called from IngressService after create().
   */
  async incrementStat(status: 'pending'): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO global_event_stats (id, total, pending, delivered, retrying, dead)
       VALUES ('global', 1, 1, 0, 0, 0)
       ON CONFLICT (id) DO UPDATE SET
         total   = global_event_stats.total   + 1,
         pending = global_event_stats.pending + 1,
         updated_at = NOW()`
    );
  }

  /**
   * Atomically transition counters when event status changes.
   * @param from     - previous status (before lock/processing)
   * @param to       - new status
   */
  async transitionStat(
    from: 'pending' | 'retrying',
    to: 'delivered' | 'retrying' | 'dead',
  ): Promise<void> {
    if (from === to) {
      return;
    }
    await this.dataSource.query(
      `INSERT INTO global_event_stats (id, total, pending, delivered, retrying, dead)
       VALUES ('global', 0, 0, 0, 0, 0)
       ON CONFLICT (id) DO UPDATE SET
         "${from}" = GREATEST(global_event_stats."${from}" - 1, 0),
         "${to}"   = global_event_stats."${to}"   + 1,
         updated_at = NOW()`
    );
  }

  async resetAllDeadEvents(): Promise<string[]> {
    const deadEvents = await this.repository.createQueryBuilder('event')
      .innerJoin('endpoints', 'endpoint', 'endpoint.id = event.endpoint_id')
      .where('event.status = :status', { status: 'dead' })
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
