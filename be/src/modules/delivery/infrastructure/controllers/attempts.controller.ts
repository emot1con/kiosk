import { Controller, Get, UseGuards, Request, Inject, Query } from '@nestjs/common';
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
  async getAttempts(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user.id;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    
    const attempts = await this.attemptRepository.findByUserId(userId, {
      page: pageNum,
      limit: limitNum
    });
    return attempts;
  }
}
