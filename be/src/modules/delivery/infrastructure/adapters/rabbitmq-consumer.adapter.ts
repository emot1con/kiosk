import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { ProcessDeliveryUseCase } from '../../application/process-delivery.use-case';

@Injectable()
export class RabbitMQConsumerAdapter {
  private readonly logger = new Logger(RabbitMQConsumerAdapter.name);

  constructor(
    private readonly processDeliveryUseCase: ProcessDeliveryUseCase,
  ) {}

  @RabbitSubscribe({
    exchange: 'kiosk.webhooks',
    routingKey: 'webhook.deliver',
    queue: 'kiosk_delivery_queue',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'kiosk.webhooks.dlx',
      deadLetterRoutingKey: 'webhook.deliver.dlq',
    },
  })
  async consume(msg: { eventId: string }) {
    this.logger.log(`Received message from queue for event: ${msg.eventId}`);
    
    try {
      await this.processDeliveryUseCase.execute(msg.eventId);
    } catch (err) {
      this.logger.error(`Fatal error inside consumer for event ${msg.eventId}:`, err);
      // Negatively acknowledge and do not requeue, moving the message to the DLQ
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'kiosk.webhooks.dlx',
    routingKey: 'webhook.deliver.dlq',
    queue: 'kiosk_delivery_queue_dlq',
    queueOptions: {
      durable: true,
    },
  })
  async consumeDLQ(msg: any) {
    this.logger.error(`[DLQ] Dead-lettered message received in DLQ: ${JSON.stringify(msg)}`);
  }
}
