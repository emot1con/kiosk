export const QUEUE_PUBLISHER = Symbol('QUEUE_PUBLISHER');

export interface IQueuePublisher {
  publish(eventId: string): Promise<void>;
  publishWithDelay(eventId: string, delayMs: number): Promise<void>;
}
