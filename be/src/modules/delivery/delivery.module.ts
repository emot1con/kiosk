import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EndpointsModule } from '../endpoints/endpoints.module';
import { EventsModule } from '../events/events.module';
import { ProcessDeliveryUseCase } from './application/process-delivery.use-case';
import { ATTEMPT_REPOSITORY } from './domain/ports/attempt-repository.port';
import { WEBHOOK_DISPATCHER } from './domain/ports/webhook-dispatcher.port';
import { RetryStrategyService } from './domain/services/retry-strategy.service';
import { AttemptOrmEntity } from './infrastructure/adapters/attempt.orm-entity';
import { FetchWebhookDispatcher } from './infrastructure/adapters/fetch-webhook.dispatcher';
import { PostgresAttemptRepository } from './infrastructure/adapters/postgres-attempt.repository';
import { RabbitMQConsumerAdapter } from './infrastructure/adapters/rabbitmq-consumer.adapter';

import { AttemptsController } from './infrastructure/controllers/attempts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttemptOrmEntity]),
    EventsModule,
    EndpointsModule,
  ],
  controllers: [AttemptsController],
  providers: [
    ProcessDeliveryUseCase,
    RetryStrategyService,
    RabbitMQConsumerAdapter,
    {
      provide: ATTEMPT_REPOSITORY,
      useClass: PostgresAttemptRepository,
    },
    {
      provide: WEBHOOK_DISPATCHER,
      useClass: FetchWebhookDispatcher,
    },
  ],
  exports: [
    ATTEMPT_REPOSITORY,
  ],
})
export class DeliveryModule {}
