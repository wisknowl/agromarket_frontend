import { apiClient } from './client';

export interface TelemetryPayload {
  eventType: 'VIEW' | 'VIDEO_WATCH' | 'LIKE' | 'SHARE' | 'COMMENT' | 'OFFER_SENT' | 'SEARCH';
  entityType: 'POST' | 'YIELD' | 'FARMER' | 'ORDER';
  entityId: string;
  metadata?: {
    watchDurationSeconds?: number;
    videoTotalSeconds?: number;
    completedPercentage?: number;
    reactionType?: 'fresh' | 'demand' | 'ready' | 'partner';
    [key: string]: any;
  };
  timestamp?: string;
}

class TelemetryClient {
  private buffer: TelemetryPayload[] = [];
  private flushTimer: any = null;

  constructor() {
    if (typeof setInterval !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, 6000);
    }
  }

  public record(payload: TelemetryPayload, immediate = false): void {
    const eventWithTime: TelemetryPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    this.buffer.push(eventWithTime);

    if (immediate || this.buffer.length >= 10) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const eventsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      await apiClient.post('/telemetry/events', { events: eventsToFlush });
    } catch {
      // Telemetry ingestion is non-blocking; swallow network drops gracefully
    }
  }
}

export const telemetryClient = new TelemetryClient();
export default telemetryClient;
