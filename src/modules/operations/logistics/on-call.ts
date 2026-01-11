/**
 * OPERATIONS MODULE - ON-CALL SYSTEM
 * 
 * On-call rotation and escalation management.
 */

import type { UserId, ContactMethod, DayOfWeek, AuditMetadata } from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// ON-CALL TYPES
// ═══════════════════════════════════════════════════════════════════

export interface OnCallSchedule {
  id: string;
  regionId: string;
  roleId: RoleId;
  name: string;
  description?: string;
  timezone: string;
  
  // Coverage window
  coverageWindow: {
    startTimeLocal: string; // "22:00"
    endTimeLocal: string;   // "07:00"
    daysOfWeek: DayOfWeek[];
    isOvernight: boolean;
  };
  
  // Rotations
  rotations: OnCallRotation[];
  currentRotation?: OnCallRotation;
  
  // Settings
  settings: OnCallSettings;
  
  // Status
  isActive: boolean;
  activatedAt?: string;
  deactivatedAt?: string;
  
  audit: AuditMetadata;
}

export interface OnCallRotation {
  id: string;
  scheduleId: string;
  weekStarting: string; // ISO date of Monday
  weekEnding: string;
  
  // Assignments
  primary: OnCallAssignment;
  backup: OnCallAssignment;
  tertiary?: OnCallAssignment;
  
  // Status
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  
  // Coverage gaps
  coverageGaps: {
    start: string;
    end: string;
    reason: string;
    filled: boolean;
    filledBy?: UserId;
  }[];
  
  audit: AuditMetadata;
}

export interface OnCallAssignment {
  userId: UserId;
  userName: string;
  contactMethods: ContactMethodPreference[];
  
  // Acknowledgement
  acknowledgedSchedule: boolean;
  acknowledgedAt?: string;
  
  // Swap requests
  swapRequested: boolean;
  swapRequestedAt?: string;
  swapReason?: string;
  swapApproved?: boolean;
  swapApprovedBy?: UserId;
  swapWith?: UserId;
  
  // Overrides
  overrideActive: boolean;
  overrideBy?: UserId;
  overrideReason?: string;
  overrideStart?: string;
  overrideEnd?: string;
}

export interface ContactMethodPreference {
  method: ContactMethod;
  value: string; // phone number, email, etc.
  priority: number; // 1 = first to try
  enabled: boolean;
}

export interface OnCallSettings {
  // Response times
  primaryResponseMinutes: number;
  backupResponseMinutes: number;
  tertiaryResponseMinutes: number;
  
  // Escalation
  autoEscalateOnNoResponse: boolean;
  escalationDelayMinutes: number;
  maxEscalationAttempts: number;
  
  // Notifications
  reminderHoursBeforeShift: number;
  sendShiftStartNotification: boolean;
  sendShiftEndNotification: boolean;
  
  // Constraints
  maxConsecutiveOnCallDays: number;
  minDaysBetweenOnCallWeeks: number;
  requiresAcknowledgement: boolean;
  acknowledgementDeadlineHours: number;
}

// ═══════════════════════════════════════════════════════════════════
// ESCALATION
// ═══════════════════════════════════════════════════════════════════

export interface OnCallEscalation {
  id: string;
  scheduleId: string;
  rotationId: string;
  
  // Trigger
  triggeredAt: string;
  triggeredBy: UserId;
  triggerReason: string;
  severity: 'urgent' | 'critical';
  
  // Related entities
  caseId?: string;
  incidentId?: string;
  dispatchId?: string;
  
  // Escalation attempts
  attempts: OnCallAttempt[];
  currentAttemptIndex: number;
  
  // Resolution
  status: 'escalating' | 'acknowledged' | 'resolved' | 'failed' | 'cancelled';
  acknowledgedBy?: UserId;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  
  // Failure handling
  escalatedToNextTier: boolean;
  failureReason?: string;
  manualOverrideRequired: boolean;
  
  // Timeout
  timeoutAt: string;
  
  audit: AuditMetadata;
}

export interface OnCallAttempt {
  id: string;
  escalationId: string;
  attemptNumber: number;
  
  // Target
  userId: UserId;
  userName: string;
  role: 'primary' | 'backup' | 'tertiary' | 'override' | 'manual';
  
  // Contact attempt
  contactMethod: ContactMethod;
  contactValue: string;
  attemptedAt: string;
  responseDeadline: string;
  
  // Response
  response?: 'acknowledged' | 'declined' | 'no_response' | 'failed';
  respondedAt?: string;
  declineReason?: string;
  failureReason?: string;
  
  // Notes
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// ON-CALL POLICY
// ═══════════════════════════════════════════════════════════════════

export const ON_CALL_POLICY = {
  // Response windows
  primaryResponseWindowMinutes: 5,
  backupResponseWindowMinutes: 10,
  tertiaryResponseWindowMinutes: 15,
  
  // Scheduling constraints
  maxConsecutiveOnCallDays: 3,
  minDaysBetweenOnCallWeeks: 2,
  maxOnCallHoursPerMonth: 120,
  
  // Acknowledgement
  requiresAcknowledgement: true,
  acknowledgementDeadlineHours: 48,
  
  // Reminders
  reminderHoursBeforeShift: [24, 2],
  
  // Escalation
  escalationTimeoutMinutes: 30,
  maxEscalationAttempts: 3,
  
  // Contact methods
  defaultContactOrder: ['push', 'sms', 'phone', 'email'] as ContactMethod[],
};

// ═══════════════════════════════════════════════════════════════════
// ON-CALL MANAGER
// ═══════════════════════════════════════════════════════════════════

export class OnCallManager {
  /**
   * Create on-call schedule
   */
  createSchedule(params: {
    regionId: string;
    roleId: RoleId;
    name: string;
    timezone: string;
    coverageWindow: OnCallSchedule['coverageWindow'];
    settings?: Partial<OnCallSettings>;
    createdBy: UserId;
  }): OnCallSchedule {
    const now = new Date().toISOString();
    
    const defaultSettings: OnCallSettings = {
      primaryResponseMinutes: ON_CALL_POLICY.primaryResponseWindowMinutes,
      backupResponseMinutes: ON_CALL_POLICY.backupResponseWindowMinutes,
      tertiaryResponseMinutes: ON_CALL_POLICY.tertiaryResponseWindowMinutes,
      autoEscalateOnNoResponse: true,
      escalationDelayMinutes: 5,
      maxEscalationAttempts: ON_CALL_POLICY.maxEscalationAttempts,
      reminderHoursBeforeShift: 24,
      sendShiftStartNotification: true,
      sendShiftEndNotification: true,
      maxConsecutiveOnCallDays: ON_CALL_POLICY.maxConsecutiveOnCallDays,
      minDaysBetweenOnCallWeeks: ON_CALL_POLICY.minDaysBetweenOnCallWeeks,
      requiresAcknowledgement: ON_CALL_POLICY.requiresAcknowledgement,
      acknowledgementDeadlineHours: ON_CALL_POLICY.acknowledgementDeadlineHours,
    };
    
    return {
      id: crypto.randomUUID(),
      regionId: params.regionId,
      roleId: params.roleId,
      name: params.name,
      timezone: params.timezone,
      coverageWindow: params.coverageWindow,
      rotations: [],
      settings: { ...defaultSettings, ...params.settings },
      isActive: true,
      activatedAt: now,
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Create rotation for a week
   */
  createRotation(
    schedule: OnCallSchedule,
    weekStarting: string,
    primary: Omit<OnCallAssignment, 'acknowledgedSchedule' | 'acknowledgedAt' | 'swapRequested' | 'swapRequestedAt' | 'swapApproved' | 'swapApprovedBy' | 'swapWith' | 'overrideActive'>,
    backup: Omit<OnCallAssignment, 'acknowledgedSchedule' | 'acknowledgedAt' | 'swapRequested' | 'swapRequestedAt' | 'swapApproved' | 'swapApprovedBy' | 'swapWith' | 'overrideActive'>,
    tertiary?: Omit<OnCallAssignment, 'acknowledgedSchedule' | 'acknowledgedAt' | 'swapRequested' | 'swapRequestedAt' | 'swapApproved' | 'swapApprovedBy' | 'swapWith' | 'overrideActive'>,
    createdBy?: UserId
  ): OnCallRotation {
    const now = new Date().toISOString();
    const weekEnd = new Date(weekStarting);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const makeAssignment = (
      base: typeof primary
    ): OnCallAssignment => ({
      ...base,
      acknowledgedSchedule: false,
      swapRequested: false,
      overrideActive: false,
    });
    
    return {
      id: crypto.randomUUID(),
      scheduleId: schedule.id,
      weekStarting,
      weekEnding: weekEnd.toISOString().split('T')[0],
      primary: makeAssignment(primary),
      backup: makeAssignment(backup),
      tertiary: tertiary ? makeAssignment(tertiary) : undefined,
      status: 'scheduled',
      coverageGaps: [],
      audit: {
        createdAt: now,
        createdBy: createdBy ?? schedule.audit.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Acknowledge on-call assignment
   */
  acknowledgeAssignment(
    rotation: OnCallRotation,
    userId: UserId,
    role: 'primary' | 'backup' | 'tertiary'
  ): OnCallRotation {
    const now = new Date().toISOString();
    
    const updateAssignment = (assignment: OnCallAssignment): OnCallAssignment => {
      if (assignment.userId === userId) {
        return {
          ...assignment,
          acknowledgedSchedule: true,
          acknowledgedAt: now,
        };
      }
      return assignment;
    };
    
    return {
      ...rotation,
      primary: role === 'primary' ? updateAssignment(rotation.primary) : rotation.primary,
      backup: role === 'backup' ? updateAssignment(rotation.backup) : rotation.backup,
      tertiary: role === 'tertiary' && rotation.tertiary 
        ? updateAssignment(rotation.tertiary) 
        : rotation.tertiary,
      audit: {
        ...rotation.audit,
        updatedAt: now,
        version: rotation.audit.version + 1,
      },
    };
  }
  
  /**
   * Request swap
   */
  requestSwap(
    rotation: OnCallRotation,
    userId: UserId,
    role: 'primary' | 'backup' | 'tertiary',
    reason: string
  ): OnCallRotation {
    const now = new Date().toISOString();
    
    const updateAssignment = (assignment: OnCallAssignment): OnCallAssignment => {
      if (assignment.userId === userId) {
        return {
          ...assignment,
          swapRequested: true,
          swapRequestedAt: now,
          swapReason: reason,
        };
      }
      return assignment;
    };
    
    return {
      ...rotation,
      primary: role === 'primary' ? updateAssignment(rotation.primary) : rotation.primary,
      backup: role === 'backup' ? updateAssignment(rotation.backup) : rotation.backup,
      tertiary: role === 'tertiary' && rotation.tertiary 
        ? updateAssignment(rotation.tertiary) 
        : rotation.tertiary,
      audit: {
        ...rotation.audit,
        updatedAt: now,
        version: rotation.audit.version + 1,
      },
    };
  }
  
  /**
   * Initiate escalation
   */
  initiateEscalation(
    schedule: OnCallSchedule,
    rotation: OnCallRotation,
    params: {
      triggeredBy: UserId;
      triggerReason: string;
      severity: 'urgent' | 'critical';
      caseId?: string;
      incidentId?: string;
    }
  ): OnCallEscalation {
    const now = new Date().toISOString();
    
    // Calculate timeout
    const timeoutMinutes = schedule.settings.primaryResponseMinutes +
                          schedule.settings.backupResponseMinutes +
                          schedule.settings.tertiaryResponseMinutes +
                          (schedule.settings.escalationDelayMinutes * 2);
    const timeout = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    
    // Create first attempt for primary
    const firstAttempt: OnCallAttempt = {
      id: crypto.randomUUID(),
      escalationId: '', // Will be set after escalation is created
      attemptNumber: 1,
      userId: rotation.primary.userId,
      userName: rotation.primary.userName,
      role: 'primary',
      contactMethod: rotation.primary.contactMethods[0]?.method ?? 'push',
      contactValue: rotation.primary.contactMethods[0]?.value ?? '',
      attemptedAt: now,
      responseDeadline: new Date(Date.now() + schedule.settings.primaryResponseMinutes * 60 * 1000).toISOString(),
    };
    
    const escalation: OnCallEscalation = {
      id: crypto.randomUUID(),
      scheduleId: schedule.id,
      rotationId: rotation.id,
      triggeredAt: now,
      triggeredBy: params.triggeredBy,
      triggerReason: params.triggerReason,
      severity: params.severity,
      caseId: params.caseId,
      incidentId: params.incidentId,
      attempts: [{ ...firstAttempt, escalationId: '' }], // Will be updated
      currentAttemptIndex: 0,
      status: 'escalating',
      escalatedToNextTier: false,
      manualOverrideRequired: false,
      timeoutAt: timeout.toISOString(),
      audit: {
        createdAt: now,
        createdBy: params.triggeredBy,
        version: 1,
      },
    };
    
    // Update attempt with escalation ID
    escalation.attempts[0].escalationId = escalation.id;
    
    return escalation;
  }
  
  /**
   * Record escalation response
   */
  recordResponse(
    escalation: OnCallEscalation,
    userId: UserId,
    response: 'acknowledged' | 'declined',
    declineReason?: string
  ): OnCallEscalation {
    const now = new Date().toISOString();
    
    // Update current attempt
    const updatedAttempts = escalation.attempts.map((attempt, index) => {
      if (index === escalation.currentAttemptIndex && attempt.userId === userId) {
        return {
          ...attempt,
          response,
          respondedAt: now,
          declineReason,
        };
      }
      return attempt;
    });
    
    // Determine new status
    let newStatus = escalation.status;
    if (response === 'acknowledged') {
      newStatus = 'acknowledged';
    } else if (response === 'declined') {
      // Need to escalate to next person
      newStatus = 'escalating';
    }
    
    return {
      ...escalation,
      attempts: updatedAttempts,
      status: newStatus,
      acknowledgedBy: response === 'acknowledged' ? userId : undefined,
      acknowledgedAt: response === 'acknowledged' ? now : undefined,
      audit: {
        ...escalation.audit,
        updatedAt: now,
        version: escalation.audit.version + 1,
      },
    };
  }
  
  /**
   * Escalate to next tier
   */
  escalateToNextTier(
    escalation: OnCallEscalation,
    rotation: OnCallRotation,
    schedule: OnCallSchedule
  ): OnCallEscalation {
    const now = new Date().toISOString();
    const currentAttempt = escalation.attempts[escalation.currentAttemptIndex];
    
    // Determine next tier
    let nextRole: 'backup' | 'tertiary' | 'manual' = 'manual';
    let nextAssignment: OnCallAssignment | undefined;
    
    if (currentAttempt.role === 'primary') {
      nextRole = 'backup';
      nextAssignment = rotation.backup;
    } else if (currentAttempt.role === 'backup' && rotation.tertiary) {
      nextRole = 'tertiary';
      nextAssignment = rotation.tertiary;
    }
    
    if (!nextAssignment) {
      // No more tiers - manual intervention required
      return {
        ...escalation,
        status: 'failed',
        escalatedToNextTier: true,
        manualOverrideRequired: true,
        failureReason: 'All on-call personnel unavailable',
        audit: {
          ...escalation.audit,
          updatedAt: now,
          version: escalation.audit.version + 1,
        },
      };
    }
    
    // Create new attempt
    const responseTime = nextRole === 'backup' 
      ? schedule.settings.backupResponseMinutes 
      : schedule.settings.tertiaryResponseMinutes;
    
    const newAttempt: OnCallAttempt = {
      id: crypto.randomUUID(),
      escalationId: escalation.id,
      attemptNumber: escalation.attempts.length + 1,
      userId: nextAssignment.userId,
      userName: nextAssignment.userName,
      role: nextRole,
      contactMethod: nextAssignment.contactMethods[0]?.method ?? 'push',
      contactValue: nextAssignment.contactMethods[0]?.value ?? '',
      attemptedAt: now,
      responseDeadline: new Date(Date.now() + responseTime * 60 * 1000).toISOString(),
    };
    
    return {
      ...escalation,
      attempts: [...escalation.attempts, newAttempt],
      currentAttemptIndex: escalation.attempts.length,
      escalatedToNextTier: true,
      audit: {
        ...escalation.audit,
        updatedAt: now,
        version: escalation.audit.version + 1,
      },
    };
  }
  
  /**
   * Resolve escalation
   */
  resolveEscalation(
    escalation: OnCallEscalation,
    resolvedBy: UserId,
    resolutionNotes?: string
  ): OnCallEscalation {
    const now = new Date().toISOString();
    
    return {
      ...escalation,
      status: 'resolved',
      resolvedAt: now,
      resolutionNotes,
      audit: {
        ...escalation.audit,
        updatedAt: now,
        version: escalation.audit.version + 1,
      },
    };
  }
  
  /**
   * Get current on-call person
   */
  getCurrentOnCall(
    schedule: OnCallSchedule,
    role: 'primary' | 'backup' | 'tertiary' = 'primary'
  ): OnCallAssignment | null {
    if (!schedule.currentRotation) return null;
    
    switch (role) {
      case 'primary': return schedule.currentRotation.primary;
      case 'backup': return schedule.currentRotation.backup;
      case 'tertiary': return schedule.currentRotation.tertiary ?? null;
    }
  }
  
  /**
   * Check if currently within coverage window
   */
  isWithinCoverageWindow(schedule: OnCallSchedule): boolean {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      timeZone: schedule.timezone 
    }).toLowerCase() as DayOfWeek;
    
    // Check if current day is covered
    if (!schedule.coverageWindow.daysOfWeek.includes(currentDay)) {
      return false;
    }
    
    // Check if current time is within window
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: schedule.timezone,
    });
    
    const startTime = schedule.coverageWindow.startTimeLocal;
    const endTime = schedule.coverageWindow.endTimeLocal;
    
    if (schedule.coverageWindow.isOvernight) {
      // Overnight window (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime < endTime;
    } else {
      // Same-day window
      return currentTime >= startTime && currentTime < endTime;
    }
  }
  
  /**
   * Get escalation statistics
   */
  getStatistics(escalations: OnCallEscalation[]): {
    total: number;
    acknowledged: number;
    resolved: number;
    failed: number;
    averageResponseTime: number;
    escalationRate: number;
  } {
    const total = escalations.length;
    const acknowledged = escalations.filter(e => e.status === 'acknowledged' || e.status === 'resolved').length;
    const resolved = escalations.filter(e => e.status === 'resolved').length;
    const failed = escalations.filter(e => e.status === 'failed').length;
    
    // Calculate average response time
    const withResponse = escalations.filter(e => e.acknowledgedAt);
    const averageResponseTime = withResponse.length > 0
      ? withResponse.reduce((sum, e) => {
          const responseTime = new Date(e.acknowledgedAt!).getTime() - new Date(e.triggeredAt).getTime();
          return sum + responseTime;
        }, 0) / withResponse.length / (1000 * 60) // minutes
      : 0;
    
    // Calculate escalation rate (escalations that went beyond primary)
    const escalated = escalations.filter(e => e.escalatedToNextTier).length;
    const escalationRate = total > 0 ? (escalated / total) * 100 : 0;
    
    return {
      total,
      acknowledged,
      resolved,
      failed,
      averageResponseTime,
      escalationRate,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const onCallManager = new OnCallManager();

export function createContactMethodPreference(
  method: ContactMethod,
  value: string,
  priority: number = 1
): ContactMethodPreference {
  return {
    method,
    value,
    priority,
    enabled: true,
  };
}

export function isEscalationOverdue(escalation: OnCallEscalation): boolean {
  if (escalation.status !== 'escalating') return false;
  
  const currentAttempt = escalation.attempts[escalation.currentAttemptIndex];
  if (!currentAttempt) return false;
  
  return new Date(currentAttempt.responseDeadline) <= new Date();
}

export function isEscalationTimedOut(escalation: OnCallEscalation): boolean {
  return new Date(escalation.timeoutAt) <= new Date();
}

export function getNextOnCallShift(schedule: OnCallSchedule): {
  startTime: string;
  endTime: string;
  rotation?: OnCallRotation;
} | null {
  if (!schedule.isActive || schedule.rotations.length === 0) return null;
  
  // Find next upcoming rotation
  const now = new Date();
  const upcomingRotations = schedule.rotations
    .filter(r => new Date(r.weekStarting) > now)
    .sort((a, b) => new Date(a.weekStarting).getTime() - new Date(b.weekStarting).getTime());
  
  if (upcomingRotations.length === 0) return null;
  
  const nextRotation = upcomingRotations[0];
  
  return {
    startTime: `${nextRotation.weekStarting}T${schedule.coverageWindow.startTimeLocal}:00`,
    endTime: `${nextRotation.weekEnding}T${schedule.coverageWindow.endTimeLocal}:00`,
    rotation: nextRotation,
  };
}

export function validateRotation(
  rotation: OnCallRotation,
  schedule: OnCallSchedule,
  existingRotations: OnCallRotation[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplicate week
  const duplicateWeek = existingRotations.find(r => 
    r.weekStarting === rotation.weekStarting && r.id !== rotation.id
  );
  if (duplicateWeek) {
    errors.push('A rotation already exists for this week');
  }
  
  // Check acknowledgement requirements
  if (schedule.settings.requiresAcknowledgement) {
    if (!rotation.primary.acknowledgedSchedule) {
      warnings.push('Primary has not acknowledged schedule');
    }
    if (!rotation.backup.acknowledgedSchedule) {
      warnings.push('Backup has not acknowledged schedule');
    }
  }
  
  // Check for same person in multiple roles
  if (rotation.primary.userId === rotation.backup.userId) {
    errors.push('Primary and backup cannot be the same person');
  }
  if (rotation.tertiary && rotation.primary.userId === rotation.tertiary.userId) {
    errors.push('Primary and tertiary cannot be the same person');
  }
  
  // Check for coverage gaps
  if (rotation.coverageGaps.some(gap => !gap.filled)) {
    warnings.push('There are unfilled coverage gaps');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function canVolunteerBeOnCall(
  userId: UserId,
  recentRotations: OnCallRotation[],
  settings: OnCallSettings
): { allowed: boolean; reason?: string } {
  // Check consecutive days constraint
  const consecutiveDays = countConsecutiveOnCallDays(userId, recentRotations);
  if (consecutiveDays >= settings.maxConsecutiveOnCallDays) {
    return {
      allowed: false,
      reason: `Exceeded maximum consecutive on-call days (${settings.maxConsecutiveOnCallDays})`,
    };
  }
  
  // Check minimum days between assignments
  const lastOnCall = getLastOnCallDate(userId, recentRotations);
  if (lastOnCall) {
    const daysSinceLast = Math.floor(
      (Date.now() - lastOnCall.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLast < settings.minDaysBetweenOnCallWeeks) {
      return {
        allowed: false,
        reason: `Must wait ${settings.minDaysBetweenOnCallWeeks - daysSinceLast} more days before next on-call`,
      };
    }
  }
  
  return { allowed: true };
}

function countConsecutiveOnCallDays(userId: UserId, rotations: OnCallRotation[]): number {
  // Simplified - would need actual day-by-day calculation
  const userRotations = rotations.filter(r => 
    r.primary.userId === userId || 
    r.backup.userId === userId ||
    r.tertiary?.userId === userId
  );
  
  return userRotations.length * 7; // Simplified
}

function getLastOnCallDate(userId: UserId, rotations: OnCallRotation[]): Date | null {
  const userRotations = rotations
    .filter(r => 
      r.primary.userId === userId || 
      r.backup.userId === userId ||
      r.tertiary?.userId === userId
    )
    .sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime());
  
  if (userRotations.length === 0) return null;
  
  return new Date(userRotations[0].weekEnding);
}
