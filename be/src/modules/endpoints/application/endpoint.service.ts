import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ENDPOINT_REPOSITORY } from '../domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../domain/ports/endpoint-repository.port';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';

@Injectable()
export class EndpointService {
  private readonly logger = new Logger(EndpointService.name);

  constructor(
    @Inject(ENDPOINT_REPOSITORY)
    private readonly endpointRepository: IEndpointRepository,
  ) {}

  async create(userId: string, dto: CreateEndpointDto) {
    const incomingKey = randomBytes(16).toString('hex'); // 32 chars
    
    const endpoint = await this.endpointRepository.create({
      userId,
      name: dto.name,
      incomingKey,
      destinationUrl: dto.destinationUrl,
      signingSecret: dto.signingSecret,
      isActive: true,
    });

    this.logger.log(`Endpoint created: id=${endpoint.id}, userId=${userId}`);
    return endpoint;
  }

  async findAllByUser(userId: string) {
    return this.endpointRepository.findByUserId(userId);
  }

  async findOne(id: string, userId: string) {
    const endpoint = await this.endpointRepository.findById(id);
    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }
    if (endpoint.userId !== userId) {
      throw new ForbiddenException('You do not have access to this endpoint');
    }
    return endpoint;
  }

  async update(id: string, userId: string, dto: UpdateEndpointDto) {
    const endpoint = await this.findOne(id, userId);
    
    const updated = await this.endpointRepository.update(id, {
      name: dto.name ?? endpoint.name,
      destinationUrl: dto.destinationUrl ?? endpoint.destinationUrl,
      signingSecret: dto.signingSecret !== undefined ? dto.signingSecret : endpoint.signingSecret,
      isActive: dto.isActive ?? endpoint.isActive,
    });

    this.logger.log(`Endpoint updated: id=${id}, userId=${userId}`);
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // verify ownership and existence
    await this.endpointRepository.softDelete(id);
    this.logger.log(`Endpoint soft-deleted: id=${id}, userId=${userId}`);
    return { success: true };
  }
}
