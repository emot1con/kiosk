import { WebhookEvent } from '../entities/event.entity';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface IEventRepository {
  findById(id: string): Promise<WebhookEvent | null>;
  findByEndpointId(endpointId: string, filters?: any): Promise<WebhookEvent[]>;
  findByUserId(userId: string, filters?: { page?: number; limit?: number }): Promise<{ data: WebhookEvent[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  create(data: Partial<WebhookEvent>): Promise<WebhookEvent>;
  updateStatus(id: string, status: string, retryData?: { retryCount: number; nextRetryAt: Date | null }): Promise<void>;
  lockForProcessing(id: string): Promise<boolean>;
  findRetryQueue(): Promise<WebhookEvent[]>;
  getStatusCounts(userId: string): Promise<{ pending: number; delivered: number; retrying: number; dead: number }>;
  incrementStat(userId: string, status: 'pending'): Promise<void>;
  transitionStat(userId: string, from: 'pending' | 'retrying', to: 'delivered' | 'retrying' | 'dead'): Promise<void>;
  resetAllDeadEvents(userId: string): Promise<string[]>;
  resetEvent(id: string): Promise<boolean>;
}
