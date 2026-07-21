import { Controller, Get, Inject, Query } from '@nestjs/common';

import { ATTEMPT_REPOSITORY } from '../../domain/ports/attempt-repository.port';
import type { IAttemptRepository } from '../../domain/ports/attempt-repository.port';

@Controller('attempts')
export class AttemptsController {
  constructor(
    @Inject(ATTEMPT_REPOSITORY)
    private readonly attemptRepository: IAttemptRepository,
  ) {}

  @Get()
  async getAttempts(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    
    const attempts = await this.attemptRepository.findAll({
      page: pageNum,
      limit: limitNum
    });
    return attempts;
  }
}
