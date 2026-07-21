import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ENDPOINT_REPOSITORY } from '../domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../domain/ports/endpoint-repository.port';
import { CreateEndpointDto } from '../infrastructure/dto/create-endpoint.dto';
import { UpdateEndpointDto } from '../infrastructure/dto/update-endpoint.dto';

@Injectable()
export class EndpointService {
  private readonly logger = new Logger(EndpointService.name);

  constructor(
    @Inject(ENDPOINT_REPOSITORY)
    private readonly endpointRepository: IEndpointRepository,
  ) {}

  async create(dto: CreateEndpointDto) {
    const incomingKey = randomBytes(16).toString('hex'); // 32 chars
    const generatedSigningSecret = 'whsec_' + randomBytes(24).toString('base64url');
    
    const endpoint = await this.endpointRepository.create({
      name: dto.name,
      incomingKey,
      destinationUrl: dto.destinationUrl,
      provider: dto.provider,
      signingSecret: dto.signingSecret || generatedSigningSecret,
      isActive: true,
    });

    this.logger.log(`Endpoint created: id=${endpoint.id}`);
    return endpoint;
  }

  async findAll() {
    return this.endpointRepository.findAll();
  }

  async findOne(id: string) {
    const endpoint = await this.endpointRepository.findById(id);
    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }
    return endpoint;
  }

  async update(id: string, dto: UpdateEndpointDto) {
    const endpoint = await this.findOne(id);
    
    const updated = await this.endpointRepository.update(id, {
      name: dto.name ?? endpoint.name,
      destinationUrl: dto.destinationUrl ?? endpoint.destinationUrl,
      provider: dto.provider ?? endpoint.provider,
      signingSecret: dto.signingSecret !== undefined ? dto.signingSecret : endpoint.signingSecret,
      isActive: dto.isActive ?? endpoint.isActive,
    });

    this.logger.log(`Endpoint updated: id=${id}`);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id); // verify existence
    await this.endpointRepository.softDelete(id);
    this.logger.log(`Endpoint soft-deleted: id=${id}`);
    return { success: true };
  }
}
