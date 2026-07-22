import { WebhookEvent } from '../entities/event.entity';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface IEventRepository {
  findById(id: string): Promise<WebhookEvent | null>;
  findByEndpointId(endpointId: string, filters?: any): Promise<WebhookEvent[]>;
  findAll(filters?: { 
    page?: number; 
    limit?: number;
    endpointId?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: WebhookEvent[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  create(data: Partial<WebhookEvent>): Promise<WebhookEvent>;
  updateStatus(id: string, status: string, retryData?: { retryCount: number; nextRetryAt: Date | null }): Promise<void>;
  lockForProcessing(id: string): Promise<boolean>;
  findRetryQueue(): Promise<WebhookEvent[]>;
  getStatusCounts(): Promise<{ pending: number; delivered: number; retrying: number; dead: number }>;
  incrementStat(status: 'pending'): Promise<void>;
  transitionStat(from: 'pending' | 'retrying', to: 'delivered' | 'retrying' | 'dead'): Promise<void>;
  resetAllDeadEvents(): Promise<string[]>;
  resetEvent(id: string): Promise<boolean>;
}
