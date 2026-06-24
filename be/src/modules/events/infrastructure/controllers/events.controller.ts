import { Controller, Get, UseGuards, Request, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EVENT_REPOSITORY } from '../../domain/ports/event-repository.port';
import type { IEventRepository } from '../../domain/ports/event-repository.port';

@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  @Get()
  async getEvents(@Request() req) {
    const userId = req.user.id;
    const events = await this.eventRepository.findByUserId(userId);
    return events;
  }
}
