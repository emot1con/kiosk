import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IEndpointRepository } from '../../domain/ports/endpoint-repository.port';
import { Endpoint } from '../../domain/entities/endpoint.entity';
import { EndpointOrmEntity } from './endpoint.orm-entity';
import { RedisCacheService } from '../../../../shared/infrastructure/redis-cache.service';

@Injectable()
export class PostgresEndpointRepository implements IEndpointRepository {
  constructor(
    @InjectRepository(EndpointOrmEntity)
    private readonly repository: Repository<EndpointOrmEntity>,
    private readonly cache: RedisCacheService,
  ) {}

  private mapToDomain(ormEntity: EndpointOrmEntity): Endpoint {
    return new Endpoint({
      id: ormEntity.id,
      name: ormEntity.name,
      incomingKey: ormEntity.incomingKey,
      destinationUrl: ormEntity.destinationUrl,
      provider: ormEntity.provider,
      signingSecret: ormEntity.signingSecret,
      isActive: ormEntity.isActive,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  async findById(id: string): Promise<Endpoint | null> {
    const cacheKey = `endpoint:id:${id}`;

    const cached = await this.cache.get<Endpoint>(cacheKey);
    if (cached) return new Endpoint(cached);

    const ormEntity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!ormEntity) return null;

    const endpoint = this.mapToDomain(ormEntity);
    await this.cache.set(cacheKey, endpoint, 300);

    return endpoint;
  }

  async findAll(): Promise<Endpoint[]> {
    const ormEntities = await this.repository.find({ 
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' }
    });
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async findByIncomingKey(key: string): Promise<Endpoint | null> {
    const cacheKey = `endpoint:key:${key}`;

    const cached = await this.cache.get<Endpoint>(cacheKey);
    if (cached) return new Endpoint(cached);

    const ormEntity = await this.repository.findOne({ where: { incomingKey: key, deletedAt: IsNull() } });
    if (!ormEntity) return null;

    const endpoint = this.mapToDomain(ormEntity);
    await this.cache.set(cacheKey, endpoint, 300);

    return endpoint;
  }

  async create(data: Partial<Endpoint>): Promise<Endpoint> {
    const ormEntity = this.repository.create({
      name: data.name,
      incomingKey: data.incomingKey,
      destinationUrl: data.destinationUrl,
      provider: data.provider || null,
      signingSecret: data.signingSecret || null,
      isActive: data.isActive ?? true,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<Endpoint>): Promise<Endpoint> {
    // Fetch old data to get incomingKey for cache invalidation
    const oldEndpoint = await this.repository.findOne({ where: { id } });

    await this.repository.update(id, data);

    // Invalidate all caches related to this endpoint
    if (oldEndpoint) {
      await this.cache.del(`endpoint:key:${oldEndpoint.incomingKey}`);
      await this.cache.del(`endpoint:id:${id}`);
    }

    return this.findById(id) as Promise<Endpoint>;
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const endpoint = await this.repository.findOne({ where: { id } });
    await this.repository.update(id, { isActive });

    // Invalidate
    if (endpoint) {
      await this.cache.del(`endpoint:key:${endpoint.incomingKey}`);
      await this.cache.del(`endpoint:id:${id}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    const endpoint = await this.repository.findOne({ where: { id } });
    await this.repository.update(id, { deletedAt: new Date() });

    // Invalidate
    if (endpoint) {
      await this.cache.del(`endpoint:key:${endpoint.incomingKey}`);
      await this.cache.del(`endpoint:id:${id}`);
    }
  }
}
