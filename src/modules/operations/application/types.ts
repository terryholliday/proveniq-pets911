/**
 * OPERATIONS MODULE - APPLICATION TYPES
 * 
 * Volunteer application workflow types and interfaces.
 */

import type { 
  UserId, WaiverType, IdentityAssuranceLevel,
  AuditMetadata, ConfidenceLevel, VerificationStatus 
} from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION STATUS
// ═══════════════════════════════════════════════════════════════════

export type ApplicationStatus = 
  | 'draft'           // User started but not submitted
  | 'submitted'       // Submitted for review
  | 'under_review'    // Being processed
  | 'background_check' // Background check in progress
  | 'interview_scheduled' // Interview pending
  | 'interview_completed' // Interview done, awaiting decision
  | 'approved'        // Approved, ready for onboarding
  | 'rejected'        // Rejected with reason
  | 'withdrawn'       // User withdrew
  | 'expired';        // Timed out

export type RejectionReason = 
  | 'incomplete_application'
  | 'failed_background_check'
  | 'failed_interview'
  | 'insufficient_experience'
  | 'safety_concerns'
  | 'reference_check_failed'
  | 'identity_not_verified'
  | 'waivers_not_signed'
  | 'region_not_available'
  | 'role_not_available'
  | 'duplicate_application'
  | 'other';

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER APPLICATION
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerApplication {
  id: string;
  userId: UserId;
  appliedForRoleId: RoleId;
  status: ApplicationStatus;
  
  // Timeline
  submittedAt: string;
  lastUpdated: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  
  // Review
  reviewedBy?: UserId;
  reviewerNotes?: string;
  rejectionReason?: RejectionReason;
  
  // Background check
  backgroundCheckStatus: ApplicationBackgroundCheckStatus;
  backgroundCheckInitiatedAt?: string;
  backgroundCheckCompletedAt?: string;
  backgroundCheckVendor?: string;
  backgroundCheckReference?: string;
  
  // Interview
  interviewScheduledAt?: string;
  interviewCompletedAt?: string;
  interviewConductedBy?: UserId;
  interviewNotes?: string;
  interviewScore?: number; // 0-100
  
  // Requirements
  requirementsMet: RequirementStatus[];
  missingRequirements: RequirementType[];
  
  // Legal
  agreements: ApplicationSignedAgreement[];
  
  // Data
  applicationData: ApplicationData;
  
  // Audit
  audit: AuditMetadata;
}

export type ApplicationBackgroundCheckStatus = 
  | 'not_required'
  | 'not_started'
  | 'initiated'
  | 'pending'
  | 'cleared'
  | 'failed'
  | 'error';

export interface RequirementStatus {
  type: RequirementType;
  status: 'pending' | 'met' | 'failed' | 'waived';
  metAt?: string;
  notes?: string;
}

export type RequirementType = 
  | 'age_verification'
  | 'identity_verification'
  | 'background_check'
  | 'interview'
  | 'reference_check'
  | 'training_completion'
  | 'waivers_signed'
  | 'regional_availability';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION DATA
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationData {
  // Personal info
  personalInfo: ApplicationPersonalInfo;
  
  // Contact info
  contactInfo: ApplicationContactInfo;
  
  // Availability
  availability: ApplicationAvailabilityInfo;
  
  // Experience
  experience: ApplicationExperienceInfo;
  
  // Equipment
  equipment: ApplicationEquipmentInfo;
  
  // Preferences
  preferences: ApplicationPreferenceInfo;
  
  // References
  references: ApplicationReferenceInfo[];
  
  // Emergency contact
  emergencyContact: ApplicationEmergencyContactInfo;
  
  // Consent
  consents: ApplicationConsentInfo;
}

export interface ApplicationPersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssnLast4?: string; // For background check only
  driverLicenseNumber?: string; // For transport roles
  driverLicenseState?: string;
}

export interface ApplicationContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
  };
}

export interface ApplicationAvailabilityInfo {
  // General availability
  availableWeekdays: boolean;
  availableWeekends: boolean;
  availableEvenings: boolean;
  availableNights: boolean;
  
  // Specific hours
  typicalAvailability: {
    weekdays: { start: string; end: string }[];
    weekends: { start: string; end: string }[];
  };
  
  // Response times
  canRespondWithin15Min: boolean;
  canRespondWithin30Min: boolean;
  canRespondWithin1Hour: boolean;
  
  // Restrictions
  hasBlackoutDates: boolean;
  blackoutDates?: { start: string; end: string; reason?: string }[];
}

export interface ApplicationExperienceInfo {
  // Animal experience
  hasAnimalExperience: boolean;
  yearsAnimalExperience: number;
  animalTypesHandled: string[];
  
  // Volunteer experience
  hasVolunteerExperience: boolean;
  volunteerOrganizations: string[];
  volunteerRoles: string[];
  yearsVolunteerExperience: number;
  
  // Professional experience
  hasRelevantProfessionalExperience: boolean;
  profession?: string;
  yearsProfessionalExperience: number;
  
  // Specific experience
  hasTnrExperience: boolean;
  hasFosterExperience: boolean;
  hasTransportExperience: boolean;
  hasMedicalExperience: boolean;
  hasBehaviorExperience: boolean;
  
  // Certifications
  certifications: ApplicationCertification[];
}

export interface ApplicationCertification {
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface ApplicationEquipmentInfo {
  // Vehicle (for transport roles)
  hasVehicle: boolean;
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'van' | 'minivan';
  vehicleYear?: number;
  hasInsurance: boolean;
  insuranceExpiry?: string;
  
  // Animal equipment
  hasCrates: boolean;
  crateSizes: string[];
  hasLeashes: boolean;
  hasMuzzles: boolean;
  hasGloves: boolean;
  hasFirstAidKit: boolean;
  
  // Specialized equipment
  hasTraps: boolean;
  trapTypes: string[];
  hasTrailCamera: boolean;
  hasNet: boolean;
}

export interface ApplicationPreferenceInfo {
  // Preferred roles
  preferredRoles: RoleId[];
  willingToBeBackup: boolean;
  
  // Species preferences
  speciesWillingToHelp: string[];
  speciesNotWillingToHelp: string[];
  
  // Task preferences
  willingToTransport: boolean;
  willingToFoster: boolean;
  willingToTrap: boolean;
  willingToDoHomeChecks: boolean;
  willingToDoAdmin: boolean;
  
  // Location preferences
  maxDistanceFromHome: number; // miles
  preferredRegions: string[];
  avoidedRegions: string[];
}

export interface ApplicationReferenceInfo {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  knownFor: string;
  canContact: boolean;
  contacted?: boolean;
  contactResult?: string;
}

export interface ApplicationEmergencyContactInfo {
  name: string;
  relationship: string;
  primaryPhone: string;
  alternatePhone?: string;
  address?: string;
}

export interface ApplicationConsentInfo {
  backgroundCheckConsent: boolean;
  backgroundCheckConsentAt?: string;
  photoReleaseConsent: boolean;
  photoReleaseConsentAt?: string;
  communicationConsent: boolean;
  communicationConsentAt?: string;
  locationSharingConsent: boolean;
  locationSharingConsentAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SIGNED AGREEMENTS
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationSignedAgreement {
  agreementType: WaiverType;
  version: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  signatureData?: string;
  documentUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION WORKFLOW
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationWorkflow {
  applicationId: string;
  currentStep: ApplicationStep;
  completedSteps: ApplicationStep[];
  nextAction?: string;
  dueAt?: string;
}

export type ApplicationStep = 
  | 'initial_submission'
  | 'identity_verification'
  | 'background_check'
  | 'reference_checks'
  | 'interview'
  | 'final_review'
  | 'approval'
  | 'onboarding'
  | 'rejection';

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function createVolunteerApplication(params: {
  userId: UserId;
  roleId: RoleId;
  data: ApplicationData;
}): VolunteerApplication {
  const now = new Date().toISOString();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to complete
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    appliedForRoleId: params.roleId,
    status: 'submitted',
    submittedAt: now,
    lastUpdated: now,
    expiresAt: expiresAt.toISOString(),
    backgroundCheckStatus: 'not_started',
    requirementsMet: [],
    missingRequirements: [],
    agreements: [],
    applicationData: params.data,
    audit: {
      createdAt: now,
      createdBy: params.userId,
      version: 1,
    },
  };
}

export function canTransitionStatus(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    draft: ['submitted', 'withdrawn'],
    submitted: ['under_review', 'withdrawn', 'expired'],
    under_review: ['background_check', 'interview_scheduled', 'approved', 'rejected', 'withdrawn'],
    background_check: ['interview_scheduled', 'approved', 'rejected', 'withdrawn'],
    interview_scheduled: ['interview_completed', 'rejected', 'withdrawn'],
    interview_completed: ['approved', 'rejected', 'withdrawn'],
    approved: [], // Terminal state
    rejected: [], // Terminal state
    withdrawn: [], // Terminal state
    expired: [], // Terminal state
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}

export function isApplicationExpired(application: VolunteerApplication): boolean {
  if (!application.expiresAt) return false;
  return new Date(application.expiresAt) <= new Date();
}

export function getMissingRequirements(application: VolunteerApplication): RequirementType[] {
  const missing: RequirementType[] = [];
  const roleRequirements = getRoleRequirements(application.appliedForRoleId);
  
  for (const requirement of roleRequirements) {
    const status = application.requirementsMet.find(r => r.type === requirement);
    if (!status || status.status !== 'met') {
      missing.push(requirement);
    }
  }
  
  return missing;
}

export function getRoleRequirements(roleId: RoleId): RequirementType[] {
  const requirements: Record<RoleId, RequirementType[]> = {
    foundation_admin: ['age_verification', 'identity_verification', 'background_check', 'interview'],
    regional_coordinator: ['age_verification', 'identity_verification', 'background_check', 'interview'],
    lead_moderator: ['age_verification', 'identity_verification', 'background_check', 'interview'],
    moderator: ['age_verification', 'identity_verification', 'background_check', 'interview'],
    junior_moderator: ['age_verification', 'identity_verification', 'background_check', 'interview'],
    senior_transporter: ['age_verification', 'identity_verification', 'background_check', 'waivers_signed'],
    transporter: ['age_verification', 'identity_verification', 'background_check', 'waivers_signed'],
    emergency_foster: ['age_verification', 'identity_verification', 'background_check', 'waivers_signed'],
    foster: ['age_verification', 'identity_verification', 'background_check', 'waivers_signed'],
    trapper: ['age_verification', 'identity_verification', 'background_check', 'waivers_signed'],
    community_volunteer: ['age_verification', 'identity_verification'],
    verified_user: ['age_verification'],
    user: [],
  };
  
  return requirements[roleId] ?? [];
}
