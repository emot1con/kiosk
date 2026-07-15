import { DeliveryAttempt } from '../entities/delivery-attempt.entity';

export const ATTEMPT_REPOSITORY = Symbol('ATTEMPT_REPOSITORY');

export interface IAttemptRepository {
  create(data: Partial<DeliveryAttempt>): Promise<DeliveryAttempt>;
  findByEventId(eventId: string): Promise<DeliveryAttempt[]>;
  findByUserId(userId: string, filters?: { page?: number; limit?: number }): Promise<{ data: DeliveryAttempt[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  getAvgLatencyByEndpoint(endpointId: string): Promise<number>;
}
