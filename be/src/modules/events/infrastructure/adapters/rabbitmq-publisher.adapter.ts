import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { IQueuePublisher } from '../../domain/ports/queue-publisher.port';

@Injectable()
export class RabbitMQPublisher implements IQueuePublisher {
  private readonly logger = new Logger(RabbitMQPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(eventId: string): Promise<void> {
    this.logger.log(`Publishing event ${eventId} to RabbitMQ`);
    await this.amqpConnection.publish('kiosk.webhooks', 'webhook.deliver', { eventId });
  }

  async publishWithDelay(eventId: string, delayMs: number): Promise<void> {
    this.logger.log(`Publishing event ${eventId} to RabbitMQ with delay of ${delayMs}ms`);
    // Note: We use routing key for delay or headers if using delayed message exchange
    await this.amqpConnection.publish('kiosk.webhooks', 'webhook.deliver', { eventId }, {
      headers: { 'x-delay': delayMs }
    });
  }
}
