/**
 * OPERATIONS MODULE - CASE HANDOFF
 * 
 * Shift handoff protocols for case continuity.
 */

import type { UserId, AuditMetadata } from '../types';
import type { Case, CaseStatus } from './lifecycle';

// ═══════════════════════════════════════════════════════════════════
// HANDOFF TYPES
// ═══════════════════════════════════════════════════════════════════

export type HandoffStatus = 
  | 'initiated'
  | 'pending_acknowledgement'
  | 'acknowledged'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type HandoffType = 
  | 'shift_change'
  | 'vacation'
  | 'medical'
  | 'reassignment'
  | 'escalation'
  | 'emergency';

export interface CaseHandoff {
  id: string;
  caseId: string;
  caseNumber: string;
  
  // Type
  type: HandoffType;
  
  // Parties
  fromUserId: UserId;
  fromUserName: string;
  toUserId: UserId;
  toUserName: string;
  
  // Status
  status: HandoffStatus;
  
  // Timing
  initiatedAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  expiresAt: string;
  
  // Briefing
  briefing: HandoffBriefing;
  
  // Response
  response?: HandoffResponse;
  
  // Supervisor oversight
  supervisorId?: UserId;
  supervisorApproval?: {
    required: boolean;
    approvedAt?: string;
    approvedBy?: UserId;
    rejectedAt?: string;
    rejectedBy?: UserId;
    rejectionReason?: string;
  };
  
  audit: AuditMetadata;
}

export interface HandoffBriefing {
  // Case summary
  caseSummary: string;
  currentStatus: CaseStatus;
  priority: string;
  
  // Current state
  pendingActions: string[];
  blockers: string[];
  
  // Important context
  keyContacts: {
    role: string;
    name: string;
    notes?: string;
  }[];
  
  // History summary
  recentActivity: string;
  importantNotes: string[];
  
  // Warnings
  warnings: string[];
  urgentItems: string[];
  
  // Next steps
  recommendedNextSteps: string[];
  
  // Attachments
  attachments?: string[];
}

export interface HandoffResponse {
  acknowledged: boolean;
  acknowledgedAt: string;
  questions?: string[];
  clarificationNeeded?: string[];
  accepted: boolean;
  acceptanceNotes?: string;
  rejectionReason?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SHIFT HANDOFF
// ═══════════════════════════════════════════════════════════════════

export interface ShiftHandoff {
  id: string;
  
  // Shift details
  shiftId: string;
  shiftEndTime: string;
  regionId?: string;
  
  // Parties
  outgoingUserId: UserId;
  outgoingUserName: string;
  incomingUserId?: UserId;
  incomingUserName?: string;
  
  // Cases
  caseHandoffs: CaseHandoff[];
  totalCases: number;
  acknowledgedCases: number;
  
  // Status
  status: 'in_progress' | 'pending_acknowledgement' | 'completed' | 'escalated' | 'expired';
  
  // Timing
  initiatedAt: string;
  completedAt?: string;
  expiresAt: string;
  
  // Escalation
  escalatedTo?: UserId;
  escalatedAt?: string;
  escalationReason?: string;
  
  // Summary
  overallBriefing?: string;
  shiftNotes?: string;
  
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// HANDOFF POLICY
// ═══════════════════════════════════════════════════════════════════

export const HANDOFF_POLICY = {
  // Timing
  initiateBeforeShiftEndMinutes: 15,
  acknowledgeTimeoutMinutes: 30,
  expirationMinutes: 60,
  
  // Requirements
  requiresBriefing: true,
  minimumBriefingLength: 50,
  requiresSupervisorApproval: false,
  
  // Escalation
  autoEscalateOnTimeout: true,
  escalateToRoles: ['lead_moderator', 'regional_coordinator'],
  
  // Notifications
  sendReminderAtMinutes: [30, 15, 5],
  notifyOnAcknowledgement: true,
  notifyOnCompletion: true,
};

// ═══════════════════════════════════════════════════════════════════
// HANDOFF MANAGER
// ═══════════════════════════════════════════════════════════════════

export class HandoffManager {
  /**
   * Initiate case handoff
   */
  initiateCaseHandoff(params: {
    caseData: Case;
    type: HandoffType;
    fromUserId: UserId;
    fromUserName: string;
    toUserId: UserId;
    toUserName: string;
    briefing: HandoffBriefing;
    supervisorId?: UserId;
    requiresSupervisorApproval?: boolean;
  }): CaseHandoff {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + HANDOFF_POLICY.expirationMinutes * 60 * 1000);
    
    return {
      id: crypto.randomUUID(),
      caseId: params.caseData.id,
      caseNumber: params.caseData.caseNumber,
      type: params.type,
      fromUserId: params.fromUserId,
      fromUserName: params.fromUserName,
      toUserId: params.toUserId,
      toUserName: params.toUserName,
      status: 'initiated',
      initiatedAt: now,
      expiresAt: expiresAt.toISOString(),
      briefing: params.briefing,
      supervisorId: params.supervisorId,
      supervisorApproval: params.requiresSupervisorApproval
        ? { required: true }
        : undefined,
      audit: {
        createdAt: now,
        createdBy: params.fromUserId,
        version: 1,
      },
    };
  }
  
  /**
   * Acknowledge handoff
   */
  acknowledgeHandoff(
    handoff: CaseHandoff,
    acknowledgedBy: UserId,
    questions?: string[],
    clarificationNeeded?: string[]
  ): CaseHandoff {
    const now = new Date().toISOString();
    
    return {
      ...handoff,
      status: 'pending_acknowledgement',
      acknowledgedAt: now,
      response: {
        acknowledged: true,
        acknowledgedAt: now,
        questions,
        clarificationNeeded,
        accepted: false,
      },
      audit: {
        ...handoff.audit,
        updatedAt: now,
        version: handoff.audit.version + 1,
      },
    };
  }
  
  /**
   * Accept handoff
   */
  acceptHandoff(
    handoff: CaseHandoff,
    acceptedBy: UserId,
    notes?: string
  ): CaseHandoff {
    const now = new Date().toISOString();
    
    return {
      ...handoff,
      status: 'completed',
      completedAt: now,
      response: {
        ...handoff.response!,
        accepted: true,
        acceptanceNotes: notes,
      },
      audit: {
        ...handoff.audit,
        updatedAt: now,
        version: handoff.audit.version + 1,
      },
    };
  }
  
  /**
   * Reject handoff
   */
  rejectHandoff(
    handoff: CaseHandoff,
    rejectedBy: UserId,
    reason: string
  ): CaseHandoff {
    const now = new Date().toISOString();
    
    return {
      ...handoff,
      status: 'rejected',
      response: {
        ...handoff.response,
        acknowledged: true,
        acknowledgedAt: now,
        accepted: false,
        rejectionReason: reason,
      },
      audit: {
        ...handoff.audit,
        updatedAt: now,
        version: handoff.audit.version + 1,
      },
    };
  }
  
  /**
   * Create shift handoff
   */
  createShiftHandoff(params: {
    shiftId: string;
    shiftEndTime: string;
    outgoingUserId: UserId;
    outgoingUserName: string;
    incomingUserId?: UserId;
    incomingUserName?: string;
    regionId?: string;
    cases: Case[];
  }): ShiftHandoff {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + HANDOFF_POLICY.expirationMinutes * 60 * 1000);
    
    // Create handoffs for each case
    const caseHandoffs: CaseHandoff[] = params.cases.map(caseData => 
      this.initiateCaseHandoff({
        caseData,
        type: 'shift_change',
        fromUserId: params.outgoingUserId,
        fromUserName: params.outgoingUserName,
        toUserId: params.incomingUserId ?? '' as UserId,
        toUserName: params.incomingUserName ?? 'Unassigned',
        briefing: this.generateBriefing(caseData),
      })
    );
    
    return {
      id: crypto.randomUUID(),
      shiftId: params.shiftId,
      shiftEndTime: params.shiftEndTime,
      regionId: params.regionId,
      outgoingUserId: params.outgoingUserId,
      outgoingUserName: params.outgoingUserName,
      incomingUserId: params.incomingUserId,
      incomingUserName: params.incomingUserName,
      caseHandoffs,
      totalCases: caseHandoffs.length,
      acknowledgedCases: 0,
      status: 'in_progress',
      initiatedAt: now,
      expiresAt: expiresAt.toISOString(),
      audit: {
        createdAt: now,
        createdBy: params.outgoingUserId,
        version: 1,
      },
    };
  }
  
  /**
   * Generate briefing from case
   */
  generateBriefing(caseData: Case): HandoffBriefing {
    const recentNotes = caseData.notes
      .slice(-3)
      .map(n => `${n.createdAt}: ${n.content}`)
      .join('\n');
    
    const warnings: string[] = [];
    const urgentItems: string[] = [];
    
    // Check for flags
    if (caseData.flags.some(f => f.type === 'urgent' && !f.clearedAt)) {
      urgentItems.push('Case is flagged as urgent');
    }
    if (caseData.flags.some(f => f.type === 'aggressive_animal' && !f.clearedAt)) {
      warnings.push('Animal may be aggressive - use caution');
    }
    if (caseData.flags.some(f => f.type === 'fraud_suspected' && !f.clearedAt)) {
      warnings.push('Fraud suspected - verify all claims carefully');
    }
    
    return {
      caseSummary: `Case ${caseData.caseNumber} - ${caseData.type}`,
      currentStatus: caseData.status,
      priority: caseData.priority,
      pendingActions: [],
      blockers: [],
      keyContacts: [],
      recentActivity: recentNotes || 'No recent activity',
      importantNotes: caseData.notes.slice(-5).map(n => n.content),
      warnings,
      urgentItems,
      recommendedNextSteps: [],
    };
  }
  
  /**
   * Check if handoff is expired
   */
  isExpired(handoff: CaseHandoff): boolean {
    return new Date(handoff.expiresAt) <= new Date();
  }
  
  /**
   * Check shift handoff completion
   */
  checkShiftHandoffStatus(shiftHandoff: ShiftHandoff): {
    complete: boolean;
    acknowledgedCount: number;
    pendingCount: number;
    expiredCount: number;
  } {
    const acknowledged = shiftHandoff.caseHandoffs.filter(h => 
      h.status === 'completed' || h.status === 'acknowledged'
    ).length;
    
    const pending = shiftHandoff.caseHandoffs.filter(h => 
      h.status === 'initiated' || h.status === 'pending_acknowledgement'
    ).length;
    
    const expired = shiftHandoff.caseHandoffs.filter(h => 
      h.status === 'expired'
    ).length;
    
    return {
      complete: acknowledged === shiftHandoff.totalCases,
      acknowledgedCount: acknowledged,
      pendingCount: pending,
      expiredCount: expired,
    };
  }
  
  /**
   * Validate briefing
   */
  validateBriefing(briefing: HandoffBriefing): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!briefing.caseSummary || briefing.caseSummary.length < 10) {
      errors.push('Case summary is required and must be at least 10 characters');
    }
    
    if (briefing.caseSummary && briefing.caseSummary.length < HANDOFF_POLICY.minimumBriefingLength) {
      warnings.push(`Briefing is short (${briefing.caseSummary.length} chars) - consider adding more detail`);
    }
    
    if (briefing.urgentItems.length > 0 && briefing.recommendedNextSteps.length === 0) {
      warnings.push('Urgent items present but no recommended next steps provided');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const handoffManager = new HandoffManager();

export function createHandoffBriefing(
  caseSummary: string,
  currentStatus: CaseStatus,
  priority: string
): HandoffBriefing {
  return {
    caseSummary,
    currentStatus,
    priority,
    pendingActions: [],
    blockers: [],
    keyContacts: [],
    recentActivity: '',
    importantNotes: [],
    warnings: [],
    urgentItems: [],
    recommendedNextSteps: [],
  };
}

export function isHandoffPending(handoff: CaseHandoff): boolean {
  return ['initiated', 'pending_acknowledgement'].includes(handoff.status);
}

export function isHandoffComplete(handoff: CaseHandoff): boolean {
  return handoff.status === 'completed';
}

export function needsHandoffEscalation(shiftHandoff: ShiftHandoff): boolean {
  // Escalate if expired and not complete
  if (new Date(shiftHandoff.expiresAt) <= new Date()) {
    const status = handoffManager.checkShiftHandoffStatus(shiftHandoff);
    return !status.complete;
  }
  return false;
}

export function getHandoffDuration(handoff: CaseHandoff): number {
  if (!handoff.completedAt) return 0;
  
  const start = new Date(handoff.initiatedAt).getTime();
  const end = new Date(handoff.completedAt).getTime();
  
  return Math.floor((end - start) / (1000 * 60)); // minutes
}

export function getUnacknowledgedHandoffs(shiftHandoff: ShiftHandoff): CaseHandoff[] {
  return shiftHandoff.caseHandoffs.filter(h => 
    h.status === 'initiated' || h.status === 'pending_acknowledgement'
  );
}

export function escalateShiftHandoff(
  shiftHandoff: ShiftHandoff,
  escalateTo: UserId,
  reason: string
): ShiftHandoff {
  const now = new Date().toISOString();
  
  return {
    ...shiftHandoff,
    status: 'escalated',
    escalatedTo: escalateTo,
    escalatedAt: now,
    escalationReason: reason,
    audit: {
      ...shiftHandoff.audit,
      updatedAt: now,
      version: shiftHandoff.audit.version + 1,
    },
  };
}
