import { Injectable } from '@nestjs/common';
import { IWebhookDispatcher, DispatchResult } from '../../domain/ports/webhook-dispatcher.port';

@Injectable()
export class FetchWebhookDispatcher implements IWebhookDispatcher {
  async dispatch(url: string, payload: any, headers: Record<string, string>): Promise<DispatchResult> {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    // Build headers to send
    const cleanHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward all original headers safely (excluding Host and standard overridden ones)
    if (headers) {
      const excludedHeaders = ['host', 'content-length', 'content-type', 'connection'];
      for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();
        if (!excludedHeaders.includes(lowerKey)) {
          cleanHeaders[key] = String(value);
        }
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: cleanHeaders,
        body: typeof payload === 'string' ? payload : JSON.stringify(payload || {}),
        signal: controller.signal,
      });

      const body = await response.text();
      const latencyMs = Date.now() - start;

      return {
        status: response.status,
        body: body.substring(0, 2000), // Truncate long bodies to avoid blowing up DB size
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      let body = err.message || 'Unknown network error';
      if (err.name === 'AbortError') {
        body = 'Request timed out after 10000ms';
      }
      return {
        status: null, // Null responseStatus indicates timeout/connection error
        body,
        latencyMs,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
