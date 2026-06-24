import { Controller, Get, UseGuards, Request, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ATTEMPT_REPOSITORY } from '../../domain/ports/attempt-repository.port';
import type { IAttemptRepository } from '../../domain/ports/attempt-repository.port';

@Controller('attempts')
@UseGuards(AuthGuard('jwt'))
export class AttemptsController {
  constructor(
    @Inject(ATTEMPT_REPOSITORY)
    private readonly attemptRepository: IAttemptRepository,
  ) {}

  @Get()
  async getAttempts(@Request() req) {
    const userId = req.user.id;
    const attempts = await this.attemptRepository.findByUserId(userId);
    return attempts;
  }
}
