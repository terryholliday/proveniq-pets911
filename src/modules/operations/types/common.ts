/**
 * OPERATIONS MODULE - COMMON TYPES
 * 
 * Shared primitives used across all operations sub-modules.
 * These are the foundational building blocks for the entire system.
 */

// ═══════════════════════════════════════════════════════════════════
// BRANDED TYPES (Type-safe IDs)
// ═══════════════════════════════════════════════════════════════════

declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type CaseId = Brand<string, 'CaseId'>;
export type ClaimId = Brand<string, 'ClaimId'>;
export type IncidentId = Brand<string, 'IncidentId'>;
export type AssetId = Brand<string, 'AssetId'>;
export type ApplicationId = Brand<string, 'ApplicationId'>;
export type DispatchId = Brand<string, 'DispatchId'>;
export type HandoffId = Brand<string, 'HandoffId'>;
export type AuditLogId = Brand<string, 'AuditLogId'>;

// Type guards for branded types
export function asUserId(id: string): UserId { return id as UserId; }
export function asCaseId(id: string): CaseId { return id as CaseId; }
export function asClaimId(id: string): ClaimId { return id as ClaimId; }
export function asIncidentId(id: string): IncidentId { return id as IncidentId; }
export function asAssetId(id: string): AssetId { return id as AssetId; }
export function asApplicationId(id: string): ApplicationId { return id as ApplicationId; }
export function asDispatchId(id: string): DispatchId { return id as DispatchId; }
export function asHandoffId(id: string): HandoffId { return id as HandoffId; }
export function asAuditLogId(id: string): AuditLogId { return id as AuditLogId; }

// ═══════════════════════════════════════════════════════════════════
// SEVERITY & PRIORITY
// ═══════════════════════════════════════════════════════════════════

export type Severity = 'minor' | 'moderate' | 'major' | 'critical';

export type Priority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

// ═══════════════════════════════════════════════════════════════════
// SPECIES & ANIMALS
// ═══════════════════════════════════════════════════════════════════

export type Species = 
  | 'dog' 
  | 'cat' 
  | 'bird' 
  | 'rabbit' 
  | 'reptile' 
  | 'small_mammal' 
  | 'horse' 
  | 'livestock' 
  | 'exotic' 
  | 'other';

export type AnimalSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'giant';

export const ANIMAL_SIZE_WEIGHTS: Record<AnimalSize, { minKg: number; maxKg: number }> = {
  tiny: { minKg: 0, maxKg: 2 },
  small: { minKg: 2, maxKg: 10 },
  medium: { minKg: 10, maxKg: 25 },
  large: { minKg: 25, maxKg: 45 },
  xlarge: { minKg: 45, maxKg: 70 },
  giant: { minKg: 70, maxKg: 500 },
};

// ═══════════════════════════════════════════════════════════════════
// STATUS PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

export type ActiveStatus = 'active' | 'inactive' | 'suspended' | 'expired' | 'revoked';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'withdrawn';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'definitive';

// ═══════════════════════════════════════════════════════════════════
// TIME & SCHEDULING
// ═══════════════════════════════════════════════════════════════════

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'overnight';

export const TIME_SLOT_HOURS: Record<TimeSlot, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 22 },
  overnight: { start: 22, end: 6 },
};

export interface TimeRange {
  startTime: string;  // HH:mm format
  endTime: string;    // HH:mm format
}

export interface DateRange {
  start: string;  // ISO date
  end: string;    // ISO date
}

// ═══════════════════════════════════════════════════════════════════
// CONTACT & COMMUNICATION
// ═══════════════════════════════════════════════════════════════════

export type ContactMethod = 'phone' | 'sms' | 'email' | 'in_app' | 'push';

export interface ContactInfo {
  phone?: string;
  alternatePhone?: string;
  email?: string;
  preferredMethod: ContactMethod;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
}

// ═══════════════════════════════════════════════════════════════════
// IDENTITY & SECURITY
// ═══════════════════════════════════════════════════════════════════

/**
 * Identity Assurance Levels (NIST SP 800-63A inspired)
 * - IAL0: No identity proofing
 * - IAL1: Self-asserted identity
 * - IAL2: Remote or in-person identity proofing (ID document + photo match)
 * - IAL3: In-person identity proofing with biometric verification
 */
export type IdentityAssuranceLevel = 'IAL0' | 'IAL1' | 'IAL2' | 'IAL3';

export type IdDocumentType = 'drivers_license' | 'state_id' | 'passport' | 'military_id';

export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'hardware_key';

// ═══════════════════════════════════════════════════════════════════
// LEGAL & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════

export type WaiverType = 
  | 'liability_waiver'
  | 'nda_agreement'
  | 'media_release'
  | 'vehicle_indemnification'
  | 'background_check_consent'
  | 'location_sharing_consent'
  | 'photo_consent'
  | 'minor_guardian_consent';

export type ConsentPurpose = 
  | 'location_tracking'
  | 'photo_storage'
  | 'contact_sharing'
  | 'background_check'
  | 'marketing'
  | 'research';

export interface ConsentRecord {
  purpose: ConsentPurpose;
  granted: boolean;
  version: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT & TRACKING
// ═══════════════════════════════════════════════════════════════════

export interface AuditMetadata {
  createdAt: string;
  createdBy: UserId;
  updatedAt?: string;
  updatedBy?: UserId;
  version: number;
}

export interface SoftDelete {
  deletedAt?: string;
  deletedBy?: UserId;
  deletionReason?: string;
  isDeleted: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// REGION & COUNTY
// ═══════════════════════════════════════════════════════════════════

export type County = 
  | 'kanawha'
  | 'cabell'
  | 'putnam'
  | 'wayne'
  | 'raleigh'
  | 'wood'
  | 'monongalia'
  | 'berkeley'
  | 'harrison'
  | 'greenbrier'
  | 'other';

export type RegionId = Brand<string, 'RegionId'>;

export function asRegionId(id: string): RegionId { return id as RegionId; }

// ═══════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════

export interface OperationsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
}

export type OperationsErrorCode =
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'REQUIRES_APPROVAL'
  | 'REQUIRES_BREAK_GLASS'
  | 'CONSENT_REQUIRED'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'INTERNAL_ERROR';

export function createOperationsError(
  code: OperationsErrorCode,
  message: string,
  details?: Record<string, unknown>
): OperationsError {
  return {
    code,
    message,
    details,
    correlationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// RESULT TYPE (For explicit error handling)
// ═══════════════════════════════════════════════════════════════════

export type Result<T, E = OperationsError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

export function failure<E = OperationsError>(error: E): Result<never, E> {
  return { success: false, error };
}

// ═══════════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════════

export interface PaginationParams {
  limit: number;
  offset: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
