/**
 * OPERATIONS MODULE - VOLUNTEER STATUS MANAGEMENT
 * 
 * Self-service status management for volunteers.
 */

import type { UserId, AuditMetadata } from '../types';
import type { VolunteerProfile, WellnessStatus } from './profile';

// ═══════════════════════════════════════════════════════════════════
// STATUS TYPES
// ═══════════════════════════════════════════════════════════════════

export type VolunteerAvailabilityStatus = 
  | 'available'
  | 'busy'
  | 'on_break'
  | 'unavailable'
  | 'emergency_only';

export type StatusReason = 
  | 'normal'
  | 'transport_active'
  | 'foster_care'
  | 'personal_time'
  | 'medical'
  | 'family'
  | 'vacation'
  | 'burnout'
  | 'compassion_fatigue'
  | 'equipment_issue'
  | 'weather'
  | 'other';

export interface StatusChange {
  id: string;
  userId: UserId;
  previousStatus: VolunteerAvailabilityStatus;
  newStatus: VolunteerAvailabilityStatus;
  reason: StatusReason;
  reasonDetails?: string;
  estimatedReturn?: string;
  changedAt: string;
  changedBy: UserId; // Can be self or admin
  isTemporary: boolean;
  autoReactivateAt?: string;
  audit: AuditMetadata;
}

export interface StatusHistory {
  userId: UserId;
  changes: StatusChange[];
  currentStatus: VolunteerAvailabilityStatus;
  statusSince: string;
  totalTimeInStatus: number; // hours
}

// ═══════════════════════════════════════════════════════════════════
// STATUS POLICIES
// ═══════════════════════════════════════════════════════════════════

export interface StatusPolicy {
  status: VolunteerAvailabilityStatus;
  allowedReasons: StatusReason[];
  maxDurationHours?: number;
  requiresApproval?: boolean;
  canSelfSet: boolean;
  restrictsDispatch: boolean;
  autoMessage?: string;
}

export const STATUS_POLICIES: StatusPolicy[] = [
  {
    status: 'available',
    allowedReasons: ['normal'],
    canSelfSet: true,
    restrictsDispatch: false,
  },
  {
    status: 'busy',
    allowedReasons: ['transport_active', 'foster_care', 'personal_time'],
    maxDurationHours: 8,
    canSelfSet: true,
    restrictsDispatch: true,
    autoMessage: 'Currently busy with another task',
  },
  {
    status: 'on_break',
    allowedReasons: ['medical', 'family', 'vacation', 'burnout', 'compassion_fatigue'],
    maxDurationHours: 168, // 7 days
    canSelfSet: true,
    restrictsDispatch: true,
    autoMessage: 'On temporary break',
  },
  {
    status: 'unavailable',
    allowedReasons: ['medical', 'family', 'equipment_issue', 'weather', 'other'],
    maxDurationHours: 720, // 30 days
    requiresApproval: true,
    canSelfSet: false,
    restrictsDispatch: true,
    autoMessage: 'Currently unavailable',
  },
  {
    status: 'emergency_only',
    allowedReasons: ['medical', 'family', 'equipment_issue'],
    maxDurationHours: 168, // 7 days
    canSelfSet: true,
    restrictsDispatch: false,
    autoMessage: 'Only available for emergencies',
  },
];

// ═══════════════════════════════════════════════════════════════════
// STATUS VALIDATION
// ═══════════════════════════════════════════════════════════════════

export interface StatusValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStatusChange(
  userId: UserId,
  currentStatus: VolunteerAvailabilityStatus,
  newStatus: VolunteerAvailabilityStatus,
  reason: StatusReason,
  estimatedReturn?: string,
  isSelfChange: boolean = true
): StatusValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get policy for new status
  const policy = STATUS_POLICIES.find(p => p.status === newStatus);
  if (!policy) {
    errors.push('Invalid status');
    return { valid: false, errors, warnings };
  }
  
  // Check if reason is allowed
  if (!policy.allowedReasons.includes(reason)) {
    errors.push(`Reason '${reason}' is not allowed for status '${newStatus}'`);
  }
  
  // Check self-change permissions
  if (isSelfChange && !policy.canSelfSet) {
    errors.push(`Status '${newStatus}' requires admin approval`);
  }
  
  // Check duration limits
  if (policy.maxDurationHours && estimatedReturn) {
    const now = new Date();
    const returnDate = new Date(estimatedReturn);
    const durationHours = (returnDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (durationHours > policy.maxDurationHours) {
      errors.push(`Maximum duration for this status is ${policy.maxDurationHours} hours`);
    }
  }
  
  // Check for forced break conditions
  if (newStatus === 'available' && reason === 'burnout') {
    warnings.push('Consider taking a break instead of marking as available');
  }
  
  // Check for consecutive unavailable time
  if (newStatus === 'unavailable' && reason === 'personal_time') {
    warnings.push('Consider using "on_break" for personal time');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════
// STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export class VolunteerStatusManager {
  /**
   * Change volunteer status
   */
  changeStatus(
    profile: VolunteerProfile,
    newStatus: VolunteerAvailabilityStatus,
    reason: StatusReason,
    changedBy: UserId,
    reasonDetails?: string,
    estimatedReturn?: string
  ): StatusChange {
    const isSelfChange = changedBy === profile.userId;
    const validation = validateStatusChange(
      profile.userId,
      profile.wellnessStatus.currentStatus as VolunteerAvailabilityStatus,
      newStatus,
      reason,
      estimatedReturn,
      isSelfChange
    );
    
    if (!validation.valid) {
      throw new Error(`Status change invalid: ${validation.errors.join(', ')}`);
    }
    
    const now = new Date().toISOString();
    const policy = STATUS_POLICIES.find(p => p.status === newStatus);
    
    return {
      id: crypto.randomUUID(),
      userId: profile.userId,
      previousStatus: profile.wellnessStatus.currentStatus as VolunteerAvailabilityStatus,
      newStatus,
      reason,
      reasonDetails,
      estimatedReturn,
      changedAt: now,
      changedBy,
      isTemporary: !!estimatedReturn,
      autoReactivateAt: estimatedReturn,
      audit: {
        createdAt: now,
        createdBy: changedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Update profile with new status
   */
  updateProfileStatus(
    profile: VolunteerProfile,
    statusChange: StatusChange
  ): VolunteerProfile {
    return {
      ...profile,
      wellnessStatus: {
        ...profile.wellnessStatus,
        currentStatus: statusChange.newStatus as WellnessStatus['currentStatus'],
        statusReason: statusChange.reason as WellnessStatus['statusReason'],
        statusChangedAt: statusChange.changedAt,
        statusChangedBy: statusChange.changedBy,
        autoReactivateAt: statusChange.autoReactivateAt,
        forcedBreakActive: statusChange.reason === 'burnout' || statusChange.reason === 'compassion_fatigue',
        forcedBreakReason: statusChange.reason === 'burnout' || statusChange.reason === 'compassion_fatigue' 
          ? statusChange.reason 
          : undefined,
        forcedBreakEndsAt: statusChange.autoReactivateAt,
      },
      updatedAt: statusChange.changedAt,
      audit: {
        ...profile.audit,
        updatedAt: statusChange.changedAt,
        version: profile.audit.version + 1,
      },
    };
  }
  
  /**
   * Check if status needs auto-reactivation
   */
  checkAutoReactivation(profile: VolunteerProfile): boolean {
    if (!profile.wellnessStatus.autoReactivateAt) return false;
    
    const now = new Date();
    const reactivateAt = new Date(profile.wellnessStatus.autoReactivateAt);
    
    return now >= reactivateAt;
  }
  
  /**
   * Auto-reactivate volunteer status
   */
  autoReactivateStatus(profile: VolunteerProfile): VolunteerProfile {
    if (!this.checkAutoReactivation(profile)) {
      return profile;
    }
    
    const now = new Date().toISOString();
    
    return {
      ...profile,
      wellnessStatus: {
        ...profile.wellnessStatus,
        currentStatus: 'available' as const,
        statusReason: undefined,
        statusChangedAt: now,
        statusChangedBy: profile.userId,
        autoReactivateAt: undefined,
        forcedBreakActive: false,
        forcedBreakReason: undefined,
        forcedBreakEndsAt: undefined,
      },
      updatedAt: now,
      audit: {
        ...profile.audit,
        updatedAt: now,
        version: profile.audit.version + 1,
      },
    };
  }
  
  /**
   * Get status summary
   */
  getStatusSummary(profile: VolunteerProfile): {
    status: VolunteerAvailabilityStatus;
    statusSince: string;
    timeInStatus: number;
    autoReactivateAt?: string;
    message?: string;
  } {
    const status = profile.wellnessStatus.currentStatus as VolunteerAvailabilityStatus;
    const statusSince = profile.wellnessStatus.statusChangedAt;
    const timeInStatus = Math.floor(
      (Date.now() - new Date(statusSince).getTime()) / (1000 * 60 * 60)
    );
    
    const policy = STATUS_POLICIES.find(p => p.status === status);
    
    return {
      status,
      statusSince,
      timeInStatus,
      autoReactivateAt: profile.wellnessStatus.autoReactivateAt,
      message: policy?.autoMessage,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// STATUS TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export interface StatusTemplate {
  name: string;
  status: VolunteerAvailabilityStatus;
  reason: StatusReason;
  defaultDuration?: number; // hours
  message?: string;
  quickSelect: boolean;
}

export const STATUS_TEMPLATES: StatusTemplate[] = [
  // Quick status changes
  {
    name: 'On Transport',
    status: 'busy',
    reason: 'transport_active',
    defaultDuration: 2,
    message: 'Currently transporting an animal',
    quickSelect: true,
  },
  {
    name: 'Foster Duty',
    status: 'busy',
    reason: 'foster_care',
    defaultDuration: 4,
    message: 'Caring for foster animals',
    quickSelect: true,
  },
  {
    name: 'Lunch Break',
    status: 'busy',
    reason: 'personal_time',
    defaultDuration: 1,
    message: 'Away for lunch',
    quickSelect: true,
  },
  
  // Breaks
  {
    name: 'Medical Appointment',
    status: 'on_break',
    reason: 'medical',
    defaultDuration: 4,
    message: 'At medical appointment',
    quickSelect: true,
  },
  {
    name: 'Family Emergency',
    status: 'on_break',
    reason: 'family',
    defaultDuration: 24,
    message: 'Family emergency',
    quickSelect: true,
  },
  {
    name: 'Vacation',
    status: 'on_break',
    reason: 'vacation',
    defaultDuration: 168, // 7 days
    message: 'On vacation',
    quickSelect: false,
  },
  
  // Wellness
  {
    name: 'Burnout Break',
    status: 'on_break',
    reason: 'burnout',
    defaultDuration: 72, // 3 days
    message: 'Taking a wellness break',
    quickSelect: false,
  },
  {
    name: 'Compassion Fatigue',
    status: 'on_break',
    reason: 'compassion_fatigue',
    defaultDuration: 168, // 7 days
    message: 'Recovering from compassion fatigue',
    quickSelect: false,
  },
  
  // Unavailable
  {
    name: 'Medical Leave',
    status: 'unavailable',
    reason: 'medical',
    defaultDuration: 168, // 7 days
    message: 'On medical leave',
    quickSelect: false,
  },
  {
    name: 'Equipment Issue',
    status: 'unavailable',
    reason: 'equipment_issue',
    defaultDuration: 48,
    message: 'Vehicle/equipment under repair',
    quickSelect: false,
  },
  
  // Emergency only
  {
    name: 'Limited Availability',
    status: 'emergency_only',
    reason: 'medical',
    defaultDuration: 24,
    message: 'Only available for life-threatening emergencies',
    quickSelect: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const statusManager = new VolunteerStatusManager();

export function getQuickStatusTemplates(): StatusTemplate[] {
  return STATUS_TEMPLATES.filter(t => t.quickSelect);
}

export function getStatusTemplate(name: string): StatusTemplate | undefined {
  return STATUS_TEMPLATES.find(t => t.name === name);
}

export function calculateEstimatedReturn(
  status: VolunteerAvailabilityStatus,
  reason: StatusReason,
  durationHours?: number
): string | undefined {
  if (!durationHours) return undefined;
  
  const now = new Date();
  const returnTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  
  return returnTime.toISOString();
}

export function getStatusDuration(statusChange: StatusChange): number {
  const now = new Date();
  const changedAt = new Date(statusChange.changedAt);
  
  return Math.floor((now.getTime() - changedAt.getTime()) / (1000 * 60 * 60));
}

export function isStatusExpired(statusChange: StatusChange): boolean {
  if (!statusChange.autoReactivateAt) return false;
  
  const now = new Date();
  const reactivateAt = new Date(statusChange.autoReactivateAt);
  
  return now >= reactivateAt;
}

export function canReceiveDispatch(profile: VolunteerProfile): boolean {
  const status = profile.wellnessStatus.currentStatus;
  
  // Available volunteers always receive dispatches
  if (status === 'available') return true;
  
  // All other statuses do not receive dispatches
  return false;
}

export function getDispatchPriority(profile: VolunteerProfile): number {
  const status = profile.wellnessStatus.currentStatus;
  
  // Priority: available (100) > others (0)
  switch (status) {
    case 'available': return 100;
    default: return 0;
  }
}
