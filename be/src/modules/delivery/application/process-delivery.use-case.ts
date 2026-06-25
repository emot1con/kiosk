import { Injectable, Inject, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { EVENT_REPOSITORY } from '../../events/domain/ports/event-repository.port';
import type { IEventRepository } from '../../events/domain/ports/event-repository.port';
import { ENDPOINT_REPOSITORY } from '../../endpoints/domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../../endpoints/domain/ports/endpoint-repository.port';
import { ATTEMPT_REPOSITORY } from '../domain/ports/attempt-repository.port';
import type { IAttemptRepository } from '../domain/ports/attempt-repository.port';
import { WEBHOOK_DISPATCHER } from '../domain/ports/webhook-dispatcher.port';
import type { IWebhookDispatcher } from '../domain/ports/webhook-dispatcher.port';
import { RetryStrategyService } from '../domain/services/retry-strategy.service';

@Injectable()
export class ProcessDeliveryUseCase {
  private readonly logger = new Logger(ProcessDeliveryUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(ENDPOINT_REPOSITORY)
    private readonly endpointRepository: IEndpointRepository,
    @Inject(ATTEMPT_REPOSITORY)
    private readonly attemptRepository: IAttemptRepository,
    @Inject(WEBHOOK_DISPATCHER)
    private readonly webhookDispatcher: IWebhookDispatcher,
    private readonly retryStrategy: RetryStrategyService,
  ) {}

  async execute(eventId: string): Promise<void> {
    this.logger.log(`Processing delivery for event: ${eventId}`);

    // 1. Worker Idempotency check (Optimistic locking)
    const locked = await this.eventRepository.lockForProcessing(eventId);
    if (!locked) {
      this.logger.warn(`Event ${eventId} is already processing or completed. Aborting to prevent duplicates.`);
      return;
    }

    // 2. Fetch the event details
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      this.logger.error(`Event ${eventId} not found in database.`);
      return;
    }

    // 3. Fetch endpoint configuration
    const endpoint = await this.endpointRepository.findById(event.endpointId);
    if (!endpoint) {
      this.logger.error(`Endpoint ${event.endpointId} not found for event ${eventId}. Marking event as dead.`);
      await this.eventRepository.updateStatus(eventId, 'dead');
      return;
    }

    // Safety check: skip if endpoint is paused
    if (!endpoint.isActive) {
      this.logger.warn(`Endpoint ${endpoint.id} is inactive. Releasing processing status.`);
      // Reset status to previous state and release lock
      await this.eventRepository.updateStatus(eventId, event.status);
      return;
    }

    // Inject Idempotency & Security Headers
    let signatureHeader = '';
    if (endpoint.signingSecret) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const payloadString = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
      const hmac = crypto
        .createHmac('sha256', endpoint.signingSecret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');
      signatureHeader = `t=${timestamp},v1=${hmac}`;
    }

    const headers = {
      ...(event.headers as Record<string, string> || {}),
      'X-Kiosk-Event-Id': event.id,
    };

    if (signatureHeader) {
      headers['Kiosk-Signature'] = signatureHeader;
    }

    // 4. Dispatch the HTTP payload
    this.logger.log(`Dispatching event ${event.id} to ${endpoint.destinationUrl}`);
    const result = await this.webhookDispatcher.dispatch(endpoint.destinationUrl, event.payload, headers);

    // 5. Record attempt history
    await this.attemptRepository.create({
      eventId: event.id,
      responseStatus: result.status,
      responseBody: result.body,
      latencyMs: result.latencyMs,
    });

    // 6. Handle outcome and transition event state
    const isSuccess = result.status !== null && result.status >= 200 && result.status < 300;

    if (isSuccess) {
      this.logger.log(`Event ${event.id} delivered successfully with status ${result.status}`);
      await this.eventRepository.updateStatus(event.id, 'delivered');
    } else {
      const nextRetryCount = event.retryCount + 1;
      if (nextRetryCount >= event.maxRetries) {
        this.logger.warn(`Event ${event.id} failed after reaching max retries (${event.maxRetries}). Marking as dead.`);
        await this.eventRepository.updateStatus(event.id, 'dead');
      } else {
        const nextRetryAt = this.retryStrategy.calculateNextRetry(event.retryCount);
        this.logger.log(`Event ${event.id} failed (Status: ${result.status}). Scheduling retry #${nextRetryCount} at ${nextRetryAt.toISOString()}`);
        await this.eventRepository.updateStatus(event.id, 'retrying', {
          retryCount: nextRetryCount,
          nextRetryAt,
        });
      }
    }
  }
}
