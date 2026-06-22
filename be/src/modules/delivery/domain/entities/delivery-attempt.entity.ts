export class DeliveryAttempt {
  id: string;
  eventId: string;
  responseStatus: number | null;
  responseBody: string | null;
  latencyMs: number;
  attemptedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<DeliveryAttempt>) {
    Object.assign(this, partial);
  }

  get isSuccess(): boolean {
    return this.responseStatus !== null && this.responseStatus >= 200 && this.responseStatus < 300;
  }
}
