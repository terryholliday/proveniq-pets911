/**
 * OPERATIONS MODULE - LEGAL AGREEMENTS
 * 
 * Waivers, agreements, and consent tracking for volunteers.
 */

import type { UserId, WaiverType, AuditMetadata } from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// AGREEMENT VERSIONS
// ═══════════════════════════════════════════════════════════════════

export interface AgreementVersion {
  type: WaiverType;
  version: string;
  effectiveDate: string;
  supersedes?: string;
  documentUrl: string;
  summary: string;
  requiredForRoles: RoleId[];
  requiresResigning: boolean;
  legalJurisdiction: string;
  lastReviewed: string;
  reviewedBy: string;
}

export const AGREEMENT_VERSIONS: AgreementVersion[] = [
  {
    type: 'liability_waiver',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/waivers/liability-waiver-2026-v1.0.pdf',
    summary: 'Liability waiver for volunteer activities',
    requiredForRoles: [
      'foundation_admin', 'regional_coordinator', 'lead_moderator', 'moderator', 
      'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 
      'foster', 'trapper', 'community_volunteer'
    ],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
  {
    type: 'nda_agreement',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/agreements/nda-2026-v1.0.pdf',
    summary: 'Non-disclosure agreement for sensitive information',
    requiredForRoles: ['foundation_admin', 'regional_coordinator', 'lead_moderator'],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
  {
    type: 'media_release',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/releases/media-release-2026-v1.0.pdf',
    summary: 'Permission to use photos/videos of volunteer',
    requiredForRoles: [],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
  {
    type: 'vehicle_indemnification',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/indemnification/vehicle-indemnification-2026-v1.0.pdf',
    summary: 'Vehicle use indemnification for transport volunteers',
    requiredForRoles: ['senior_transporter', 'transporter'],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
  {
    type: 'background_check_consent',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/consents/background-check-consent-2026-v1.0.pdf',
    summary: 'Consent for background check processing',
    requiredForRoles: [
      'foundation_admin', 'regional_coordinator', 'lead_moderator', 'moderator', 
      'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 
      'foster', 'trapper'
    ],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
  {
    type: 'location_sharing_consent',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    documentUrl: '/legal/consents/location-sharing-consent-2026-v1.0.pdf',
    summary: 'Consent for location sharing during field operations',
    requiredForRoles: [
      'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper'
    ],
    requiresResigning: false,
    legalJurisdiction: 'USA',
    lastReviewed: '2025-12-01',
    reviewedBy: 'legal@Mayday.org',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SIGNED AGREEMENTS
// ═══════════════════════════════════════════════════════════════════

export interface SignedAgreement {
  id: string;
  userId: UserId;
  agreementType: WaiverType;
  version: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  signatureData?: string;
  documentUrl?: string;
  audit: AuditMetadata;
}

export interface LegalAgreements {
  userId: UserId;
  agreements: SignedAgreement[];
  allRequiredSigned: boolean;
  missingAgreements: WaiverType[];
  outdatedAgreements: WaiverType[];
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// SOP ATTESTATION
// ═══════════════════════════════════════════════════════════════════

export interface SopAttestation {
  id: string;
  userId: UserId;
  sopId: string;
  sopVersion: string;
  attestedAt: string;
  attestationType: 'read' | 'trained' | 'assessed';
  assessmentScore?: number;
  assessmentPassed?: boolean;
  expiresAt?: string;
  audit: AuditMetadata;
}

export interface SopRequirement {
  sopId: string;
  sopTitle: string;
  sopVersion: string;
  requiredForRoles: RoleId[];
  attestationType: 'read' | 'trained' | 'assessed';
  validityDays?: number;
  assessmentPassingScore?: number;
}

export const SOP_REQUIREMENTS: SopRequirement[] = [
  {
    sopId: 'SOP-001',
    sopTitle: 'Initial Case Triage',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    attestationType: 'trained',
    validityDays: 90,
    assessmentPassingScore: 80,
  },
  {
    sopId: 'SOP-002',
    sopTitle: 'Potential Match Verification',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['moderator', 'lead_moderator'],
    attestationType: 'trained',
    validityDays: 90,
    assessmentPassingScore: 85,
  },
  {
    sopId: 'SOP-003',
    sopTitle: 'Volunteer Dispatch Protocol',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['moderator', 'lead_moderator'],
    attestationType: 'trained',
    validityDays: 90,
    assessmentPassingScore: 80,
  },
  {
    sopId: 'SOP-007',
    sopTitle: 'Deceased Animal Verification',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    attestationType: 'assessed',
    validityDays: 180,
    assessmentPassingScore: 90,
  },
  {
    sopId: 'SOP-008',
    sopTitle: 'Owner Verification Before Release',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['moderator', 'lead_moderator', 'regional_coordinator'],
    attestationType: 'assessed',
    validityDays: 90,
    assessmentPassingScore: 95,
  },
  {
    sopId: 'SOP-009',
    sopTitle: 'Field Volunteer Safety Protocol',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['moderator', 'lead_moderator'],
    attestationType: 'trained',
    validityDays: 90,
    assessmentPassingScore: 90,
  },
  {
    sopId: 'SOP-010',
    sopTitle: 'End-of-Shift Case Handoff',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    attestationType: 'trained',
    validityDays: 30,
    assessmentPassingScore: 80,
  },
  {
    sopId: 'SOP-011',
    sopTitle: 'Suspected Fraud Response',
    sopVersion: '2026-v1.0',
    requiredForRoles: ['moderator', 'lead_moderator', 'regional_coordinator'],
    attestationType: 'assessed',
    validityDays: 180,
    assessmentPassingScore: 90,
  },
];

// ═══════════════════════════════════════════════════════════════════
// CONSENT RECORDS
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationConsentRecord {
  id: string;
  userId: UserId;
  consentType: string;
  version: string;
  granted: boolean;
  grantedAt: string;
  ipAddress: string;
  expiresAt?: string;
  revokedAt?: string;
  details: Record<string, unknown>;
  audit: AuditMetadata;
}

export type ApplicationConsentType = 
  | 'marketing_emails'
  | 'sms_notifications'
  | 'location_sharing'
  | 'photo_release'
  | 'data_analytics'
  | 'third_party_sharing';

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get required agreements for a role
 */
export function getRequiredAgreements(roleId: RoleId): WaiverType[] {
  const required: WaiverType[] = [];
  
  for (const agreement of AGREEMENT_VERSIONS) {
    if (agreement.requiredForRoles.includes(roleId)) {
      required.push(agreement.type);
    }
  }
  
  return required;
}

/**
 * Get latest version of an agreement
 */
export function getLatestAgreementVersion(agreementType: WaiverType): AgreementVersion | undefined {
  return AGREEMENT_VERSIONS
    .filter(a => a.type === agreementType)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
}

/**
 * Check if user has valid agreement
 */
export function hasValidAgreement(
  userId: UserId,
  agreements: SignedAgreement[],
  agreementType: WaiverType
): boolean {
  const latestVersion = getLatestAgreementVersion(agreementType);
  if (!latestVersion) return false;
  
  const userAgreement = agreements.find(a => 
    a.userId === userId && 
    a.agreementType === agreementType &&
    a.version === latestVersion.version
  );
  
  return !!userAgreement;
}

/**
 * Get missing agreements for a user
 */
export function getMissingAgreements(
  userId: UserId,
  userRoles: RoleId[],
  signedAgreements: SignedAgreement[]
): WaiverType[] {
  const allRequired: WaiverType[] = [];
  
  // Get all required agreements for user's roles
  for (const role of userRoles) {
    const required = getRequiredAgreements(role);
    allRequired.push(...required);
  }
  
  // Remove duplicates
  const uniqueRequired = Array.from(new Set(allRequired));
  
  // Check which are missing
  return uniqueRequired.filter(type => 
    !hasValidAgreement(userId, signedAgreements, type)
  );
}

/**
 * Get outdated agreements that need resigning
 */
export function getOutdatedAgreements(
  userId: UserId,
  signedAgreements: SignedAgreement[]
): WaiverType[] {
  const outdated: WaiverType[] = [];
  
  for (const signed of signedAgreements) {
    if (signed.userId !== userId) continue;
    
    const latestVersion = getLatestAgreementVersion(signed.agreementType);
    if (!latestVersion) continue;
    
    // Check if user's version is outdated
    if (signed.version !== latestVersion.version && latestVersion.requiresResigning) {
      outdated.push(signed.agreementType);
    }
  }
  
  return outdated;
}

/**
 * Create signed agreement record
 */
export function createSignedAgreement(params: {
  userId: UserId;
  agreementType: WaiverType;
  ipAddress: string;
  userAgent: string;
  signatureData?: string;
}): SignedAgreement {
  const now = new Date().toISOString();
  const version = getLatestAgreementVersion(params.agreementType);
  
  if (!version) {
    throw new Error(`No version found for agreement type: ${params.agreementType}`);
  }
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    agreementType: params.agreementType,
    version: version.version,
    signedAt: now,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    signatureData: params.signatureData,
    documentUrl: version.documentUrl,
    audit: {
      createdAt: now,
      createdBy: params.userId,
      version: 1,
    },
  };
}

/**
 * Get SOP requirements for a role
 */
export function getSopRequirements(roleId: RoleId): SopRequirement[] {
  return SOP_REQUIREMENTS.filter(req => req.requiredForRoles.includes(roleId));
}

/**
 * Check if user has valid SOP attestation
 */
export function hasValidSopAttestation(
  userId: UserId,
  attestations: SopAttestation[],
  sopId: string
): boolean {
  const sop = SOP_REQUIREMENTS.find(req => req.sopId === sopId);
  if (!sop) return false;
  
  const attestation = attestations.find(a => 
    a.userId === userId &&
    a.sopId === sopId &&
    a.sopVersion === sop.sopVersion
  );
  
  if (!attestation) return false;
  
  // Check if expired
  if (sop.validityDays && attestation.expiresAt) {
    return new Date(attestation.expiresAt) > new Date();
  }
  
  // Check assessment passed if required
  if (sop.attestationType === 'assessed' && sop.assessmentPassingScore) {
    return attestation.assessmentPassed === true && 
           (attestation.assessmentScore ?? 0) >= sop.assessmentPassingScore;
  }
  
  return true;
}

/**
 * Get missing SOP attestations for a user
 */
export function getMissingSopAttestations(
  userId: UserId,
  roleId: RoleId,
  attestations: SopAttestation[]
): string[] {
  const requiredSops = getSopRequirements(roleId);
  
  return requiredSops
    .filter(sop => !hasValidSopAttestation(userId, attestations, sop.sopId))
    .map(sop => sop.sopId);
}

/**
 * Create SOP attestation record
 */
export function createSopAttestation(params: {
  userId: UserId;
  sopId: string;
  sopVersion: string;
  attestationType: 'read' | 'trained' | 'assessed';
  assessmentScore?: number;
}): SopAttestation {
  const now = new Date().toISOString();
  const sop = SOP_REQUIREMENTS.find(req => req.sopId === params.sopId);
  
  // Calculate expiration if applicable
  let expiresAt: string | undefined;
  if (sop?.validityDays) {
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + sop.validityDays);
    expiresAt = expiry.toISOString();
  }
  
  // Determine if assessment passed
  let assessmentPassed: boolean | undefined;
  if (params.attestationType === 'assessed' && sop?.assessmentPassingScore) {
    assessmentPassed = (params.assessmentScore ?? 0) >= sop.assessmentPassingScore;
  }
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    sopId: params.sopId,
    sopVersion: params.sopVersion,
    attestedAt: now,
    attestationType: params.attestationType,
    assessmentScore: params.assessmentScore,
    assessmentPassed,
    expiresAt,
    audit: {
      createdAt: now,
      createdBy: params.userId,
      version: 1,
    },
  };
}

/**
 * Create consent record
 */
export function createConsentRecord(params: {
  userId: UserId;
  consentType: ApplicationConsentType;
  granted: boolean;
  ipAddress: string;
  expiresAt?: string;
  details?: Record<string, unknown>;
}): ApplicationConsentRecord {
  const now = new Date().toISOString();
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    consentType: params.consentType,
    version: '2026-v1.0',
    granted: params.granted,
    grantedAt: now,
    ipAddress: params.ipAddress,
    expiresAt: params.expiresAt,
    details: params.details ?? {},
    audit: {
      createdAt: now,
      createdBy: params.userId,
      version: 1,
    },
  };
}

/**
 * Check if consent is valid
 */
export function isConsentValid(consent: ApplicationConsentRecord): boolean {
  if (consent.revokedAt) return false;
  if (consent.expiresAt && new Date(consent.expiresAt) <= new Date()) return false;
  return consent.granted;
}
