import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EVENT_REPOSITORY } from '../../events/domain/ports/event-repository.port';
import type { IEventRepository } from '../../events/domain/ports/event-repository.port';
import { QUEUE_PUBLISHER } from '../../events/domain/ports/queue-publisher.port';
import type { IQueuePublisher } from '../../events/domain/ports/queue-publisher.port';

@Injectable()
export class RetrySchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetrySchedulerService.name);
  private timer: NodeJS.Timeout;

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(QUEUE_PUBLISHER)
    private readonly queuePublisher: IQueuePublisher,
  ) {}

  onModuleInit() {
    this.logger.log('Starting Retry Scheduler (Polling fallback every 5m)');
    // Poll every 5 minutes (300000ms) as a fallback safety net
    this.timer = setInterval(() => this.processRetries(), 300000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async processRetries() {
    try {
      const eventsToRetry = await this.eventRepository.findRetryQueue();
      if (eventsToRetry.length > 0) {
        this.logger.log(`Found ${eventsToRetry.length} events to retry in fallback polling`);
        
        // Process in parallel, but with locking to prevent multi-instance race conditions
        await Promise.allSettled(
          eventsToRetry.map(async (event) => {
            const locked = await this.eventRepository.lockForProcessing(event.id);
            if (locked) {
              await this.queuePublisher.publish(event.id);
            }
          })
        );
      }
    } catch (err) {
      this.logger.error('Error processing retries', err);
    }
  }
}
