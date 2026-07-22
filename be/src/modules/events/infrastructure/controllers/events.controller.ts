import { Controller, Get, Post, Param, Inject, NotFoundException, Query } from '@nestjs/common';

import { EVENT_REPOSITORY } from '../../domain/ports/event-repository.port';
import type { IEventRepository } from '../../domain/ports/event-repository.port';
import { ENDPOINT_REPOSITORY } from '../../../endpoints/domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../../../endpoints/domain/ports/endpoint-repository.port';
import { QUEUE_PUBLISHER } from '../../domain/ports/queue-publisher.port';
import type { IQueuePublisher } from '../../domain/ports/queue-publisher.port';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(ENDPOINT_REPOSITORY)
    private readonly endpointRepository: IEndpointRepository,
    @Inject(QUEUE_PUBLISHER)
    private readonly queuePublisher: IQueuePublisher,
  ) {}

  @Get()
  async getEvents(
    @Query('page') page?: string, 
    @Query('limit') limit?: string,
    @Query('endpointId') endpointId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    
    const events = await this.eventRepository.findAll({ 
      page: pageNum, 
      limit: limitNum,
      endpointId,
      status,
      search,
    });
    return events;
  }

  @Post(':id/retry')
  async retryEvent(@Param('id') id: string) {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const reset = await this.eventRepository.resetEvent(id);
    if (reset) {
      await this.queuePublisher.publish(id);
    }
    
    return { success: true, message: 'Event scheduled for retry' };
  }

  @Post('retry-all-dead')
  async retryAllDead() {
    const ids = await this.eventRepository.resetAllDeadEvents();
    
    for (const id of ids) {
      await this.queuePublisher.publish(id);
    }
    
    return { success: true, count: ids.length, message: `${ids.length} dead events scheduled for retry` };
  }
}
