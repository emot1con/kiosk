import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port';

@Injectable()
export class RedisRefreshTokenRepository implements IRefreshTokenRepository, OnModuleInit, OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly prefix = 'refresh_token:';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    this.redisClient = new Redis({ host, port });
  }

  onModuleInit() {
    this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async store(userId: string, tokenHash: string, expiresInSeconds: number): Promise<void> {
    const key = `${this.prefix}${userId}`;
    await this.redisClient.set(key, tokenHash, 'EX', expiresInSeconds);
  }

  async findHash(userId: string): Promise<string | null> {
    const key = `${this.prefix}${userId}`;
    return this.redisClient.get(key);
  }

  async revoke(userId: string): Promise<void> {
    const key = `${this.prefix}${userId}`;
    await this.redisClient.del(key);
  }
}
