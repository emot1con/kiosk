export const WEBHOOK_DISPATCHER = Symbol('WEBHOOK_DISPATCHER');

export interface DispatchResult {
  status: number | null;
  body: string | null;
  latencyMs: number;
}

export interface IWebhookDispatcher {
  dispatch(url: string, payload: any, headers: Record<string, string>): Promise<DispatchResult>;
}
