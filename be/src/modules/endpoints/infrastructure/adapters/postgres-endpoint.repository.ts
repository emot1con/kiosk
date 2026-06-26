import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IEndpointRepository } from '../../domain/ports/endpoint-repository.port';
import { Endpoint } from '../../domain/entities/endpoint.entity';
import { EndpointOrmEntity } from './endpoint.orm-entity';

@Injectable()
export class PostgresEndpointRepository implements IEndpointRepository {
  constructor(
    @InjectRepository(EndpointOrmEntity)
    private readonly repository: Repository<EndpointOrmEntity>,
  ) {}

  private mapToDomain(ormEntity: EndpointOrmEntity): Endpoint {
    return new Endpoint({
      id: ormEntity.id,
      userId: ormEntity.userId,
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
    const ormEntity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByUserId(userId: string): Promise<Endpoint[]> {
    const ormEntities = await this.repository.find({ 
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' }
    });
    return ormEntities.map(e => this.mapToDomain(e));
  }

  async findByIncomingKey(key: string): Promise<Endpoint | null> {
    const ormEntity = await this.repository.findOne({ where: { incomingKey: key, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async create(data: Partial<Endpoint>): Promise<Endpoint> {
    const ormEntity = this.repository.create({
      userId: data.userId,
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
    await this.repository.update(id, data);
    return this.findById(id) as Promise<Endpoint>;
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }
}
