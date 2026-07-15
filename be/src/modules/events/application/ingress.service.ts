import * as crypto from 'crypto';
import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ENDPOINT_REPOSITORY } from '../../endpoints/domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../../endpoints/domain/ports/endpoint-repository.port';
import { EVENT_REPOSITORY } from '../domain/ports/event-repository.port';
import type { IEventRepository } from '../domain/ports/event-repository.port';
import { QUEUE_PUBLISHER } from '../domain/ports/queue-publisher.port';
import type { IQueuePublisher } from '../domain/ports/queue-publisher.port';
import { WebhookEvent } from '../domain/entities/event.entity';

@Injectable()
export class IngressService {
  private readonly logger = new Logger(IngressService.name);

  constructor(
    @Inject(ENDPOINT_REPOSITORY)
    private readonly endpointRepository: IEndpointRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(QUEUE_PUBLISHER)
    private readonly queuePublisher: IQueuePublisher,
  ) {}

  async handleIncomingWebhook(incomingKey: string, headers: Record<string, any>, payload: any): Promise<{ success: boolean; eventId: string }> {
    this.logger.log(`Received incoming webhook for key prefix: ${incomingKey.substring(0, 8)}...`);

    const endpoint = await this.endpointRepository.findByIncomingKey(incomingKey);
    if (!endpoint) {
      this.logger.warn(`Endpoint not found for incomingKey: ${incomingKey.substring(0, 8)}...`);
      throw new NotFoundException('Endpoint not found');
    }

    if (!endpoint.isActive) {
      this.logger.warn(`Endpoint ${endpoint.id} is inactive/paused`);
      throw new BadRequestException('Endpoint is paused');
    }

    const provider = endpoint.provider || 'unknown';

    // Generate idempotency key from JSON payload
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
    const idempotencyKey = crypto.createHash('sha256').update(payloadStr).digest('hex');

    // Create event
    let event: WebhookEvent;
    try {
      event = await this.eventRepository.create({
        endpointId: endpoint.id,
        provider,
        status: 'pending',
        idempotencyKey,
        headers,
        payload,
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: null,
      });
    } catch (err: any) {
      // PostgreSQL Unique Violation Error Code
      if (err.code === '23505') {
        this.logger.warn(`Duplicate webhook payload detected for endpoint ${endpoint.id} (Idempotency Key: ${idempotencyKey}). Responding 200 OK without queueing.`);
        return {
          success: true,
          eventId: 'duplicate',
        };
      }
      throw err;
    }

    this.logger.log(`Created event ${event.id} for endpoint ${endpoint.id}`);

    // Update pre-aggregated counter (fire-and-forget, non-blocking)
    this.eventRepository.incrementStat(endpoint.userId, 'pending').catch(err =>
      this.logger.error(`Failed to increment stat for user ${endpoint.userId}`, err),
    );

    // Publish to delivery queue
    try {
      await this.queuePublisher.publish(event.id);
      this.logger.log(`Published event ${event.id} to delivery queue`);
    } catch (err) {
      this.logger.error(`Failed to publish event ${event.id} to queue`, err);
      // We don't fail the request if publishing fails, since it's already saved in the DB.
      // A recovery process (cron/worker) can pick it up.
    }

    return {
      success: true,
      eventId: event.id,
    };
  }
}
