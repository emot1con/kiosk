import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryStrategyService {
  /**
   * Calculates the next retry date based on exponential backoff:
   * delay = Math.pow(2, retryCount) * 60 * 1000 milliseconds (1m, 2m, 4m, 8m, 16m...)
   */
  calculateNextRetry(retryCount: number): Date {
    const baseDelayMs = 60 * 1000; // 1 minute
    const delayMs = Math.pow(2, retryCount) * baseDelayMs;
    return new Date(Date.now() + delayMs);
  }
}
