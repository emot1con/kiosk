import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EndpointService } from './application/endpoint.service';
import { EndpointController } from './infrastructure/controllers/endpoint.controller';
import { EndpointOrmEntity } from './infrastructure/adapters/endpoint.orm-entity';
import { PostgresEndpointRepository } from './infrastructure/adapters/postgres-endpoint.repository';
import { ENDPOINT_REPOSITORY } from './domain/ports/endpoint-repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([EndpointOrmEntity])
  ],
  controllers: [EndpointController],
  providers: [
    EndpointService,
    {
      provide: ENDPOINT_REPOSITORY,
      useClass: PostgresEndpointRepository,
    },
  ],
  exports: [
    EndpointService,
    ENDPOINT_REPOSITORY,
  ],
})
export class EndpointsModule {}
