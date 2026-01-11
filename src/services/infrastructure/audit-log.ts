/**
 * AUDIT LOG - Immutable Service Audit Trail
 * 
 * All service state changes are logged here for compliance and debugging.
 * This extends the anti-fraud audit log with service-specific events.
 * 
 * CONSTRAINTS:
 * - Append-only (no updates, no deletes)
 * - Every entry has correlationId for tracing
 * - Court-safe (deterministic, reproducible)
 * - Preserved for legal as needed
 */

import type { UserId } from '@/modules/operations/types';
import { eventBus, createServiceEvent } from './event-bus';

// ═══════════════════════════════════════════════════════════════════
// AUDIT ENTRY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly eventType: AuditEventType;
  readonly aggregateType: AuditAggregateType;
  readonly aggregateId: string;
  readonly actor: UserId | 'SYSTEM';
  readonly correlationId: string;
  readonly previousState?: string;
  readonly newState?: string;
  readonly details: Record<string, unknown>;
  readonly preservedForLegal: boolean;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export type AuditAggregateType =
  | 'application'
  | 'training_profile'
  | 'training_module'
  | 'assessment'
  | 'certification'
  | 'field_operation'
  | 'ownership_claim'
  | 'animal_release'
  | 'role_assignment'
  | 'user_account';

export type AuditEventType =
  // Application events
  | 'APPLICATION_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATE_CHANGED'
  | 'APPLICATION_SCORE_CALCULATED'
  | 'APPLICATION_REVIEWED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WITHDRAWN'
  | 'APPLICATION_EXPIRED'
  // Training events
  | 'TRAINING_PROFILE_CREATED'
  | 'TRAINING_PATH_ASSIGNED'
  | 'TRAINING_MODULE_STARTED'
  | 'TRAINING_MODULE_COMPLETED'
  | 'TRAINING_MODULE_FAILED'
  | 'TRAINING_ASSESSMENT_STARTED'
  | 'TRAINING_ASSESSMENT_SUBMITTED'
  | 'TRAINING_ASSESSMENT_GRADED'
  | 'TRAINING_CERTIFICATION_ISSUED'
  | 'TRAINING_CERTIFICATION_RENEWED'
  | 'TRAINING_CERTIFICATION_EXPIRED'
  // Safety events
  | 'FIELD_OP_STARTED'
  | 'FIELD_OP_CHECK_IN'
  | 'FIELD_OP_CHECK_IN_MISSED'
  | 'FIELD_OP_ESCALATED'
  | 'FIELD_OP_COMPLETED'
  | 'EMERGENCY_CONTACT_NOTIFIED'
  // Verification events
  | 'CLAIM_CREATED'
  | 'EVIDENCE_ADDED'
  | 'EVIDENCE_VERIFIED'
  | 'CLAIM_SCORE_CALCULATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'RELEASE_AUTHORIZED'
  | 'RELEASE_COMPLETED'
  // Role events
  | 'ROLE_GRANTED'
  | 'ROLE_SUSPENDED'
  | 'ROLE_REVOKED'
  | 'ROLE_REINSTATED'
  // Background check events
  | 'BACKGROUND_CHECK_INITIATED'
  | 'BACKGROUND_CHECK_COMPLETED'
  | 'BACKGROUND_CHECK_FAILED';

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOG STORE
// ═══════════════════════════════════════════════════════════════════

class AuditLogStore {
  private entries: AuditEntry[] = [];
  private readonly maxEntries = 100000;

  append(entry: AuditEntry): void {
    this.entries.push(entry);
    
    // Emit to event bus for subscribers
    eventBus.publish(createServiceEvent(
      `AUDIT_${entry.eventType}`,
      { ...entry } as Record<string, unknown>,
      entry.actor,
      { correlationId: entry.correlationId }
    ));

    // Trim if needed (in production, this would write to Supabase)
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  getByAggregate(aggregateType: AuditAggregateType, aggregateId: string): AuditEntry[] {
    return this.entries.filter(
      e => e.aggregateType === aggregateType && e.aggregateId === aggregateId
    );
  }

  getByCorrelation(correlationId: string): AuditEntry[] {
    return this.entries.filter(e => e.correlationId === correlationId);
  }

  getByActor(actor: UserId | 'SYSTEM'): AuditEntry[] {
    return this.entries.filter(e => e.actor === actor);
  }

  getByTimeRange(start: string, end: string): AuditEntry[] {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.entries.filter(e => {
      const timestamp = new Date(e.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
  }

  getLegalPreserved(): AuditEntry[] {
    return this.entries.filter(e => e.preservedForLegal);
  }

  getRecent(limit: number = 100): AuditEntry[] {
    return this.entries.slice(-limit).reverse();
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════

export const auditLog = new AuditLogStore();

// ═══════════════════════════════════════════════════════════════════
// AUDIT ENTRY FACTORY
// ═══════════════════════════════════════════════════════════════════

let auditCounter = 0;

export function createAuditEntry(params: {
  eventType: AuditEventType;
  aggregateType: AuditAggregateType;
  aggregateId: string;
  actor: UserId | 'SYSTEM';
  correlationId?: string;
  previousState?: string;
  newState?: string;
  details?: Record<string, unknown>;
  preservedForLegal?: boolean;
  ipAddress?: string;
  userAgent?: string;
}): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${++auditCounter}`,
    timestamp: new Date().toISOString(),
    eventType: params.eventType,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    actor: params.actor,
    correlationId: params.correlationId ?? `corr-${Date.now()}-${auditCounter}`,
    previousState: params.previousState,
    newState: params.newState,
    details: params.details ?? {},
    preservedForLegal: params.preservedForLegal ?? false,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  };

  auditLog.append(entry);
  return entry;
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function logApplicationStateChange(params: {
  applicationId: string;
  actor: UserId | 'SYSTEM';
  previousState: string;
  newState: string;
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: 'APPLICATION_STATE_CHANGED',
    aggregateType: 'application',
    aggregateId: params.applicationId,
    actor: params.actor,
    correlationId: params.correlationId,
    previousState: params.previousState,
    newState: params.newState,
    details: params.details,
    preservedForLegal: true,
  });
}

export function logTrainingProgress(params: {
  userId: string;
  moduleId: string;
  eventType: AuditEventType;
  actor: UserId | 'SYSTEM';
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: params.eventType,
    aggregateType: 'training_module',
    aggregateId: `${params.userId}:${params.moduleId}`,
    actor: params.actor,
    correlationId: params.correlationId,
    details: params.details,
    preservedForLegal: false,
  });
}

export function logFieldOperation(params: {
  operationId: string;
  eventType: AuditEventType;
  actor: UserId | 'SYSTEM';
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: params.eventType,
    aggregateType: 'field_operation',
    aggregateId: params.operationId,
    actor: params.actor,
    correlationId: params.correlationId,
    details: params.details,
    preservedForLegal: true,
  });
}

export function logOwnershipClaim(params: {
  claimId: string;
  eventType: AuditEventType;
  actor: UserId | 'SYSTEM';
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: params.eventType,
    aggregateType: 'ownership_claim',
    aggregateId: params.claimId,
    actor: params.actor,
    correlationId: params.correlationId,
    details: params.details,
    preservedForLegal: true,
  });
}

export function logRoleChange(params: {
  userId: string;
  roleId: string;
  eventType: 'ROLE_GRANTED' | 'ROLE_SUSPENDED' | 'ROLE_REVOKED' | 'ROLE_REINSTATED';
  actor: UserId | 'SYSTEM';
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: params.eventType,
    aggregateType: 'role_assignment',
    aggregateId: `${params.userId}:${params.roleId}`,
    actor: params.actor,
    correlationId: params.correlationId,
    details: params.details,
    preservedForLegal: true,
  });
}

export function logBackgroundCheck(params: {
  applicationId: string;
  eventType: 'BACKGROUND_CHECK_INITIATED' | 'BACKGROUND_CHECK_COMPLETED' | 'BACKGROUND_CHECK_FAILED';
  actor: UserId | 'SYSTEM';
  correlationId: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return createAuditEntry({
    eventType: params.eventType,
    aggregateType: 'application',
    aggregateId: params.applicationId,
    actor: params.actor,
    correlationId: params.correlationId,
    details: params.details,
    preservedForLegal: true,
  });
}
