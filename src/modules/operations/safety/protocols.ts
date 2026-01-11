/**
 * OPERATIONS MODULE - LONE WORKER SAFETY PROTOCOLS
 * 
 * Field operation check-in system to protect volunteers.
 * Location tracking requires explicit consent with TTL.
 */

import type { 
  UserId, CaseId, DispatchId, AuditMetadata, 
  GeoLocation, ContactMethod, EmergencyContact 
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// FIELD OPERATION
// ═══════════════════════════════════════════════════════════════════

export interface FieldOperation {
  id: string;
  volunteerId: UserId;
  caseId?: CaseId;
  dispatchId?: DispatchId;
  taskType: FieldTaskType;
  
  // Status
  status: FieldOperationStatus;
  
  // Consent (CRITICAL)
  locationConsent: LocationConsent;
  
  // Location tracking
  startLocation: GeoLocation;
  destinationLocation?: GeoLocation;
  currentLocation?: GeoLocation;
  locationPrecision: 'coarse' | 'precise';
  locationUpdatedAt?: string;
  
  // Check-in protocol
  checkInIntervalMinutes: number;
  lastCheckIn?: string;
  nextExpectedCheckIn: string;
  missedCheckIns: number;
  checkInHistory: CheckInEvent[];
  
  // Emergency contacts
  volunteerEmergencyContact: EmergencyContact;
  emergencyContactNotified: boolean;
  emergencyContactNotifiedAt?: string;
  
  // Escalation
  escalationLevel: EscalationLevel;
  escalationHistory: EscalationEvent[];
  
  // Buddy system
  buddyRequired: boolean;
  buddyUserId?: UserId;
  buddyConfirmed: boolean;
  buddyConfirmedAt?: string;
  
  // Timeline
  plannedStartAt?: string;
  startedAt: string;
  expectedEndAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // Completion
  completionNotes?: string;
  completionStatus?: 'success' | 'partial' | 'failed' | 'cancelled';
  
  // Data retention
  locationRetentionDays: number;
  scheduledPurgeAt: string;
  locationsPurgedAt?: string;
  
  // Audit
  audit: AuditMetadata;
}

export type FieldTaskType = 
  | 'transport'
  | 'trapping'
  | 'home_visit'
  | 'search'
  | 'foster_pickup'
  | 'foster_dropoff'
  | 'shelter_transfer'
  | 'vet_transport'
  | 'emergency_response';

export type FieldOperationStatus = 
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'overdue'
  | 'emergency'
  | 'cancelled';

export type EscalationLevel = 0 | 1 | 2 | 3;
// 0 = normal
// 1 = reminder sent
// 2 = emergency contact notified
// 3 = authorities consideration

// ═══════════════════════════════════════════════════════════════════
// LOCATION CONSENT
// ═══════════════════════════════════════════════════════════════════

export interface LocationConsent {
  captured: boolean;
  version: string;
  capturedAt: string;
  capturedIpAddress?: string;
  capturedUserAgent?: string;
  
  // Scope
  allowPreciseLocation: boolean;
  allowLocationHistory: boolean;
  allowEmergencyOverride: boolean;
  
  // Expiration
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export const LOCATION_CONSENT_VERSION = '2026-v1';

// ═══════════════════════════════════════════════════════════════════
// CHECK-IN EVENTS
// ═══════════════════════════════════════════════════════════════════

export interface CheckInEvent {
  id: string;
  timestamp: string;
  type: 'scheduled' | 'manual' | 'location_update' | 'completion' | 'emergency';
  location?: GeoLocation;
  status: 'ok' | 'need_assistance' | 'emergency';
  notes?: string;
  batteryLevel?: number;
  networkType?: string;
}

export interface EscalationEvent {
  id: string;
  timestamp: string;
  level: EscalationLevel;
  previousLevel: EscalationLevel;
  trigger: EscalationTrigger;
  action: string;
  contactedParty?: string;
  contactMethod?: ContactMethod;
  response?: string;
  responseAt?: string;
  handledBy?: UserId;
}

export type EscalationTrigger = 
  | 'missed_checkin'
  | 'emergency_button'
  | 'no_movement'
  | 'geofence_exit'
  | 'manual_escalation';

// ═══════════════════════════════════════════════════════════════════
// POLICY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const LONE_WORKER_POLICY = {
  // Check-in intervals
  defaultCheckInIntervalMinutes: 30,
  highRiskCheckInIntervalMinutes: 15,
  
  // Escalation thresholds
  reminderAfterMinutes: 15,
  emergencyContactAfterMinutes: 30,
  authoritiesConsiderAfterMinutes: 60,
  
  // Buddy requirements
  buddyRequiredFor: [
    'night_trapping',
    'aggressive_animal_report',
    'unfamiliar_area',
    'hostile_finder_reported',
    'remote_location',
  ] as const,
  
  // Location privacy
  defaultLocationPrecision: 'coarse' as const,
  locationRetentionDays: 30,
  
  // Consent
  requiresExplicitConsent: true,
  consentVersion: LOCATION_CONSENT_VERSION,
  consentExpirationDays: 365,
};

export interface FieldOperationPolicy {
  taskType: FieldTaskType;
  defaultCheckInMinutes: number;
  requiresBuddy: boolean;
  requiresDestination: boolean;
  maxDurationHours: number;
  highRiskIndicators: string[];
}

export const FIELD_OPERATION_POLICIES: FieldOperationPolicy[] = [
  { 
    taskType: 'transport', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 4,
    highRiskIndicators: ['aggressive_animal', 'long_distance'],
  },
  { 
    taskType: 'trapping', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 8,
    highRiskIndicators: ['night_operation', 'remote_location', 'feral_animal'],
  },
  { 
    taskType: 'home_visit', 
    defaultCheckInMinutes: 15, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 2,
    highRiskIndicators: ['unknown_person', 'unfamiliar_area'],
  },
  { 
    taskType: 'search', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: true, 
    requiresDestination: false, 
    maxDurationHours: 6,
    highRiskIndicators: ['wooded_area', 'water_nearby', 'night_search'],
  },
  { 
    taskType: 'foster_pickup', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 2,
    highRiskIndicators: [],
  },
  { 
    taskType: 'foster_dropoff', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 2,
    highRiskIndicators: [],
  },
  { 
    taskType: 'shelter_transfer', 
    defaultCheckInMinutes: 30, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 3,
    highRiskIndicators: [],
  },
  { 
    taskType: 'vet_transport', 
    defaultCheckInMinutes: 15, 
    requiresBuddy: false, 
    requiresDestination: true, 
    maxDurationHours: 3,
    highRiskIndicators: ['injured_animal', 'emergency'],
  },
  { 
    taskType: 'emergency_response', 
    defaultCheckInMinutes: 15, 
    requiresBuddy: true, 
    requiresDestination: true, 
    maxDurationHours: 4,
    highRiskIndicators: ['unknown_situation', 'traffic_accident', 'animal_attack'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get policy for a task type
 */
export function getTaskPolicy(taskType: FieldTaskType): FieldOperationPolicy {
  return FIELD_OPERATION_POLICIES.find(p => p.taskType === taskType) ?? {
    taskType,
    defaultCheckInMinutes: LONE_WORKER_POLICY.defaultCheckInIntervalMinutes,
    requiresBuddy: false,
    requiresDestination: false,
    maxDurationHours: 4,
    highRiskIndicators: [],
  };
}

/**
 * Check if check-in is overdue
 */
export function isCheckInOverdue(operation: FieldOperation): boolean {
  if (operation.status !== 'active') return false;
  
  const now = new Date();
  const nextExpected = new Date(operation.nextExpectedCheckIn);
  return now > nextExpected;
}

/**
 * Calculate minutes since last check-in
 */
export function minutesSinceLastCheckIn(operation: FieldOperation): number {
  if (!operation.lastCheckIn) {
    return Math.floor((Date.now() - new Date(operation.startedAt).getTime()) / (1000 * 60));
  }
  return Math.floor((Date.now() - new Date(operation.lastCheckIn).getTime()) / (1000 * 60));
}

/**
 * Determine required escalation action
 */
export function getEscalationAction(operation: FieldOperation): {
  level: EscalationLevel;
  action: string;
  contacts: string[];
  urgent: boolean;
} {
  const minutesOverdue = minutesSinceLastCheckIn(operation) - operation.checkInIntervalMinutes;
  
  if (minutesOverdue < 0) {
    return { level: 0, action: 'none', contacts: [], urgent: false };
  }
  
  if (minutesOverdue < LONE_WORKER_POLICY.reminderAfterMinutes) {
    return { 
      level: 1, 
      action: 'send_reminder', 
      contacts: ['volunteer'], 
      urgent: false,
    };
  }
  
  if (minutesOverdue < LONE_WORKER_POLICY.emergencyContactAfterMinutes) {
    return { 
      level: 2, 
      action: 'contact_emergency', 
      contacts: ['volunteer', 'emergency_contact'], 
      urgent: true,
    };
  }
  
  return { 
    level: 3, 
    action: 'consider_authorities', 
    contacts: ['volunteer', 'emergency_contact', 'lead_moderator'], 
    urgent: true,
  };
}

/**
 * Check if buddy is required for operation
 */
export function requiresBuddy(operation: FieldOperation, riskIndicators: string[] = []): boolean {
  const policy = getTaskPolicy(operation.taskType);
  
  if (policy.requiresBuddy) return true;
  
  // Check high-risk indicators
  const hasHighRisk = riskIndicators.some(indicator => 
    LONE_WORKER_POLICY.buddyRequiredFor.includes(indicator as any)
  );
  
  return hasHighRisk;
}

/**
 * Validate location consent
 */
export function isLocationConsentValid(consent: LocationConsent): boolean {
  if (!consent.captured) return false;
  if (consent.revokedAt) return false;
  if (new Date(consent.expiresAt) <= new Date()) return false;
  if (consent.version !== LOCATION_CONSENT_VERSION) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// OPERATION FACTORY
// ═══════════════════════════════════════════════════════════════════

export function createFieldOperation(params: {
  volunteerId: UserId;
  taskType: FieldTaskType;
  startLocation: GeoLocation;
  destinationLocation?: GeoLocation;
  caseId?: CaseId;
  dispatchId?: DispatchId;
  locationConsent: LocationConsent;
  emergencyContact: EmergencyContact;
  buddyUserId?: UserId;
  riskIndicators?: string[];
}): FieldOperation {
  const now = new Date();
  const policy = getTaskPolicy(params.taskType);
  
  // Determine check-in interval based on risk
  const hasHighRisk = params.riskIndicators?.some(r => policy.highRiskIndicators.includes(r));
  const checkInInterval = hasHighRisk 
    ? LONE_WORKER_POLICY.highRiskCheckInIntervalMinutes 
    : policy.defaultCheckInMinutes;
  
  // Calculate next check-in
  const nextCheckIn = new Date(now.getTime() + checkInInterval * 60 * 1000);
  
  // Calculate retention purge date
  const purgeDate = new Date(now.getTime() + LONE_WORKER_POLICY.locationRetentionDays * 24 * 60 * 60 * 1000);
  
  // Determine if buddy is required
  const needsBuddy = requiresBuddy({ taskType: params.taskType } as FieldOperation, params.riskIndicators);
  
  return {
    id: crypto.randomUUID(),
    volunteerId: params.volunteerId,
    caseId: params.caseId,
    dispatchId: params.dispatchId,
    taskType: params.taskType,
    status: 'active',
    locationConsent: params.locationConsent,
    startLocation: params.startLocation,
    destinationLocation: params.destinationLocation,
    locationPrecision: params.locationConsent.allowPreciseLocation ? 'precise' : 'coarse',
    checkInIntervalMinutes: checkInInterval,
    nextExpectedCheckIn: nextCheckIn.toISOString(),
    missedCheckIns: 0,
    checkInHistory: [{
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      type: 'manual',
      location: params.startLocation,
      status: 'ok',
      notes: 'Operation started',
    }],
    volunteerEmergencyContact: params.emergencyContact,
    emergencyContactNotified: false,
    escalationLevel: 0,
    escalationHistory: [],
    buddyRequired: needsBuddy,
    buddyUserId: params.buddyUserId,
    buddyConfirmed: !!params.buddyUserId,
    buddyConfirmedAt: params.buddyUserId ? now.toISOString() : undefined,
    startedAt: now.toISOString(),
    locationRetentionDays: LONE_WORKER_POLICY.locationRetentionDays,
    scheduledPurgeAt: purgeDate.toISOString(),
    audit: {
      createdAt: now.toISOString(),
      createdBy: params.volunteerId,
      version: 1,
    },
  };
}

/**
 * Record a check-in
 */
export function recordCheckIn(
  operation: FieldOperation,
  checkIn: Omit<CheckInEvent, 'id' | 'timestamp'>
): FieldOperation {
  const now = new Date();
  const nextCheckIn = new Date(now.getTime() + operation.checkInIntervalMinutes * 60 * 1000);
  
  const newCheckIn: CheckInEvent = {
    ...checkIn,
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
  };
  
  // Reset missed check-ins on successful check-in
  const missedCheckIns = checkIn.status === 'ok' ? 0 : operation.missedCheckIns;
  
  // Update status based on check-in
  let status: FieldOperationStatus = operation.status;
  if (checkIn.status === 'emergency') {
    status = 'emergency';
  } else if (checkIn.type === 'completion') {
    status = 'completed';
  } else if (operation.status === 'overdue' && checkIn.status === 'ok') {
    status = 'active';
  }
  
  return {
    ...operation,
    status,
    lastCheckIn: now.toISOString(),
    nextExpectedCheckIn: nextCheckIn.toISOString(),
    currentLocation: checkIn.location,
    locationUpdatedAt: checkIn.location ? now.toISOString() : operation.locationUpdatedAt,
    missedCheckIns,
    checkInHistory: [...operation.checkInHistory, newCheckIn],
    audit: {
      ...operation.audit,
      updatedAt: now.toISOString(),
      version: operation.audit.version + 1,
    },
  };
}

/**
 * Record an escalation
 */
export function recordEscalation(
  operation: FieldOperation,
  escalation: Omit<EscalationEvent, 'id' | 'timestamp' | 'previousLevel'>
): FieldOperation {
  const now = new Date();
  
  const newEscalation: EscalationEvent = {
    ...escalation,
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
    previousLevel: operation.escalationLevel,
  };
  
  return {
    ...operation,
    escalationLevel: escalation.level,
    escalationHistory: [...operation.escalationHistory, newEscalation],
    emergencyContactNotified: escalation.level >= 2 ? true : operation.emergencyContactNotified,
    emergencyContactNotifiedAt: escalation.level >= 2 && !operation.emergencyContactNotified 
      ? now.toISOString() 
      : operation.emergencyContactNotifiedAt,
    audit: {
      ...operation.audit,
      updatedAt: now.toISOString(),
      version: operation.audit.version + 1,
    },
  };
}

/**
 * Complete a field operation
 */
export function completeFieldOperation(
  operation: FieldOperation,
  completion: {
    status: 'success' | 'partial' | 'failed' | 'cancelled';
    notes?: string;
    finalLocation?: GeoLocation;
  }
): FieldOperation {
  const now = new Date();
  
  return {
    ...operation,
    status: completion.status === 'cancelled' ? 'cancelled' : 'completed',
    completedAt: now.toISOString(),
    completionStatus: completion.status,
    completionNotes: completion.notes,
    currentLocation: completion.finalLocation ?? operation.currentLocation,
    locationUpdatedAt: completion.finalLocation ? now.toISOString() : operation.locationUpdatedAt,
    checkInHistory: [
      ...operation.checkInHistory,
      {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        type: 'completion' as const,
        location: completion.finalLocation,
        status: 'ok' as const,
        notes: completion.notes,
      },
    ],
    audit: {
      ...operation.audit,
      updatedAt: now.toISOString(),
      version: operation.audit.version + 1,
    },
  };
}
