/**
 * OPERATIONS MODULE - APPLICATION REQUIREMENTS
 * 
 * Role-specific requirements and validation logic.
 */

import type { UserId, IdentityAssuranceLevel, WaiverType } from '../types';
import type { RoleId } from '../roles';
import type { ApplicationData, RequirementType } from './types';

// ═══════════════════════════════════════════════════════════════════
// ROLE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════

export interface RoleRequirement {
  roleId: RoleId;
  minAge: number;
  maxAge?: number;
  requiredIAL: IdentityAssuranceLevel;
  requiresBackgroundCheck: boolean;
  requiresInterview: boolean;
  requiresReferences: boolean;
  requiresWaivers: WaiverType[];
  requiresTraining: boolean;
  requiredTrainingModules: string[];
  prerequisites: RoleId[];
  minimumTimeInPrereqDays: number;
  autoExpireDays?: number;
  recertificationDays?: number;
  reapplicationCooldownDays: number;
  description: string;
}

export const ROLE_REQUIREMENTS: RoleRequirement[] = [
  // Staff Roles
  {
    roleId: 'foundation_admin',
    minAge: 25,
    requiredIAL: 'IAL3',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['admin_basics', 'legal_compliance', 'emergency_procedures'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 90,
    description: 'Foundation administrator with full system access',
  },
  {
    roleId: 'regional_coordinator',
    minAge: 21,
    requiredIAL: 'IAL2',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['regional_coordination', 'volunteer_management', 'crisis_response'],
    prerequisites: ['lead_moderator'],
    minimumTimeInPrereqDays: 90,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 60,
    description: 'Regional coordinator managing multiple areas',
  },
  
  // Moderator Roles
  {
    roleId: 'lead_moderator',
    minAge: 21,
    requiredIAL: 'IAL2',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['moderation_basics', 'case_triage', 'owner_verification', 'safety_protocols'],
    prerequisites: ['moderator'],
    minimumTimeInPrereqDays: 60,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 60,
    description: 'Lead moderator with escalation authority',
  },
  {
    roleId: 'moderator',
    minAge: 18,
    requiredIAL: 'IAL2',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['moderation_basics', 'case_triage', 'safety_protocols'],
    prerequisites: ['junior_moderator'],
    minimumTimeInPrereqDays: 30,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'Full moderator with case management authority',
  },
  {
    roleId: 'junior_moderator',
    minAge: 18,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresReferences: false,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['moderation_basics', 'safety_protocols'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 180,
    recertificationDays: 90,
    reapplicationCooldownDays: 30,
    description: 'Junior moderator in training',
  },
  
  // Volunteer Roles
  {
    roleId: 'senior_transporter',
    minAge: 21,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: ['liability_waiver', 'vehicle_indemnification', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['transport_basics', 'animal_handling', 'emergency_response'],
    prerequisites: ['transporter'],
    minimumTimeInPrereqDays: 30,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'Senior transporter with additional capabilities',
  },
  {
    roleId: 'transporter',
    minAge: 18,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: ['liability_waiver', 'vehicle_indemnification', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['transport_basics', 'animal_handling'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'Animal transport volunteer',
  },
  {
    roleId: 'emergency_foster',
    minAge: 21,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['foster_basics', 'animal_care', 'medical_basics'],
    prerequisites: ['foster'],
    minimumTimeInPrereqDays: 60,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'Emergency foster for critical cases',
  },
  {
    roleId: 'foster',
    minAge: 18,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['foster_basics', 'animal_care'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'Animal foster parent',
  },
  {
    roleId: 'trapper',
    minAge: 18,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiresTraining: true,
    requiredTrainingModules: ['tnr_basics', 'feral_cat_handling', 'safety_protocols'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 365,
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    description: 'TNR (Trap-Neuter-Return) specialist',
  },
  {
    roleId: 'community_volunteer',
    minAge: 16,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: ['liability_waiver'],
    requiresTraining: true,
    requiredTrainingModules: ['volunteer_basics', 'safety_protocols'],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 365,
    recertificationDays: 365,
    reapplicationCooldownDays: 30,
    description: 'General community volunteer',
  },
  
  // Base Roles
  {
    roleId: 'verified_user',
    minAge: 16,
    requiredIAL: 'IAL1',
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: [],
    requiresTraining: false,
    requiredTrainingModules: [],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 9999, // Never expires
    recertificationDays: 9999,
    reapplicationCooldownDays: 0,
    description: 'Verified platform user',
  },
  {
    roleId: 'user',
    minAge: 13,
    requiredIAL: 'IAL0',
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresReferences: false,
    requiresWaivers: [],
    requiresTraining: false,
    requiredTrainingModules: [],
    prerequisites: [],
    minimumTimeInPrereqDays: 0,
    autoExpireDays: 9999, // Never expires
    recertificationDays: 9999,
    reapplicationCooldownDays: 0,
    description: 'Basic platform user',
  },
];

// ═══════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
}

export function validateApplication(
  roleId: RoleId,
  data: ApplicationData,
  currentRoles: RoleId[] = []
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const requirement = ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
  if (!requirement) {
    errors.push({
      field: 'roleId',
      code: 'INVALID_ROLE',
      message: 'Invalid role specified',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }
  
  // Age validation
  const age = calculateAge(data.personalInfo.dateOfBirth);
  if (age < requirement.minAge) {
    errors.push({
      field: 'personalInfo.dateOfBirth',
      code: 'MIN_AGE_NOT_MET',
      message: `Must be at least ${requirement.minAge} years old`,
      severity: 'error',
    });
  }
  
  if (requirement.maxAge && age > requirement.maxAge) {
    errors.push({
      field: 'personalInfo.dateOfBirth',
      code: 'MAX_AGE_EXCEEDED',
      message: `Must be under ${requirement.maxAge} years old`,
      severity: 'error',
    });
  }
  
  // Background check requirement
  if (requirement.requiresBackgroundCheck && !data.consents.backgroundCheckConsent) {
    errors.push({
      field: 'consents.backgroundCheckConsent',
      code: 'BACKGROUND_CHECK_CONSENT_REQUIRED',
      message: 'Background check consent is required for this role',
      severity: 'error',
    });
  }
  
  // Vehicle requirements for transport roles
  if (roleId === 'transporter' || roleId === 'senior_transporter') {
    if (!data.equipment.hasVehicle) {
      errors.push({
        field: 'equipment.hasVehicle',
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle is required for transport roles',
        severity: 'error',
      });
    }
    
    if (!data.equipment.hasInsurance) {
      errors.push({
        field: 'equipment.hasInsurance',
        code: 'INSURANCE_REQUIRED',
        message: 'Vehicle insurance is required for transport roles',
        severity: 'error',
      });
    }
  }
  
  // Foster home requirements
  if (roleId === 'foster' || roleId === 'emergency_foster') {
    if (!data.contactInfo.address) {
      errors.push({
        field: 'contactInfo.address',
        code: 'ADDRESS_REQUIRED',
        message: 'Home address is required for foster roles',
        severity: 'error',
      });
    }
  }
  
  // Prerequisite validation
  if (requirement.prerequisites.length > 0) {
    const hasPrerequisites = requirement.prerequisites.every(prereq => 
      currentRoles.includes(prereq)
    );
    
    if (!hasPrerequisites) {
      errors.push({
        field: 'roleId',
        code: 'PREREQUISITES_NOT_MET',
        message: `Requires prerequisite roles: ${requirement.prerequisites.join(', ')}`,
        severity: 'error',
      });
    }
  }
  
  // Experience validation for senior roles
  if (roleId === 'senior_transporter' || roleId === 'emergency_foster') {
    if (data.experience.yearsAnimalExperience < 1) {
      warnings.push({
        field: 'experience.yearsAnimalExperience',
        code: 'LIMITED_EXPERIENCE',
        message: 'Limited animal experience may affect approval',
      });
    }
  }
  
  // Reference validation for roles requiring them
  if (requirement.requiresReferences && data.references.length < 2) {
    errors.push({
      field: 'references',
      code: 'INSUFFICIENT_REFERENCES',
      message: 'At least 2 references are required',
      severity: 'error',
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateWaivers(
  roleId: RoleId,
  signedWaivers: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const requirement = ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
  if (!requirement) {
    return { valid: false, errors: [], warnings: [] };
  }
  
  for (const requiredWaiver of requirement.requiresWaivers) {
    if (!signedWaivers.includes(requiredWaiver)) {
      errors.push({
        field: 'waivers',
        code: 'WAIVER_NOT_SIGNED',
        message: `${requiredWaiver} must be signed`,
        severity: 'error',
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function canReapply(
  roleId: RoleId,
  lastApplicationDate?: string,
  lastStatus?: string
): { canApply: boolean; reason?: string } {
  const requirement = ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
  if (!requirement) {
    return { canApply: false, reason: 'Invalid role' };
  }
  
  if (lastStatus === 'rejected') {
    // Check if rejection was temporary or permanent
    const permanentRejectionReasons = ['safety_concerns', 'failed_background_check'];
    if (permanentRejectionReasons.includes(lastStatus as string)) {
      return { canApply: false, reason: 'Permanent rejection - cannot reapply' };
    }
  }
  
  if (!lastApplicationDate) {
    return { canApply: true };
  }
  
  const daysSinceLastApplication = Math.floor(
    (Date.now() - new Date(lastApplicationDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastApplication < requirement.reapplicationCooldownDays) {
    return {
      canApply: false,
      reason: `Must wait ${requirement.reapplicationCooldownDays - daysSinceLastApplication} more days before reapplying`,
    };
  }
  
  return { canApply: true };
}

export function getRequiredWaivers(roleId: RoleId): WaiverType[] {
  const requirement = ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
  return requirement?.requiresWaivers ?? [];
}

export function getRequiredTraining(roleId: RoleId): string[] {
  const requirement = ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
  return requirement?.requiredTrainingModules ?? [];
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function getRoleRequirement(roleId: RoleId): RoleRequirement | undefined {
  return ROLE_REQUIREMENTS.find(r => r.roleId === roleId);
}

export function isRoleAvailable(roleId: RoleId, regionId?: string): boolean {
  // This would check if the role is accepting applications
  // Could be based on region, current volunteer count, etc.
  return true; // Default to available
}
