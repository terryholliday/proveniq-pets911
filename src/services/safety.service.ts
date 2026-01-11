/**
 * SAFETY SERVICE - Lone Worker Check-In & Field Operation Monitoring
 * 
 * CRITICAL SAFETY PROTOCOLS:
 * - Field volunteers must check in at intervals (15-30 min based on risk)
 * - Missed check-ins trigger escalation ladder
 * - Emergency contacts notified at appropriate escalation levels
 * 
 * CONSTRAINTS:
 * - Every field operation logged
 * - GPS consent required before location tracking
 * - All escalations are audited
 */

import type { UserId } from '@/modules/operations/types';
import {
  fieldOpStateMachine,
  type FieldOpState,
  type FieldOpTrigger,
  type TransitionContext,
} from './infrastructure/state-machine';
import { logFieldOperation, createAuditEntry } from './infrastructure/audit-log';
import { eventBus, createServiceEvent } from './infrastructure/event-bus';

// ═══════════════════════════════════════════════════════════════════
// SAFETY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FieldOperation {
  id: string;
  volunteerId: UserId;
  state: FieldOpState;
  
  // Task info
  taskType: 'transport' | 'rescue' | 'trap' | 'search' | 'foster_pickup' | 'other';
  caseId?: string;
  description: string;
  
  // Location
  startLocation: GeoPoint;
  currentLocation?: GeoPoint;
  destinationLocation?: GeoPoint;
  locationConsentVersion: string;
  
  // Check-in settings
  checkInIntervalMinutes: number;
  lastCheckInAt?: string;
  nextCheckInDue?: string;
  missedCheckInCount: number;
  
  // Escalation
  escalationLevel: 0 | 1 | 2 | 3;
  escalatedAt?: string;
  escalationContacts: EscalationContact[];
  
  // Buddy system
  buddyUserId?: UserId;
  buddyNotifiedAt?: string;
  
  // Timeline
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedDurationMinutes?: number;
  
  // Audit
  correlationId: string;
  version: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

export interface EscalationContact {
  level: 1 | 2 | 3;
  name: string;
  phone: string;
  relationship: 'buddy' | 'coordinator' | 'emergency_contact' | 'emergency_services';
  notifiedAt?: string;
  response?: 'acknowledged' | 'no_response' | 'dispatched';
}

export interface CheckInPayload {
  location: GeoPoint;
  status: 'ok' | 'need_assistance' | 'emergency';
  notes?: string;
  batteryLevel?: number;
}

export interface SafetyConfig {
  defaultCheckInIntervalMinutes: number;
  highRiskCheckInIntervalMinutes: number;
  escalationDelayMinutes: number[];
  maxMissedCheckIns: number;
}

const DEFAULT_CONFIG: SafetyConfig = {
  defaultCheckInIntervalMinutes: 30,
  highRiskCheckInIntervalMinutes: 15,
  escalationDelayMinutes: [5, 10, 15], // L1 after 5 min, L2 after 10, L3 after 15
  maxMissedCheckIns: 3,
};

// ═══════════════════════════════════════════════════════════════════
// SAFETY SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface ISafetyService {
  // Field operation lifecycle
  startFieldOperation(params: {
    volunteerId: UserId;
    taskType: FieldOperation['taskType'];
    caseId?: string;
    description: string;
    startLocation: GeoPoint;
    destinationLocation?: GeoPoint;
    locationConsentVersion: string;
    buddyUserId?: UserId;
    estimatedDurationMinutes?: number;
    isHighRisk?: boolean;
  }): Promise<FieldOperation>;

  checkIn(opId: string, payload: CheckInPayload): Promise<FieldOperation>;
  
  completeOperation(opId: string, notes?: string): Promise<FieldOperation>;
  cancelOperation(opId: string, reason: string): Promise<FieldOperation>;
  
  // Escalation
  processOverdueCheckIns(): Promise<FieldOperation[]>;
  escalate(opId: string, actor: UserId | 'SYSTEM'): Promise<FieldOperation>;
  deEscalate(opId: string, actor: UserId | 'SYSTEM'): Promise<FieldOperation>;
  
  // Queries
  getOperation(opId: string): Promise<FieldOperation | null>;
  getActiveOperations(): Promise<FieldOperation[]>;
  getActiveOperationsByVolunteer(volunteerId: UserId): Promise<FieldOperation[]>;
  getOverdueOperations(): Promise<FieldOperation[]>;
  
  // Emergency
  triggerEmergency(opId: string, location?: GeoPoint): Promise<FieldOperation>;
}

// ═══════════════════════════════════════════════════════════════════
// SAFETY SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class SafetyServiceImpl implements ISafetyService {
  private operations: Map<string, FieldOperation> = new Map();
  private config: SafetyConfig = DEFAULT_CONFIG;

  async startFieldOperation(params: {
    volunteerId: UserId;
    taskType: FieldOperation['taskType'];
    caseId?: string;
    description: string;
    startLocation: GeoPoint;
    destinationLocation?: GeoPoint;
    locationConsentVersion: string;
    buddyUserId?: UserId;
    estimatedDurationMinutes?: number;
    isHighRisk?: boolean;
  }): Promise<FieldOperation> {
    const id = crypto.randomUUID();
    const correlationId = `safety-${Date.now()}-${id.slice(0, 8)}`;
    const now = new Date().toISOString();

    const checkInInterval = params.isHighRisk
      ? this.config.highRiskCheckInIntervalMinutes
      : this.config.defaultCheckInIntervalMinutes;

    const nextCheckInDue = new Date(Date.now() + checkInInterval * 60 * 1000).toISOString();

    const op: FieldOperation = {
      id,
      volunteerId: params.volunteerId,
      state: 'PENDING',
      taskType: params.taskType,
      caseId: params.caseId,
      description: params.description,
      startLocation: params.startLocation,
      currentLocation: params.startLocation,
      destinationLocation: params.destinationLocation,
      locationConsentVersion: params.locationConsentVersion,
      checkInIntervalMinutes: checkInInterval,
      nextCheckInDue,
      missedCheckInCount: 0,
      escalationLevel: 0,
      escalationContacts: [],
      buddyUserId: params.buddyUserId,
      startedAt: now,
      estimatedDurationMinutes: params.estimatedDurationMinutes,
      correlationId,
      version: 1,
    };

    // Transition to ACTIVE
    const result = this.transition(op, 'START', params.volunteerId);
    op.state = result.toState;

    this.operations.set(id, op);

    logFieldOperation({
      operationId: id,
      eventType: 'FIELD_OP_STARTED',
      actor: params.volunteerId,
      correlationId,
      details: {
        taskType: params.taskType,
        caseId: params.caseId,
        checkInIntervalMinutes: checkInInterval,
        hasBuddy: !!params.buddyUserId,
      },
    });

    eventBus.publish(createServiceEvent('FIELD_OP_STARTED', {
      operationId: id,
      volunteerId: params.volunteerId,
      taskType: params.taskType,
      nextCheckInDue,
    }, params.volunteerId, { correlationId }));

    return op;
  }

  async checkIn(opId: string, payload: CheckInPayload): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);
    this.assertActiveState(op);

    const now = new Date().toISOString();
    const nextCheckInDue = new Date(Date.now() + op.checkInIntervalMinutes * 60 * 1000).toISOString();

    // Handle emergency check-in
    if (payload.status === 'emergency') {
      return this.triggerEmergency(opId, payload.location);
    }

    // Handle need_assistance
    if (payload.status === 'need_assistance') {
      // Escalate to L1 but continue operation
      const escalated = await this.escalate(opId, 'SYSTEM');
      return {
        ...escalated,
        currentLocation: payload.location,
        lastCheckInAt: now,
        nextCheckInDue,
      };
    }

    // Normal check-in - reset missed count and de-escalate if needed
    let state = op.state;
    if (op.state === 'CHECK_IN_OVERDUE' || op.state.startsWith('ESCALATED')) {
      const result = this.transition(op, 'CHECK_IN', op.volunteerId);
      state = result.toState;
    }

    const updated: FieldOperation = {
      ...op,
      state,
      currentLocation: payload.location,
      lastCheckInAt: now,
      nextCheckInDue,
      missedCheckInCount: 0,
      escalationLevel: 0,
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    logFieldOperation({
      operationId: opId,
      eventType: 'FIELD_OP_CHECK_IN',
      actor: op.volunteerId,
      correlationId: op.correlationId,
      details: {
        status: payload.status,
        location: payload.location,
        notes: payload.notes,
      },
    });

    return updated;
  }

  async completeOperation(opId: string, notes?: string): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);
    const result = this.transition(op, 'COMPLETE', op.volunteerId);

    const updated: FieldOperation = {
      ...op,
      state: result.toState,
      completedAt: new Date().toISOString(),
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    logFieldOperation({
      operationId: opId,
      eventType: 'FIELD_OP_COMPLETED',
      actor: op.volunteerId,
      correlationId: op.correlationId,
      details: { notes },
    });

    eventBus.publish(createServiceEvent('FIELD_OP_COMPLETED', {
      operationId: opId,
      volunteerId: op.volunteerId,
      durationMinutes: this.calculateDuration(op.startedAt, updated.completedAt!),
    }, op.volunteerId, { correlationId: op.correlationId }));

    return updated;
  }

  async cancelOperation(opId: string, reason: string): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);
    const result = this.transition(op, 'CANCEL', op.volunteerId);

    const updated: FieldOperation = {
      ...op,
      state: result.toState,
      cancelledAt: new Date().toISOString(),
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    logFieldOperation({
      operationId: opId,
      eventType: 'FIELD_OP_COMPLETED', // Use same event type, distinguish by state
      actor: op.volunteerId,
      correlationId: op.correlationId,
      details: { reason, cancelled: true },
    });

    return updated;
  }

  async processOverdueCheckIns(): Promise<FieldOperation[]> {
    const now = Date.now();
    const escalated: FieldOperation[] = [];

    for (const op of Array.from(this.operations.values())) {
      if (this.isFinalState(op.state)) continue;
      if (!op.nextCheckInDue) continue;

      const checkInDue = new Date(op.nextCheckInDue).getTime();
      if (now > checkInDue) {
        // Mark as missed
        const updated = await this.handleMissedCheckIn(op);
        escalated.push(updated);
      }
    }

    return escalated;
  }

  private async handleMissedCheckIn(op: FieldOperation): Promise<FieldOperation> {
    const missedCount = op.missedCheckInCount + 1;
    
    let state = op.state;
    if (op.state === 'ACTIVE') {
      const result = this.transition(op, 'MISS_CHECK_IN', 'SYSTEM');
      state = result.toState;
    }

    const updated: FieldOperation = {
      ...op,
      state,
      missedCheckInCount: missedCount,
      version: op.version + 1,
    };

    this.operations.set(op.id, updated);

    logFieldOperation({
      operationId: op.id,
      eventType: 'FIELD_OP_CHECK_IN_MISSED',
      actor: 'SYSTEM',
      correlationId: op.correlationId,
      details: { missedCount },
    });

    // Auto-escalate based on missed count
    if (missedCount >= 1 && op.escalationLevel < 3) {
      return this.escalate(op.id, 'SYSTEM');
    }

    return updated;
  }

  async escalate(opId: string, actor: UserId | 'SYSTEM'): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);
    
    if (op.escalationLevel >= 3) {
      return op; // Already at max escalation
    }

    const result = this.transition(op, 'ESCALATE', actor);
    const newLevel = Math.min(op.escalationLevel + 1, 3) as 0 | 1 | 2 | 3;

    const updated: FieldOperation = {
      ...op,
      state: result.toState,
      escalationLevel: newLevel,
      escalatedAt: new Date().toISOString(),
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    logFieldOperation({
      operationId: opId,
      eventType: 'FIELD_OP_ESCALATED',
      actor,
      correlationId: op.correlationId,
      details: { 
        previousLevel: op.escalationLevel,
        newLevel,
        missedCheckIns: op.missedCheckInCount,
      },
    });

    // Notify appropriate contacts based on level
    if (newLevel >= 1) {
      await this.notifyEscalationContacts(updated, newLevel as 1 | 2 | 3);
    }

    eventBus.publish(createServiceEvent('FIELD_OP_ESCALATED', {
      operationId: opId,
      volunteerId: op.volunteerId,
      escalationLevel: newLevel,
    }, actor, { correlationId: op.correlationId }));

    return updated;
  }

  async deEscalate(opId: string, actor: UserId | 'SYSTEM'): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);
    
    if (op.escalationLevel === 0) {
      return op;
    }

    const result = this.transition(op, 'DE_ESCALATE', actor);

    const updated: FieldOperation = {
      ...op,
      state: result.toState,
      escalationLevel: 0,
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    return updated;
  }

  async getOperation(opId: string): Promise<FieldOperation | null> {
    return this.operations.get(opId) ?? null;
  }

  async getActiveOperations(): Promise<FieldOperation[]> {
    return Array.from(this.operations.values()).filter(
      op => !this.isFinalState(op.state)
    );
  }

  async getActiveOperationsByVolunteer(volunteerId: UserId): Promise<FieldOperation[]> {
    return Array.from(this.operations.values()).filter(
      op => op.volunteerId === volunteerId && !this.isFinalState(op.state)
    );
  }

  async getOverdueOperations(): Promise<FieldOperation[]> {
    const now = Date.now();
    return Array.from(this.operations.values()).filter(op => {
      if (this.isFinalState(op.state)) return false;
      if (!op.nextCheckInDue) return false;
      return now > new Date(op.nextCheckInDue).getTime();
    });
  }

  async triggerEmergency(opId: string, location?: GeoPoint): Promise<FieldOperation> {
    const op = await this.getOrThrow(opId);

    // Immediately escalate to L3
    const updated: FieldOperation = {
      ...op,
      state: 'ESCALATED_L3',
      escalationLevel: 3,
      escalatedAt: new Date().toISOString(),
      currentLocation: location ?? op.currentLocation,
      version: op.version + 1,
    };

    this.operations.set(opId, updated);

    logFieldOperation({
      operationId: opId,
      eventType: 'FIELD_OP_ESCALATED',
      actor: op.volunteerId,
      correlationId: op.correlationId,
      details: { 
        emergency: true,
        location,
        previousLevel: op.escalationLevel,
      },
    });

    // Notify all contacts immediately
    await this.notifyEscalationContacts(updated, 3);

    eventBus.publish(createServiceEvent('EMERGENCY_CONTACT_NOTIFIED', {
      operationId: opId,
      volunteerId: op.volunteerId,
      location,
    }, op.volunteerId, { correlationId: op.correlationId }));

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  private async getOrThrow(opId: string): Promise<FieldOperation> {
    const op = this.operations.get(opId);
    if (!op) {
      throw new Error(`Field operation not found: ${opId}`);
    }
    return op;
  }

  private assertActiveState(op: FieldOperation): void {
    if (this.isFinalState(op.state)) {
      throw new Error(`Operation is not active: ${op.state}`);
    }
  }

  private isFinalState(state: FieldOpState): boolean {
    return state === 'COMPLETED' || state === 'CANCELLED';
  }

  private transition(
    op: FieldOperation,
    trigger: FieldOpTrigger,
    actor: UserId | 'SYSTEM'
  ): { fromState: FieldOpState; toState: FieldOpState } {
    const context: TransitionContext = {
      actor,
      timestamp: new Date().toISOString(),
    };

    const result = fieldOpStateMachine.transition(op.state, trigger, context);
    
    if (!result.success) {
      throw new Error(result.error ?? `Invalid transition: ${op.state} -> ${trigger}`);
    }

    return { fromState: result.fromState, toState: result.toState };
  }

  private async notifyEscalationContacts(op: FieldOperation, level: 1 | 2 | 3): Promise<void> {
    // In production, this would send SMS/push notifications
    const now = new Date().toISOString();

    // L1: Notify buddy
    if (level >= 1 && op.buddyUserId) {
      console.log(`[Safety] Notifying buddy ${op.buddyUserId} for operation ${op.id}`);
      createAuditEntry({
        eventType: 'EMERGENCY_CONTACT_NOTIFIED',
        aggregateType: 'field_operation',
        aggregateId: op.id,
        actor: 'SYSTEM',
        correlationId: op.correlationId,
        details: { contactType: 'buddy', level: 1 },
        preservedForLegal: true,
      });
    }

    // L2: Notify coordinator
    if (level >= 2) {
      console.log(`[Safety] Notifying coordinator for operation ${op.id}`);
      createAuditEntry({
        eventType: 'EMERGENCY_CONTACT_NOTIFIED',
        aggregateType: 'field_operation',
        aggregateId: op.id,
        actor: 'SYSTEM',
        correlationId: op.correlationId,
        details: { contactType: 'coordinator', level: 2 },
        preservedForLegal: true,
      });
    }

    // L3: Notify emergency contact and potentially emergency services
    if (level >= 3) {
      console.log(`[Safety] EMERGENCY: Notifying emergency contact for operation ${op.id}`);
      createAuditEntry({
        eventType: 'EMERGENCY_CONTACT_NOTIFIED',
        aggregateType: 'field_operation',
        aggregateId: op.id,
        actor: 'SYSTEM',
        correlationId: op.correlationId,
        details: { contactType: 'emergency_contact', level: 3, emergency: true },
        preservedForLegal: true,
      });
    }
  }

  private calculateDuration(startedAt: string, completedAt: string): number {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    return Math.round((end - start) / 60000);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const safetyService: ISafetyService = new SafetyServiceImpl();
