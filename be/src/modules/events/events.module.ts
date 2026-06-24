import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EndpointsModule } from '../endpoints/endpoints.module';
import { IngressService } from './application/ingress.service';
import { EVENT_REPOSITORY } from './domain/ports/event-repository.port';
import { QUEUE_PUBLISHER } from './domain/ports/queue-publisher.port';
import { EventOrmEntity } from './infrastructure/adapters/event.orm-entity';
import { PostgresEventRepository } from './infrastructure/adapters/postgres-event.repository';
import { RabbitMQPublisher } from './infrastructure/adapters/rabbitmq-publisher.adapter';
import { IngressController } from './infrastructure/controllers/ingress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventOrmEntity]),
    EndpointsModule,
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'kiosk.webhooks',
            type: 'topic',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5672',
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [IngressController],
  providers: [
    IngressService,
    {
      provide: EVENT_REPOSITORY,
      useClass: PostgresEventRepository,
    },
    {
      provide: QUEUE_PUBLISHER,
      useClass: RabbitMQPublisher,
    },
  ],
  exports: [
    EVENT_REPOSITORY,
    QUEUE_PUBLISHER,
  ],
})
export class EventsModule {}
