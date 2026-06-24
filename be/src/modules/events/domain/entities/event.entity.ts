export type EventStatus = 'pending' | 'delivered' | 'retrying' | 'dead';

export class WebhookEvent {
  id: string;
  endpointId: string;
  provider: string | null;
  status: EventStatus;
  idempotencyKey: string | null;
  isProcessing: boolean;
  headers: Record<string, string>;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<WebhookEvent>) {
    Object.assign(this, partial);
  }

  get isDead(): boolean {
    return this.status === 'dead';
  }

  get isRetriable(): boolean {
    return this.retryCount < this.maxRetries;
  }
}
