import { DeliveryAttempt } from '../entities/delivery-attempt.entity';

export const ATTEMPT_REPOSITORY = Symbol('ATTEMPT_REPOSITORY');

export interface IAttemptRepository {
  create(data: Partial<DeliveryAttempt>): Promise<DeliveryAttempt>;
  findByEventId(eventId: string): Promise<DeliveryAttempt[]>;
  getAvgLatencyByEndpoint(endpointId: string): Promise<number>;
}
