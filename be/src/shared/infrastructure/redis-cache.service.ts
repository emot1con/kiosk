import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    this.redis = new Redis({ host, port });
    this.redis.on('error', (err) => this.logger.error('Redis error', err));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Retrieve data from cache. Returns null on miss.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Store data in cache with a TTL (in seconds).
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to set cache key "${key}"`, err);
    }
  }

  /**
   * Delete a single key from cache.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Failed to delete cache key "${key}"`, err);
    }
  }

  /**
   * Delete all keys matching a pattern.
   * Uses SCAN for safety instead of KEYS in production.
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache invalidated: ${keys.length} keys matching "${pattern}"`);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete cache keys by pattern "${pattern}"`, err);
    }
  }
}
