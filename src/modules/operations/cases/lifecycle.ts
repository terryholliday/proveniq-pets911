/**
 * OPERATIONS MODULE - CASE LIFECYCLE
 * 
 * Case state machine and SLA management.
 */

import type { UserId, Severity, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// CASE TYPES
// ═══════════════════════════════════════════════════════════════════

export type CaseType = 
  | 'lost_pet'
  | 'found_pet'
  | 'stray'
  | 'injured'
  | 'abandoned'
  | 'surrender'
  | 'emergency'
  | 'wellness_check'
  | 'trap_request'
  | 'transport_request';

export type CaseStatus = 
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'pending_verification'
  | 'pending_pickup'
  | 'pending_transport'
  | 'in_custody'
  | 'matched'
  | 'pending_release'
  | 'resolved'
  | 'closed'
  | 'archived'
  | 'on_hold';

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export interface Case {
  id: string;
  caseNumber: string; // Human readable, e.g., "P911-2026-001234"
  type: CaseType;
  
  // Status
  status: CaseStatus;
  priority: CasePriority;
  severity: Severity;
  
  // Assignment
  assignedTo?: UserId;
  assignedAt?: string;
  assignedBy?: UserId;
  
  // Team
  teamMembers: CaseTeamMember[];
  
  // SLA
  sla: CaseSLA;
  
  // Timeline
  createdAt: string;
  createdBy: UserId;
  updatedAt: string;
  triagedAt?: string;
  triagedBy?: UserId;
  resolvedAt?: string;
  resolvedBy?: UserId;
  closedAt?: string;
  closedBy?: UserId;
  archivedAt?: string;
  
  // Resolution
  resolution?: CaseResolution;
  
  // History
  statusHistory: CaseStatusChange[];
  
  // Tags and flags
  tags: string[];
  flags: CaseFlag[];
  
  // Related entities
  relatedCaseIds: string[];
  matchedCaseId?: string;
  
  // Notes
  notes: CaseNote[];
  internalNotes: CaseNote[];
  
  audit: AuditMetadata;
}

export interface CaseTeamMember {
  userId: UserId;
  role: 'lead' | 'member' | 'observer';
  addedAt: string;
  addedBy: UserId;
  removedAt?: string;
}

export interface CaseSLA {
  // Triage
  triageDueAt: string;
  triageOverdue: boolean;
  
  // Response
  firstResponseDueAt: string;
  firstResponseAt?: string;
  firstResponseOverdue: boolean;
  
  // Resolution
  resolutionDueAt?: string;
  resolutionOverdue: boolean;
  
  // Custom SLA
  customDeadlines: {
    name: string;
    dueAt: string;
    completedAt?: string;
    overdue: boolean;
  }[];
  
  // Extensions
  extensions: {
    extendedAt: string;
    extendedBy: UserId;
    reason: string;
    newDeadline: string;
  }[];
}

export interface CaseResolution {
  type: CaseResolutionType;
  description: string;
  outcome?: string;
  resolvedBy: UserId;
  resolvedAt: string;
  notes?: string;
  verificationComplete: boolean;
}

export type CaseResolutionType = 
  | 'reunited'           // Pet returned to owner
  | 'adopted'            // Pet adopted
  | 'transferred'        // Transferred to shelter/rescue
  | 'fostered'           // In foster care
  | 'tnr_complete'       // TNR completed
  | 'owner_found'        // Owner of found pet located
  | 'duplicate'          // Duplicate case
  | 'no_response'        // Owner/reporter stopped responding
  | 'unable_to_locate'   // Animal not found
  | 'deceased'           // Animal deceased
  | 'withdrawn'          // Reporter withdrew case
  | 'other';

export interface CaseStatusChange {
  id: string;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  changedAt: string;
  changedBy: UserId;
  reason?: string;
  automated: boolean;
}

export interface CaseFlag {
  type: CaseFlagType;
  setAt: string;
  setBy: UserId;
  reason?: string;
  clearedAt?: string;
  clearedBy?: UserId;
}

export type CaseFlagType = 
  | 'urgent'
  | 'vip'
  | 'media_attention'
  | 'legal_hold'
  | 'fraud_suspected'
  | 'owner_verification_required'
  | 'special_needs'
  | 'aggressive_animal'
  | 'deceased'
  | 'duplicate_suspected';

export interface CaseNote {
  id: string;
  authorId: UserId;
  content: string;
  createdAt: string;
  updatedAt?: string;
  type: 'general' | 'update' | 'communication' | 'verification' | 'internal';
  visibility: 'public' | 'team' | 'moderators' | 'admin';
  attachments?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// SLA CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface SLAConfig {
  caseType: CaseType;
  priority: CasePriority;
  triageMinutes: number;
  firstResponseMinutes: number;
  resolutionDays?: number;
}

export const SLA_CONFIGS: SLAConfig[] = [
  // Critical priority
  { caseType: 'emergency', priority: 'critical', triageMinutes: 5, firstResponseMinutes: 15, resolutionDays: 1 },
  { caseType: 'injured', priority: 'critical', triageMinutes: 10, firstResponseMinutes: 30, resolutionDays: 1 },
  
  // Urgent priority
  { caseType: 'lost_pet', priority: 'urgent', triageMinutes: 30, firstResponseMinutes: 60, resolutionDays: 7 },
  { caseType: 'found_pet', priority: 'urgent', triageMinutes: 30, firstResponseMinutes: 60, resolutionDays: 14 },
  
  // High priority
  { caseType: 'lost_pet', priority: 'high', triageMinutes: 60, firstResponseMinutes: 120, resolutionDays: 14 },
  { caseType: 'found_pet', priority: 'high', triageMinutes: 60, firstResponseMinutes: 120, resolutionDays: 21 },
  { caseType: 'stray', priority: 'high', triageMinutes: 60, firstResponseMinutes: 180, resolutionDays: 30 },
  
  // Normal priority
  { caseType: 'lost_pet', priority: 'normal', triageMinutes: 120, firstResponseMinutes: 240, resolutionDays: 30 },
  { caseType: 'found_pet', priority: 'normal', triageMinutes: 120, firstResponseMinutes: 240, resolutionDays: 60 },
  { caseType: 'trap_request', priority: 'normal', triageMinutes: 240, firstResponseMinutes: 480, resolutionDays: 30 },
  { caseType: 'transport_request', priority: 'normal', triageMinutes: 120, firstResponseMinutes: 240, resolutionDays: 7 },
  
  // Low priority
  { caseType: 'wellness_check', priority: 'low', triageMinutes: 480, firstResponseMinutes: 1440, resolutionDays: 14 },
];

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

export interface StateTransition {
  from: CaseStatus;
  to: CaseStatus;
  allowedRoles: string[];
  requiresReason: boolean;
  automated: boolean;
  validations?: string[];
}

export const CASE_STATE_TRANSITIONS: StateTransition[] = [
  // From new
  { from: 'new', to: 'triaged', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'new', to: 'on_hold', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  { from: 'new', to: 'closed', allowedRoles: ['lead_moderator'], requiresReason: true, automated: false },
  
  // From triaged
  { from: 'triaged', to: 'assigned', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'triaged', to: 'on_hold', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  
  // From assigned
  { from: 'assigned', to: 'in_progress', allowedRoles: ['volunteer', 'moderator'], requiresReason: false, automated: false },
  { from: 'assigned', to: 'triaged', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  
  // From in_progress
  { from: 'in_progress', to: 'pending_verification', allowedRoles: ['volunteer', 'moderator'], requiresReason: false, automated: false },
  { from: 'in_progress', to: 'pending_pickup', allowedRoles: ['volunteer', 'moderator'], requiresReason: false, automated: false },
  { from: 'in_progress', to: 'matched', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'in_progress', to: 'on_hold', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  
  // From matched
  { from: 'matched', to: 'pending_verification', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'matched', to: 'pending_release', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'matched', to: 'in_progress', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  
  // From pending_verification
  { from: 'pending_verification', to: 'pending_release', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'pending_verification', to: 'in_progress', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  
  // From pending_release
  { from: 'pending_release', to: 'resolved', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'pending_release', to: 'pending_verification', allowedRoles: ['lead_moderator'], requiresReason: true, automated: false },
  
  // From in_custody
  { from: 'in_custody', to: 'pending_transport', allowedRoles: ['volunteer', 'moderator'], requiresReason: false, automated: false },
  { from: 'in_custody', to: 'matched', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  { from: 'in_custody', to: 'resolved', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: false },
  
  // From resolved
  { from: 'resolved', to: 'closed', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: false, automated: true },
  { from: 'resolved', to: 'in_progress', allowedRoles: ['lead_moderator'], requiresReason: true, automated: false },
  
  // From closed
  { from: 'closed', to: 'archived', allowedRoles: ['system'], requiresReason: false, automated: true },
  { from: 'closed', to: 'in_progress', allowedRoles: ['lead_moderator', 'regional_coordinator'], requiresReason: true, automated: false },
  
  // From on_hold
  { from: 'on_hold', to: 'triaged', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  { from: 'on_hold', to: 'in_progress', allowedRoles: ['moderator', 'lead_moderator'], requiresReason: true, automated: false },
  { from: 'on_hold', to: 'closed', allowedRoles: ['lead_moderator'], requiresReason: true, automated: false },
];

// ═══════════════════════════════════════════════════════════════════
// CASE MANAGER
// ═══════════════════════════════════════════════════════════════════

export class CaseLifecycleManager {
  /**
   * Create new case
   */
  createCase(params: {
    type: CaseType;
    priority: CasePriority;
    severity: Severity;
    createdBy: UserId;
    tags?: string[];
  }): Case {
    const now = new Date().toISOString();
    const caseNumber = this.generateCaseNumber();
    
    // Get SLA config
    const slaConfig = this.getSLAConfig(params.type, params.priority);
    const sla = this.createSLA(slaConfig, now);
    
    return {
      id: crypto.randomUUID(),
      caseNumber,
      type: params.type,
      status: 'new',
      priority: params.priority,
      severity: params.severity,
      teamMembers: [],
      sla,
      createdAt: now,
      createdBy: params.createdBy,
      updatedAt: now,
      statusHistory: [
        {
          id: crypto.randomUUID(),
          fromStatus: 'new',
          toStatus: 'new',
          changedAt: now,
          changedBy: params.createdBy,
          automated: true,
        },
      ],
      tags: params.tags ?? [],
      flags: [],
      relatedCaseIds: [],
      notes: [],
      internalNotes: [],
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Transition case status
   */
  transitionStatus(
    caseData: Case,
    newStatus: CaseStatus,
    changedBy: UserId,
    userRole: string,
    reason?: string
  ): Case {
    // Validate transition
    const validation = this.validateTransition(caseData.status, newStatus, userRole);
    if (!validation.valid) {
      throw new Error(`Invalid transition: ${validation.error}`);
    }
    
    const transition = validation.transition!;
    if (transition.requiresReason && !reason) {
      throw new Error('Reason required for this transition');
    }
    
    const now = new Date().toISOString();
    
    const statusChange: CaseStatusChange = {
      id: crypto.randomUUID(),
      fromStatus: caseData.status,
      toStatus: newStatus,
      changedAt: now,
      changedBy,
      reason,
      automated: false,
    };
    
    const updatedCase: Case = {
      ...caseData,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...caseData.statusHistory, statusChange],
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
    
    // Update specific timestamps
    if (newStatus === 'triaged' && !caseData.triagedAt) {
      updatedCase.triagedAt = now;
      updatedCase.triagedBy = changedBy;
    }
    
    if (newStatus === 'resolved' && !caseData.resolvedAt) {
      updatedCase.resolvedAt = now;
      updatedCase.resolvedBy = changedBy;
    }
    
    if (newStatus === 'closed' && !caseData.closedAt) {
      updatedCase.closedAt = now;
      updatedCase.closedBy = changedBy;
    }
    
    if (newStatus === 'archived' && !caseData.archivedAt) {
      updatedCase.archivedAt = now;
    }
    
    return updatedCase;
  }
  
  /**
   * Assign case
   */
  assignCase(
    caseData: Case,
    assigneeId: UserId,
    assignedBy: UserId
  ): Case {
    const now = new Date().toISOString();
    
    return {
      ...caseData,
      assignedTo: assigneeId,
      assignedAt: now,
      assignedBy,
      updatedAt: now,
      sla: {
        ...caseData.sla,
        firstResponseAt: caseData.sla.firstResponseAt ?? now,
      },
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
  }
  
  /**
   * Add team member
   */
  addTeamMember(
    caseData: Case,
    userId: UserId,
    role: CaseTeamMember['role'],
    addedBy: UserId
  ): Case {
    const now = new Date().toISOString();
    
    const newMember: CaseTeamMember = {
      userId,
      role,
      addedAt: now,
      addedBy,
    };
    
    return {
      ...caseData,
      teamMembers: [...caseData.teamMembers, newMember],
      updatedAt: now,
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
  }
  
  /**
   * Add note
   */
  addNote(
    caseData: Case,
    authorId: UserId,
    content: string,
    type: CaseNote['type'] = 'general',
    visibility: CaseNote['visibility'] = 'team',
    attachments?: string[]
  ): Case {
    const now = new Date().toISOString();
    
    const note: CaseNote = {
      id: crypto.randomUUID(),
      authorId,
      content,
      createdAt: now,
      type,
      visibility,
      attachments,
    };
    
    const isInternal = visibility === 'admin' || type === 'internal';
    
    return {
      ...caseData,
      notes: isInternal ? caseData.notes : [...caseData.notes, note],
      internalNotes: isInternal ? [...caseData.internalNotes, note] : caseData.internalNotes,
      updatedAt: now,
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
  }
  
  /**
   * Set flag
   */
  setFlag(
    caseData: Case,
    flagType: CaseFlagType,
    setBy: UserId,
    reason?: string
  ): Case {
    const now = new Date().toISOString();
    
    // Remove existing flag of same type
    const existingFlags = caseData.flags.filter(f => f.type !== flagType);
    
    const newFlag: CaseFlag = {
      type: flagType,
      setAt: now,
      setBy,
      reason,
    };
    
    return {
      ...caseData,
      flags: [...existingFlags, newFlag],
      updatedAt: now,
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
  }
  
  /**
   * Resolve case
   */
  resolveCase(
    caseData: Case,
    resolution: Omit<CaseResolution, 'resolvedAt'>,
    resolvedBy: UserId
  ): Case {
    const now = new Date().toISOString();
    
    return {
      ...caseData,
      status: 'resolved',
      resolution: {
        ...resolution,
        resolvedAt: now,
      },
      resolvedAt: now,
      resolvedBy,
      updatedAt: now,
      statusHistory: [
        ...caseData.statusHistory,
        {
          id: crypto.randomUUID(),
          fromStatus: caseData.status,
          toStatus: 'resolved',
          changedAt: now,
          changedBy: resolvedBy,
          automated: false,
        },
      ],
      audit: {
        ...caseData.audit,
        updatedAt: now,
        version: caseData.audit.version + 1,
      },
    };
  }
  
  /**
   * Check SLA status
   */
  checkSLAStatus(caseData: Case): {
    triageOverdue: boolean;
    firstResponseOverdue: boolean;
    resolutionOverdue: boolean;
    nextDeadline?: { type: string; dueAt: string };
  } {
    const now = new Date();
    
    const triageOverdue = !caseData.triagedAt && new Date(caseData.sla.triageDueAt) <= now;
    const firstResponseOverdue = !caseData.sla.firstResponseAt && new Date(caseData.sla.firstResponseDueAt) <= now;
    const resolutionOverdue = caseData.sla.resolutionDueAt && 
                              !caseData.resolvedAt && 
                              new Date(caseData.sla.resolutionDueAt) <= now;
    
    // Find next deadline
    const deadlines = [
      { type: 'triage', dueAt: caseData.sla.triageDueAt, completed: !!caseData.triagedAt },
      { type: 'first_response', dueAt: caseData.sla.firstResponseDueAt, completed: !!caseData.sla.firstResponseAt },
      { type: 'resolution', dueAt: caseData.sla.resolutionDueAt, completed: !!caseData.resolvedAt },
    ].filter(d => d.dueAt && !d.completed);
    
    const nextDeadline = deadlines.sort((a, b) => 
      new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
    )[0];
    
    return {
      triageOverdue,
      firstResponseOverdue,
      resolutionOverdue: !!resolutionOverdue,
      nextDeadline: nextDeadline ? { type: nextDeadline.type, dueAt: nextDeadline.dueAt! } : undefined,
    };
  }
  
  /**
   * Validate status transition
   */
  validateTransition(
    fromStatus: CaseStatus,
    toStatus: CaseStatus,
    userRole: string
  ): { valid: boolean; error?: string; transition?: StateTransition } {
    const transition = CASE_STATE_TRANSITIONS.find(t => 
      t.from === fromStatus && t.to === toStatus
    );
    
    if (!transition) {
      return { valid: false, error: `No transition from ${fromStatus} to ${toStatus}` };
    }
    
    if (!transition.allowedRoles.includes(userRole) && !transition.allowedRoles.includes('system')) {
      return { valid: false, error: `Role ${userRole} cannot perform this transition` };
    }
    
    return { valid: true, transition };
  }
  
  /**
   * Get possible transitions
   */
  getPossibleTransitions(status: CaseStatus, userRole: string): StateTransition[] {
    return CASE_STATE_TRANSITIONS.filter(t => 
      t.from === status && 
      (t.allowedRoles.includes(userRole) || t.automated)
    );
  }
  
  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `P911-${year}-${random}`;
  }
  
  private getSLAConfig(caseType: CaseType, priority: CasePriority): SLAConfig {
    const config = SLA_CONFIGS.find(c => c.caseType === caseType && c.priority === priority);
    
    if (!config) {
      // Return default SLA
      return {
        caseType,
        priority,
        triageMinutes: 120,
        firstResponseMinutes: 240,
        resolutionDays: 30,
      };
    }
    
    return config;
  }
  
  private createSLA(config: SLAConfig, createdAt: string): CaseSLA {
    const created = new Date(createdAt);
    
    const triageDue = new Date(created.getTime() + config.triageMinutes * 60 * 1000);
    const responseDue = new Date(created.getTime() + config.firstResponseMinutes * 60 * 1000);
    const resolutionDue = config.resolutionDays
      ? new Date(created.getTime() + config.resolutionDays * 24 * 60 * 60 * 1000)
      : undefined;
    
    return {
      triageDueAt: triageDue.toISOString(),
      triageOverdue: false,
      firstResponseDueAt: responseDue.toISOString(),
      firstResponseOverdue: false,
      resolutionDueAt: resolutionDue?.toISOString(),
      resolutionOverdue: false,
      customDeadlines: [],
      extensions: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const caseLifecycleManager = new CaseLifecycleManager();

export function isCaseOpen(caseData: Case): boolean {
  return !['resolved', 'closed', 'archived'].includes(caseData.status);
}

export function isCaseResolved(caseData: Case): boolean {
  return ['resolved', 'closed', 'archived'].includes(caseData.status);
}

export function getCaseDuration(caseData: Case): number {
  const start = new Date(caseData.createdAt).getTime();
  const end = caseData.resolvedAt 
    ? new Date(caseData.resolvedAt).getTime() 
    : Date.now();
  
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)); // days
}

export function getCaseAge(caseData: Case): number {
  const start = new Date(caseData.createdAt).getTime();
  return Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)); // days
}

export function hasFlag(caseData: Case, flagType: CaseFlagType): boolean {
  return caseData.flags.some(f => f.type === flagType && !f.clearedAt);
}

export function getActiveFlags(caseData: Case): CaseFlag[] {
  return caseData.flags.filter(f => !f.clearedAt);
}

export function isAssigned(caseData: Case): boolean {
  return !!caseData.assignedTo;
}

export function getTeamLead(caseData: Case): CaseTeamMember | undefined {
  return caseData.teamMembers.find(m => m.role === 'lead' && !m.removedAt);
}

export function getActiveTeamMembers(caseData: Case): CaseTeamMember[] {
  return caseData.teamMembers.filter(m => !m.removedAt);
}
