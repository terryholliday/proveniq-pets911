/**
 * EVENT BUS - Cross-Service Communication
 * 
 * Publish-subscribe pattern for domain events.
 * All state changes emit events for audit trail and service coordination.
 * 
 * CONSTRAINTS:
 * - Every event includes correlationId for tracing
 * - Events are immutable once emitted
 * - Handlers must not throw (fail gracefully)
 */

import type { UserId } from '@/modules/operations/types';

// ═══════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ServiceEvent<T extends string = string, P extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly type: T;
  readonly occurredAt: string;
  readonly actor: UserId | 'SYSTEM';
  readonly correlationId: string;
  readonly causationId?: string;
  readonly payload: P;
  readonly metadata: EventMetadata;
}

export interface EventMetadata {
  readonly source: string;
  readonly version: string;
  readonly environment: 'production' | 'staging' | 'development';
}

export type EventHandler<T extends ServiceEvent = ServiceEvent> = (event: T) => void | Promise<void>;

export type EventFilter = (event: ServiceEvent) => boolean;

// ═══════════════════════════════════════════════════════════════════
// EVENT BUS INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface IEventBus {
  publish<T extends string, P extends Record<string, unknown>>(event: ServiceEvent<T, P>): void;
  subscribe<T extends ServiceEvent>(eventType: string, handler: EventHandler<T>): () => void;
  subscribeAll(handler: EventHandler, filter?: EventFilter): () => void;
  getRecentEvents(limit?: number): ServiceEvent[];
  getEventsByCorrelation(correlationId: string): ServiceEvent[];
}

// ═══════════════════════════════════════════════════════════════════
// EVENT BUS IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class EventBusImpl implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<{ handler: EventHandler; filter?: EventFilter }> = new Set();
  private eventLog: ServiceEvent[] = [];
  private readonly maxLogSize = 10000;

  publish<T extends string, P extends Record<string, unknown>>(event: ServiceEvent<T, P>): void {
    // Append to immutable log
    this.eventLog.push(event as unknown as ServiceEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Notify type-specific handlers
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      for (const handler of Array.from(typeHandlers)) {
        this.safeInvoke(handler, event as unknown as ServiceEvent);
      }
    }

    // Notify global handlers
    for (const { handler, filter } of Array.from(this.globalHandlers)) {
      if (!filter || filter(event as unknown as ServiceEvent)) {
        this.safeInvoke(handler, event as unknown as ServiceEvent);
      }
    }
  }

  subscribe<T extends ServiceEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  subscribeAll(handler: EventHandler, filter?: EventFilter): () => void {
    const entry = { handler, filter };
    this.globalHandlers.add(entry);

    return () => {
      this.globalHandlers.delete(entry);
    };
  }

  getRecentEvents(limit: number = 100): ServiceEvent[] {
    return this.eventLog.slice(-limit);
  }

  getEventsByCorrelation(correlationId: string): ServiceEvent[] {
    return this.eventLog.filter(e => e.correlationId === correlationId);
  }

  private safeInvoke(handler: EventHandler, event: ServiceEvent): void {
    try {
      const result = handler(event);
      if (result instanceof Promise) {
        result.catch(err => {
          console.error(`[EventBus] Async handler error for ${event.type}:`, err);
        });
      }
    } catch (err) {
      console.error(`[EventBus] Handler error for ${event.type}:`, err);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════

export const eventBus: IEventBus = new EventBusImpl();

// ═══════════════════════════════════════════════════════════════════
// EVENT FACTORY
// ═══════════════════════════════════════════════════════════════════

let correlationCounter = 0;

export function createServiceEvent<T extends string, P extends Record<string, unknown>>(
  type: T,
  payload: P,
  actor: UserId | 'SYSTEM',
  options?: {
    correlationId?: string;
    causationId?: string;
    source?: string;
  }
): ServiceEvent<T, P> {
  const correlationId = options?.correlationId ?? `corr-${Date.now()}-${++correlationCounter}`;
  
  return {
    id: crypto.randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    actor,
    correlationId,
    causationId: options?.causationId,
    payload,
    metadata: {
      source: options?.source ?? 'petmayday-services',
      version: '2.0.0',
      environment: (process.env.NODE_ENV as 'production' | 'staging' | 'development') || 'development',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMMON EVENT TYPES
// ═══════════════════════════════════════════════════════════════════

export type ApplicationEventType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_P1_APPROVED'
  | 'APPLICATION_P1_REJECTED'
  | 'APPLICATION_P2_STARTED'
  | 'APPLICATION_BACKGROUND_CHECK_INITIATED'
  | 'APPLICATION_BACKGROUND_CHECK_COMPLETED'
  | 'APPLICATION_TRAINING_COMPLETED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WITHDRAWN'
  | 'APPLICATION_EXPIRED';

export type TrainingEventType =
  | 'TRAINING_PATH_ASSIGNED'
  | 'TRAINING_MODULE_STARTED'
  | 'TRAINING_MODULE_COMPLETED'
  | 'TRAINING_ASSESSMENT_STARTED'
  | 'TRAINING_ASSESSMENT_SUBMITTED'
  | 'TRAINING_ASSESSMENT_PASSED'
  | 'TRAINING_ASSESSMENT_FAILED'
  | 'TRAINING_CERTIFICATION_ISSUED'
  | 'TRAINING_CERTIFICATION_EXPIRED'
  | 'TRAINING_CERTIFICATION_RENEWED';

export type SafetyEventType =
  | 'FIELD_OP_STARTED'
  | 'FIELD_OP_CHECK_IN'
  | 'FIELD_OP_CHECK_IN_MISSED'
  | 'FIELD_OP_ESCALATED'
  | 'FIELD_OP_COMPLETED'
  | 'EMERGENCY_CONTACT_NOTIFIED';

export type VerificationEventType =
  | 'CLAIM_SUBMITTED'
  | 'EVIDENCE_ADDED'
  | 'EVIDENCE_VERIFIED'
  | 'CLAIM_SCORE_CALCULATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'RELEASE_AUTHORIZED'
  | 'RELEASE_COMPLETED';
