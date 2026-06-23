import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  private mapToDomain(ormEntity: UserOrmEntity): User {
    return new User({
      id: ormEntity.id,
      email: ormEntity.email,
      passwordHash: ormEntity.passwordHash,
      apiKeyHash: ormEntity.apiKeyHash,
      apiKeyPrefix: ormEntity.apiKeyPrefix,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { email, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByApiKeyHash(hash: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { apiKeyHash: hash, deletedAt: IsNull() } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const ormEntity = this.repository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      apiKeyHash: data.apiKeyHash || null,
      apiKeyPrefix: data.apiKeyPrefix || null,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async updateApiKey(userId: string, newHash: string, newPrefix: string): Promise<void> {
    await this.repository.update(userId, { apiKeyHash: newHash, apiKeyPrefix: newPrefix });
  }

  async softDelete(userId: string): Promise<void> {
    await this.repository.update(userId, { deletedAt: new Date() });
  }
}
