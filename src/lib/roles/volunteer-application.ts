/**
 * VOLUNTEER APPLICATION SYSTEM
 * 
 * Application workflow for all volunteer roles:
 * - Moderators
 * - Transporters
 * - Emergency Fosters
 * - Fosters
 * - Trappers
 * - Community Volunteers
 */

import type { RoleId } from './role-hierarchy';
import type { County, Species } from '../types';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION TYPES
// ═══════════════════════════════════════════════════════════════════

export type ApplicationStatus =
  | 'DRAFT'              // Started but not submitted
  | 'SUBMITTED'          // Awaiting review
  | 'UNDER_REVIEW'       // Being reviewed by approver
  | 'PENDING_BACKGROUND' // Awaiting background check
  | 'PENDING_TRAINING'   // Approved, awaiting training completion
  | 'PENDING_INTERVIEW'  // Requires interview (moderators)
  | 'APPROVED'           // Fully approved
  | 'REJECTED'           // Application rejected
  | 'WITHDRAWN';         // Applicant withdrew

export type RejectionReason =
  | 'INCOMPLETE_APPLICATION'
  | 'FAILED_BACKGROUND_CHECK'
  | 'FAILED_INTERVIEW'
  | 'FAILED_TRAINING'
  | 'INSUFFICIENT_AVAILABILITY'
  | 'GEOGRAPHIC_COVERAGE'
  | 'AGE_REQUIREMENT'
  | 'REFERENCES_NOT_VERIFIED'
  | 'PREVIOUS_VIOLATION'
  | 'OTHER';

export interface VolunteerApplication {
  id: string;
  userId: string;
  roleAppliedFor: RoleId;
  status: ApplicationStatus;
  
  // Personal Information
  personalInfo: PersonalInfo;
  
  // Role-Specific Information
  roleSpecificInfo: RoleSpecificInfo;
  
  // Availability
  availability: AvailabilityInfo;
  
  // References
  references: Reference[];
  
  // Background Check
  backgroundCheck: BackgroundCheckInfo | null;
  
  // Interview (for moderators)
  interview: InterviewInfo | null;
  
  // Training Progress
  trainingProgress: TrainingProgress;
  
  // Review History
  reviewHistory: ReviewEvent[];
  
  // Timestamps
  createdAt: string;
  submittedAt: string | null;
  lastUpdatedAt: string;
  decidedAt: string | null;
  
  // Decision
  decision: ApplicationDecision | null;
}

export interface PersonalInfo {
  legalName: string;
  displayName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: County;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Additional
  driversLicense: boolean;
  driversLicenseState?: string;
  hasReliableTransportation: boolean;
  
  // Agreements
  agreedToCodeOfConduct: boolean;
  agreedToBackgroundCheck: boolean;
  agreedToTerms: boolean;
  signatureDate: string;
}

export interface RoleSpecificInfo {
  // Moderator-specific
  moderatorExperience?: string;
  animalWelfareExperience?: string;
  crisisManagementExperience?: string;
  hoursAvailablePerWeek?: number;
  preferredShifts?: ('morning' | 'afternoon' | 'evening' | 'overnight')[];
  
  // Transporter-specific
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'van' | 'minivan';
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  hasCarrierOrCrate?: boolean;
  maxAnimalSize?: 'small' | 'medium' | 'large' | 'xlarge';
  maxTransportDistance?: number; // miles
  canTransportMultiple?: boolean;
  
  // Foster-specific
  homeType?: 'house' | 'apartment' | 'condo' | 'mobile_home' | 'farm';
  hasYard?: boolean;
  yardFenced?: boolean;
  fenceHeight?: number; // feet
  hasOtherPets?: boolean;
  otherPetsDescription?: string;
  hasChildren?: boolean;
  childrenAges?: string;
  speciesCanFoster?: Species[];
  maxFosterCount?: number;
  fosterExperience?: string;
  
  // Trapper-specific
  trappingExperience?: string;
  ownTraps?: boolean;
  trapTypes?: string[];
  tnrCertified?: boolean;
  tnrCertificationDate?: string;
  willingToTrapAtNight?: boolean;
  
  // Common
  specialSkills?: string;
  languages?: string[];
  relevantCertifications?: string[];
  whyVolunteer?: string;
  howDidYouHear?: string;
}

export interface AvailabilityInfo {
  weekdayMornings: boolean;
  weekdayAfternoons: boolean;
  weekdayEvenings: boolean;
  weekdayNights: boolean;
  weekendMornings: boolean;
  weekendAfternoons: boolean;
  weekendEvenings: boolean;
  weekendNights: boolean;
  
  // Specific days
  availableDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  
  // Response time
  canRespondWithin30Min: boolean;
  canRespondWithin1Hour: boolean;
  canRespondWithin2Hours: boolean;
  
  // Coverage area
  serviceCities: string[];
  serviceCounties: County[];
  maxTravelRadius: number; // miles
  
  // Restrictions
  availabilityNotes?: string;
  blackoutDates?: string[];
}

export interface Reference {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  yearsKnown: number;
  
  // Verification
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
}

export interface BackgroundCheckInfo {
  provider: string;
  requestedAt: string;
  completedAt: string | null;
  status: 'pending' | 'clear' | 'flagged' | 'failed';
  reportId: string | null;
  notes: string | null;
  validUntil: string | null;
}

export interface InterviewInfo {
  scheduledAt: string | null;
  conductedAt: string | null;
  interviewerId: string | null;
  interviewerName: string | null;
  format: 'video' | 'phone' | 'in_person';
  duration: number | null; // minutes
  score: number | null; // 0-100
  notes: string | null;
  recommendation: 'strong_approve' | 'approve' | 'conditional' | 'reject' | null;
}

export interface TrainingProgress {
  assignedModules: string[];
  completedModules: {
    moduleId: string;
    completedAt: string;
    score: number;
  }[];
  currentModule: string | null;
  overallProgress: number; // 0-100
}

export interface ReviewEvent {
  id: string;
  timestamp: string;
  reviewerId: string;
  reviewerName: string;
  action: 'viewed' | 'commented' | 'requested_info' | 'approved_step' | 'rejected' | 'approved';
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  notes: string;
}

export interface ApplicationDecision {
  decision: 'approved' | 'rejected';
  decidedBy: string;
  decidedByName: string;
  decidedAt: string;
  reason: string;
  rejectionReason?: RejectionReason;
  conditions?: string[];
  expiresAt?: string; // For conditional approvals
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION REQUIREMENTS BY ROLE
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationRequirements {
  roleId: RoleId;
  minimumAge: number;
  requiresBackgroundCheck: boolean;
  requiresInterview: boolean;
  requiresReferences: boolean;
  minimumReferences: number;
  requiredDocuments: string[];
  requiredTraining: string[];
  estimatedProcessingDays: number;
}

export const APPLICATION_REQUIREMENTS: Record<RoleId, ApplicationRequirements> = {
  foundation_admin: {
    roleId: 'foundation_admin',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    minimumReferences: 3,
    requiredDocuments: ['government_id', 'proof_of_address'],
    requiredTraining: ['foundation_ops', 'crisis_management', 'legal_compliance'],
    estimatedProcessingDays: 30,
  },
  regional_coordinator: {
    roleId: 'regional_coordinator',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    minimumReferences: 3,
    requiredDocuments: ['government_id', 'proof_of_address'],
    requiredTraining: ['coordinator_training', 'partner_relations', 'crisis_management'],
    estimatedProcessingDays: 21,
  },
  lead_moderator: {
    roleId: 'lead_moderator',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    minimumReferences: 2,
    requiredDocuments: ['government_id'],
    requiredTraining: ['moderator_advanced', 'team_leadership', 'crisis_response'],
    estimatedProcessingDays: 14,
  },
  moderator: {
    roleId: 'moderator',
    minimumAge: 18,
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    minimumReferences: 2,
    requiredDocuments: ['government_id'],
    requiredTraining: ['moderator_core', 'match_verification', 'volunteer_management'],
    estimatedProcessingDays: 10,
  },
  junior_moderator: {
    roleId: 'junior_moderator',
    minimumAge: 18,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 1,
    requiredDocuments: ['government_id'],
    requiredTraining: ['moderator_basics', 'case_triage'],
    estimatedProcessingDays: 7,
  },
  senior_transporter: {
    roleId: 'senior_transporter',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 2,
    requiredDocuments: ['government_id', 'drivers_license', 'vehicle_insurance'],
    requiredTraining: ['transport_advanced', 'animal_handling', 'emergency_response'],
    estimatedProcessingDays: 10,
  },
  transporter: {
    roleId: 'transporter',
    minimumAge: 18,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 1,
    requiredDocuments: ['government_id', 'drivers_license', 'vehicle_insurance'],
    requiredTraining: ['transport_basics', 'vehicle_safety', 'animal_comfort'],
    estimatedProcessingDays: 7,
  },
  emergency_foster: {
    roleId: 'emergency_foster',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 2,
    requiredDocuments: ['government_id', 'proof_of_residence'],
    requiredTraining: ['foster_emergency', 'animal_first_aid', 'stress_recognition'],
    estimatedProcessingDays: 10,
  },
  foster: {
    roleId: 'foster',
    minimumAge: 21,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 2,
    requiredDocuments: ['government_id', 'proof_of_residence'],
    requiredTraining: ['foster_basics', 'animal_care', 'medical_monitoring'],
    estimatedProcessingDays: 10,
  },
  trapper: {
    roleId: 'trapper',
    minimumAge: 18,
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    minimumReferences: 1,
    requiredDocuments: ['government_id'],
    requiredTraining: ['humane_trapping', 'tnr_certification', 'animal_behavior'],
    estimatedProcessingDays: 14,
  },
  community_volunteer: {
    roleId: 'community_volunteer',
    minimumAge: 16,
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    minimumReferences: 0,
    requiredDocuments: [],
    requiredTraining: ['volunteer_orientation'],
    estimatedProcessingDays: 3,
  },
  verified_user: {
    roleId: 'verified_user',
    minimumAge: 13,
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    minimumReferences: 0,
    requiredDocuments: [],
    requiredTraining: [],
    estimatedProcessingDays: 1,
  },
  user: {
    roleId: 'user',
    minimumAge: 13,
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    minimumReferences: 0,
    requiredDocuments: [],
    requiredTraining: [],
    estimatedProcessingDays: 0,
  },
};

// ═══════════════════════════════════════════════════════════════════
// APPLICATION WORKFLOW
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new application
 */
export function createApplication(
  userId: string,
  roleAppliedFor: RoleId
): VolunteerApplication {
  return {
    id: crypto.randomUUID(),
    userId,
    roleAppliedFor,
    status: 'DRAFT',
    personalInfo: {} as PersonalInfo,
    roleSpecificInfo: {},
    availability: {} as AvailabilityInfo,
    references: [],
    backgroundCheck: null,
    interview: null,
    trainingProgress: {
      assignedModules: [],
      completedModules: [],
      currentModule: null,
      overallProgress: 0,
    },
    reviewHistory: [],
    createdAt: new Date().toISOString(),
    submittedAt: null,
    lastUpdatedAt: new Date().toISOString(),
    decidedAt: null,
    decision: null,
  };
}

/**
 * Validate application is complete enough to submit
 */
export function validateApplication(
  application: VolunteerApplication
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requirements = APPLICATION_REQUIREMENTS[application.roleAppliedFor];

  // Check personal info
  if (!application.personalInfo.legalName) errors.push('Legal name is required');
  if (!application.personalInfo.email) errors.push('Email is required');
  if (!application.personalInfo.phone) errors.push('Phone is required');
  if (!application.personalInfo.streetAddress) errors.push('Address is required');
  if (!application.personalInfo.emergencyContactName) errors.push('Emergency contact is required');

  // Check age
  if (application.personalInfo.dateOfBirth) {
    const age = calculateAge(application.personalInfo.dateOfBirth);
    if (age < requirements.minimumAge) {
      errors.push(`Must be at least ${requirements.minimumAge} years old`);
    }
  } else {
    errors.push('Date of birth is required');
  }

  // Check references
  if (requirements.requiresReferences) {
    if (application.references.length < requirements.minimumReferences) {
      errors.push(`At least ${requirements.minimumReferences} reference(s) required`);
    }
  }

  // Check agreements
  if (!application.personalInfo.agreedToCodeOfConduct) {
    errors.push('Must agree to Code of Conduct');
  }
  if (!application.personalInfo.agreedToTerms) {
    errors.push('Must agree to Terms of Service');
  }
  if (requirements.requiresBackgroundCheck && !application.personalInfo.agreedToBackgroundCheck) {
    errors.push('Must agree to background check');
  }

  // Role-specific validations
  if (['transporter', 'senior_transporter'].includes(application.roleAppliedFor)) {
    if (!application.roleSpecificInfo.vehicleType) {
      errors.push('Vehicle information is required');
    }
    if (!application.personalInfo.driversLicense) {
      errors.push('Valid driver\'s license is required');
    }
  }

  if (['foster', 'emergency_foster'].includes(application.roleAppliedFor)) {
    if (!application.roleSpecificInfo.homeType) {
      errors.push('Home information is required');
    }
    if (!application.roleSpecificInfo.speciesCanFoster?.length) {
      errors.push('Must specify which species you can foster');
    }
  }

  if (application.roleAppliedFor === 'trapper') {
    if (!application.roleSpecificInfo.trappingExperience) {
      errors.push('Trapping experience is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Submit application for review
 */
export function submitApplication(
  application: VolunteerApplication
): VolunteerApplication {
  const validation = validateApplication(application);
  if (!validation.valid) {
    throw new Error(`Cannot submit: ${validation.errors.join(', ')}`);
  }

  return {
    ...application,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    reviewHistory: [
      ...application.reviewHistory,
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        reviewerId: application.userId,
        reviewerName: application.personalInfo.displayName || application.personalInfo.legalName,
        action: 'approved_step',
        previousStatus: application.status,
        newStatus: 'SUBMITTED',
        notes: 'Application submitted for review',
      },
    ],
  };
}

/**
 * Get next step in application process
 */
export function getNextStep(
  application: VolunteerApplication
): { step: string; description: string; action: string } {
  const requirements = APPLICATION_REQUIREMENTS[application.roleAppliedFor];

  switch (application.status) {
    case 'DRAFT':
      return {
        step: 'Complete Application',
        description: 'Fill out all required sections',
        action: 'Continue editing application',
      };

    case 'SUBMITTED':
      return {
        step: 'Under Review',
        description: 'Your application is being reviewed',
        action: 'Wait for reviewer feedback',
      };

    case 'UNDER_REVIEW':
      if (requirements.requiresBackgroundCheck && !application.backgroundCheck) {
        return {
          step: 'Background Check',
          description: 'Background check needs to be initiated',
          action: 'Reviewer will initiate background check',
        };
      }
      if (requirements.requiresInterview && !application.interview?.conductedAt) {
        return {
          step: 'Interview',
          description: 'Interview needs to be scheduled',
          action: 'Wait for interview invitation',
        };
      }
      return {
        step: 'Final Review',
        description: 'Application is in final review',
        action: 'Wait for decision',
      };

    case 'PENDING_BACKGROUND':
      return {
        step: 'Background Check',
        description: 'Waiting for background check results',
        action: 'Results typically take 3-5 business days',
      };

    case 'PENDING_INTERVIEW':
      return {
        step: 'Interview',
        description: 'Interview scheduled',
        action: `Interview on ${application.interview?.scheduledAt || 'TBD'}`,
      };

    case 'PENDING_TRAINING':
      const incomplete = requirements.requiredTraining.filter(
        t => !application.trainingProgress.completedModules.some(c => c.moduleId === t)
      );
      return {
        step: 'Complete Training',
        description: `${incomplete.length} training module(s) remaining`,
        action: 'Complete required training modules',
      };

    case 'APPROVED':
      return {
        step: 'Approved',
        description: 'Your application has been approved!',
        action: 'You can now start volunteering',
      };

    case 'REJECTED':
      return {
        step: 'Rejected',
        description: application.decision?.reason || 'Application was not approved',
        action: 'You may reapply after addressing the feedback',
      };

    case 'WITHDRAWN':
      return {
        step: 'Withdrawn',
        description: 'You withdrew your application',
        action: 'You may submit a new application',
      };

    default:
      return {
        step: 'Unknown',
        description: 'Application status unknown',
        action: 'Contact support',
      };
  }
}

/**
 * Record a review action
 */
export function recordReviewAction(
  application: VolunteerApplication,
  reviewerId: string,
  reviewerName: string,
  action: ReviewEvent['action'],
  newStatus: ApplicationStatus,
  notes: string
): VolunteerApplication {
  const reviewEvent: ReviewEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    reviewerId,
    reviewerName,
    action,
    previousStatus: application.status,
    newStatus,
    notes,
  };

  return {
    ...application,
    status: newStatus,
    lastUpdatedAt: new Date().toISOString(),
    reviewHistory: [...application.reviewHistory, reviewEvent],
  };
}

/**
 * Approve application
 */
export function approveApplication(
  application: VolunteerApplication,
  approverId: string,
  approverName: string,
  conditions?: string[]
): VolunteerApplication {
  const decision: ApplicationDecision = {
    decision: 'approved',
    decidedBy: approverId,
    decidedByName: approverName,
    decidedAt: new Date().toISOString(),
    reason: 'Application meets all requirements',
    conditions,
  };

  return recordReviewAction(
    {
      ...application,
      decision,
      decidedAt: new Date().toISOString(),
    },
    approverId,
    approverName,
    'approved',
    'APPROVED',
    conditions ? `Approved with conditions: ${conditions.join(', ')}` : 'Approved'
  );
}

/**
 * Reject application
 */
export function rejectApplication(
  application: VolunteerApplication,
  rejecterId: string,
  rejecterName: string,
  reason: RejectionReason,
  details: string
): VolunteerApplication {
  const decision: ApplicationDecision = {
    decision: 'rejected',
    decidedBy: rejecterId,
    decidedByName: rejecterName,
    decidedAt: new Date().toISOString(),
    reason: details,
    rejectionReason: reason,
  };

  return recordReviewAction(
    {
      ...application,
      decision,
      decidedAt: new Date().toISOString(),
    },
    rejecterId,
    rejecterName,
    'rejected',
    'REJECTED',
    `Rejected: ${reason} - ${details}`
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get application progress percentage
 */
export function getApplicationProgress(application: VolunteerApplication): number {
  let progress = 0;
  const totalSections = 5;

  // Personal info (20%)
  if (application.personalInfo.legalName && application.personalInfo.email && application.personalInfo.phone) {
    progress += 20;
  }

  // Role-specific info (20%)
  if (Object.keys(application.roleSpecificInfo).length > 0) {
    progress += 20;
  }

  // Availability (20%)
  if (application.availability.availableDays?.length > 0) {
    progress += 20;
  }

  // References (20%)
  const requirements = APPLICATION_REQUIREMENTS[application.roleAppliedFor];
  if (!requirements.requiresReferences || application.references.length >= requirements.minimumReferences) {
    progress += 20;
  }

  // Agreements (20%)
  if (application.personalInfo.agreedToCodeOfConduct && application.personalInfo.agreedToTerms) {
    progress += 20;
  }

  return progress;
}
