import { Controller, Get, Post, Param, UseGuards, Request, Inject, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EVENT_REPOSITORY } from '../../domain/ports/event-repository.port';
import type { IEventRepository } from '../../domain/ports/event-repository.port';
import { ENDPOINT_REPOSITORY } from '../../../endpoints/domain/ports/endpoint-repository.port';
import type { IEndpointRepository } from '../../../endpoints/domain/ports/endpoint-repository.port';
import { QUEUE_PUBLISHER } from '../../domain/ports/queue-publisher.port';
import type { IQueuePublisher } from '../../domain/ports/queue-publisher.port';

@Controller('events')
@UseGuards(AuthGuard('jwt'))
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
  async getEvents(@Request() req) {
    const userId = req.user.id;
    const events = await this.eventRepository.findByUserId(userId);
    return events;
  }

  @Post(':id/retry')
  async retryEvent(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    // Verify ownership
    const endpoints = await this.endpointRepository.findByUserId(userId);
    if (!endpoints.some(e => e.id === event.endpointId)) {
      throw new NotFoundException('Event not found');
    }

    const reset = await this.eventRepository.resetEvent(id);
    if (reset) {
      await this.queuePublisher.publish(id);
    }
    
    return { success: true, message: 'Event scheduled for retry' };
  }

  @Post('retry-all-dead')
  async retryAllDead(@Request() req) {
    const userId = req.user.id;
    const ids = await this.eventRepository.resetAllDeadEvents(userId);
    
    for (const id of ids) {
      await this.queuePublisher.publish(id);
    }
    
    return { success: true, count: ids.length, message: `${ids.length} dead events scheduled for retry` };
  }
}
