/**
 * OPERATIONS MODULE - ROLE DEFINITIONS
 * 
 * Complete role hierarchy with permissions, approval chains,
 * requirements, and operational limits.
 * 
 * CRITICAL: No destructive delete permissions exist.
 * Use archive/redact/legal_hold instead.
 */

import type { IdentityAssuranceLevel, WaiverType } from '../types';

// ═══════════════════════════════════════════════════════════════════
// PERMISSION IDS
// ═══════════════════════════════════════════════════════════════════

export type PermissionId =
  // Case Management (NO DELETE - use archive/redact/legal_hold)
  | 'case.view'
  | 'case.view_sensitive'
  | 'case.create'
  | 'case.edit'
  | 'case.edit_own'
  | 'case.close'
  | 'case.reopen'
  | 'case.escalate'
  | 'case.deescalate'
  | 'case.assign'
  | 'case.reassign'
  | 'case.archive'              // Hide from default views, still matchable
  | 'case.unarchive'
  | 'case.cold_storage'         // Move to long-term storage, manual search only
  | 'case.redact_pii'           // Remove PII, keep structure
  | 'case.legal_hold'           // Freeze for legal preservation
  | 'case.legal_hold_release'
  // Match Management
  | 'match.view'
  | 'match.suggest'
  | 'match.verify'
  | 'match.reject'
  | 'match.notify_owner'
  | 'match.handle_deceased'     // Rainbow Bridge protocol
  // Owner Verification
  | 'verification.view'
  | 'verification.initiate'
  | 'verification.add_evidence'
  | 'verification.verify_evidence'
  | 'verification.administer_test'
  | 'verification.approve'
  | 'verification.reject'
  | 'verification.set_hold'
  | 'verification.clear_hold'   // Release animal - may require two-person
  | 'verification.escalate_dispute'
  | 'verification.resolve_dispute'
  // Volunteer Management
  | 'volunteer.view'
  | 'volunteer.view_sensitive'
  | 'volunteer.approve'
  | 'volunteer.suspend'         // Requires two-person approval
  | 'volunteer.revoke'          // Requires two-person approval
  | 'volunteer.reinstate'
  | 'volunteer.dispatch'
  | 'volunteer.mentor'
  | 'volunteer.assign_buddy'
  // Moderator Management
  | 'moderator.view'
  | 'moderator.approve'
  | 'moderator.suspend'
  | 'moderator.assign_cases'
  | 'moderator.manage_shifts'
  // Alert Management
  | 'alert.view'
  | 'alert.trigger_t1'          // Local/neighborhood
  | 'alert.trigger_t2'          // County-wide
  | 'alert.trigger_t3'          // Regional
  | 'alert.trigger_t4'          // State-wide - requires two-person
  | 'alert.trigger_t5'          // Emergency broadcast - requires two-person
  | 'alert.cancel'
  // Asset Management
  | 'asset.view'
  | 'asset.checkout'
  | 'asset.checkin'
  | 'asset.transfer'
  | 'asset.audit'
  | 'asset.manage'
  // Field Operations
  | 'field.view_operations'
  | 'field.start_operation'
  | 'field.checkin'
  | 'field.view_location'       // Requires consent + break-glass for others
  | 'field.escalate_safety'
  // System Management
  | 'system.audit_view'
  | 'system.audit_export'
  | 'system.config_view'
  | 'system.config_edit'
  | 'system.user_ban'
  | 'system.emergency_mode_activate'   // Requires two-person
  | 'system.emergency_mode_deactivate'
  | 'system.manage_regions'
  // Data Access (Break-Glass Protected)
  | 'data.pii_view'             // Requires break-glass
  | 'data.address_view'         // Requires break-glass
  | 'data.contact_view'         // Requires break-glass
  | 'data.export'
  | 'data.retention_manage'
  // Training Management
  | 'training.view'
  | 'training.complete_own'
  | 'training.manage_modules'
  | 'training.view_progress'
  | 'training.certify'
  // Governance
  | 'governance.view_sops'
  | 'governance.manage_sops'
  | 'governance.view_incidents'
  | 'governance.investigate_incidents'
  | 'governance.resolve_incidents'
  // Grievance/Whistleblower
  | 'grievance.submit'
  | 'grievance.view_own'
  | 'grievance.view_anonymous'  // Very restricted
  | 'grievance.investigate'
  | 'grievance.resolve';

// ═══════════════════════════════════════════════════════════════════
// ROLE IDS
// ═══════════════════════════════════════════════════════════════════

export type RoleId =
  // Staff Roles
  | 'foundation_admin'
  | 'regional_coordinator'
  // Moderator Roles
  | 'lead_moderator'
  | 'moderator'
  | 'junior_moderator'
  // Volunteer Roles
  | 'senior_transporter'
  | 'transporter'
  | 'emergency_foster'
  | 'foster'
  | 'trapper'
  | 'community_volunteer'
  // Base Roles
  | 'verified_user'
  | 'user';

export type RoleCategory = 'staff' | 'moderator' | 'volunteer' | 'user';

// ═══════════════════════════════════════════════════════════════════
// ROLE DEFINITION
// ═══════════════════════════════════════════════════════════════════

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  level: number;  // Higher = more authority (0-100)
  category: RoleCategory;
  
  // Permissions
  permissions: PermissionId[];
  
  // Approval chain
  canApprove: RoleId[];
  reportsTo: RoleId | null;
  
  // Requirements
  requiresBackgroundCheck: boolean;
  requiresInterview: boolean;
  requiresWaivers: WaiverType[];
  requiredIAL: IdentityAssuranceLevel;
  requires2FA: boolean;
  minAgeYears: number;
  
  // Training
  requiresTraining: boolean;
  trainingModules: string[];
  
  // Lifecycle
  autoExpireDays?: number;
  recertificationDays?: number;
  reapplicationCooldownDays?: number;
  
  // Operational limits
  maxActiveCases?: number;
  maxConcurrentDispatches?: number;
  maxShiftHours?: number;
  
  // Prerequisites
  prerequisites?: RoleId[];
  minimumTimeInPrereqDays?: number;
  
  // Display
  badgeColor: string;
  iconName: string;
}

// ═══════════════════════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  // ─────────────────────────────────────────────────────────────────
  // STAFF ROLES
  // ─────────────────────────────────────────────────────────────────
  foundation_admin: {
    id: 'foundation_admin',
    name: 'Foundation Administrator',
    description: 'Full system access. Final authority on all operational decisions.',
    level: 100,
    category: 'staff',
    permissions: [
      // All permissions
      'case.view', 'case.view_sensitive', 'case.create', 'case.edit', 'case.edit_own',
      'case.close', 'case.reopen', 'case.escalate', 'case.deescalate', 'case.assign',
      'case.reassign', 'case.archive', 'case.unarchive', 'case.cold_storage',
      'case.redact_pii', 'case.legal_hold', 'case.legal_hold_release',
      'match.view', 'match.suggest', 'match.verify', 'match.reject', 'match.notify_owner',
      'match.handle_deceased',
      'verification.view', 'verification.initiate', 'verification.add_evidence',
      'verification.verify_evidence', 'verification.administer_test', 'verification.approve',
      'verification.reject', 'verification.set_hold', 'verification.clear_hold',
      'verification.escalate_dispute', 'verification.resolve_dispute',
      'volunteer.view', 'volunteer.view_sensitive', 'volunteer.approve', 'volunteer.suspend',
      'volunteer.revoke', 'volunteer.reinstate', 'volunteer.dispatch', 'volunteer.mentor',
      'volunteer.assign_buddy',
      'moderator.view', 'moderator.approve', 'moderator.suspend', 'moderator.assign_cases',
      'moderator.manage_shifts',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3',
      'alert.trigger_t4', 'alert.trigger_t5', 'alert.cancel',
      'asset.view', 'asset.checkout', 'asset.checkin', 'asset.transfer', 'asset.audit',
      'asset.manage',
      'field.view_operations', 'field.start_operation', 'field.checkin', 'field.view_location',
      'field.escalate_safety',
      'system.audit_view', 'system.audit_export', 'system.config_view', 'system.config_edit',
      'system.user_ban', 'system.emergency_mode_activate', 'system.emergency_mode_deactivate',
      'system.manage_regions',
      'data.pii_view', 'data.address_view', 'data.contact_view', 'data.export',
      'data.retention_manage',
      'training.view', 'training.complete_own', 'training.manage_modules',
      'training.view_progress', 'training.certify',
      'governance.view_sops', 'governance.manage_sops', 'governance.view_incidents',
      'governance.investigate_incidents', 'governance.resolve_incidents',
      'grievance.submit', 'grievance.view_own', 'grievance.view_anonymous',
      'grievance.investigate', 'grievance.resolve',
    ],
    canApprove: ['regional_coordinator', 'lead_moderator', 'moderator', 'junior_moderator',
                 'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper',
                 'community_volunteer'],
    reportsTo: null,
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiredIAL: 'IAL3',
    requires2FA: true,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['admin_core', 'legal_compliance', 'crisis_management', 'all_sops'],
    badgeColor: '#7C3AED',
    iconName: 'Crown',
  },

  regional_coordinator: {
    id: 'regional_coordinator',
    name: 'Regional Coordinator',
    description: 'Manages operations for a geographic region. Oversees moderators and volunteers.',
    level: 90,
    category: 'staff',
    permissions: [
      'case.view', 'case.view_sensitive', 'case.create', 'case.edit', 'case.edit_own',
      'case.close', 'case.reopen', 'case.escalate', 'case.deescalate', 'case.assign',
      'case.reassign', 'case.archive', 'case.unarchive', 'case.cold_storage',
      'case.redact_pii', 'case.legal_hold', 'case.legal_hold_release',
      'match.view', 'match.suggest', 'match.verify', 'match.reject', 'match.notify_owner',
      'match.handle_deceased',
      'verification.view', 'verification.initiate', 'verification.add_evidence',
      'verification.verify_evidence', 'verification.administer_test', 'verification.approve',
      'verification.reject', 'verification.set_hold', 'verification.clear_hold',
      'verification.escalate_dispute', 'verification.resolve_dispute',
      'volunteer.view', 'volunteer.view_sensitive', 'volunteer.approve', 'volunteer.suspend',
      'volunteer.revoke', 'volunteer.reinstate', 'volunteer.dispatch', 'volunteer.mentor',
      'volunteer.assign_buddy',
      'moderator.view', 'moderator.approve', 'moderator.suspend', 'moderator.assign_cases',
      'moderator.manage_shifts',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3',
      'alert.trigger_t4', 'alert.trigger_t5', 'alert.cancel',
      'asset.view', 'asset.checkout', 'asset.checkin', 'asset.transfer', 'asset.audit',
      'field.view_operations', 'field.start_operation', 'field.checkin', 'field.view_location',
      'field.escalate_safety',
      'system.audit_view', 'system.emergency_mode_activate', 'system.emergency_mode_deactivate',
      'data.pii_view', 'data.address_view', 'data.contact_view', 'data.export',
      'training.view', 'training.complete_own', 'training.view_progress', 'training.certify',
      'governance.view_sops', 'governance.view_incidents', 'governance.investigate_incidents',
      'governance.resolve_incidents',
      'grievance.submit', 'grievance.view_own', 'grievance.investigate', 'grievance.resolve',
    ],
    canApprove: ['lead_moderator', 'moderator', 'junior_moderator', 'senior_transporter',
                 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'foundation_admin',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiredIAL: 'IAL2',
    requires2FA: true,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['coordinator_core', 'volunteer_management', 'crisis_response', 'all_sops'],
    recertificationDays: 365,
    badgeColor: '#2563EB',
    iconName: 'MapPin',
  },

  // ─────────────────────────────────────────────────────────────────
  // MODERATOR ROLES
  // ─────────────────────────────────────────────────────────────────
  lead_moderator: {
    id: 'lead_moderator',
    name: 'Lead Moderator',
    description: 'Senior moderator with authority to handle escalations, disputes, and sensitive cases.',
    level: 80,
    category: 'moderator',
    permissions: [
      'case.view', 'case.view_sensitive', 'case.create', 'case.edit', 'case.edit_own',
      'case.close', 'case.reopen', 'case.escalate', 'case.deescalate', 'case.assign',
      'case.reassign', 'case.archive',
      'match.view', 'match.suggest', 'match.verify', 'match.reject', 'match.notify_owner',
      'match.handle_deceased',
      'verification.view', 'verification.initiate', 'verification.add_evidence',
      'verification.verify_evidence', 'verification.administer_test', 'verification.approve',
      'verification.reject', 'verification.set_hold', 'verification.clear_hold',
      'verification.escalate_dispute', 'verification.resolve_dispute',
      'volunteer.view', 'volunteer.approve', 'volunteer.suspend', 'volunteer.reinstate',
      'volunteer.dispatch', 'volunteer.mentor', 'volunteer.assign_buddy',
      'moderator.view', 'moderator.assign_cases', 'moderator.manage_shifts',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3',
      'alert.trigger_t4', 'alert.cancel',
      'asset.view', 'asset.checkout', 'asset.checkin', 'asset.transfer',
      'field.view_operations', 'field.start_operation', 'field.checkin', 'field.view_location',
      'field.escalate_safety',
      'system.audit_view',
      'data.pii_view', 'data.address_view', 'data.contact_view',
      'training.view', 'training.complete_own', 'training.view_progress',
      'governance.view_sops', 'governance.view_incidents', 'governance.investigate_incidents',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: ['moderator', 'junior_moderator', 'senior_transporter', 'transporter',
                 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'regional_coordinator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiredIAL: 'IAL2',
    requires2FA: true,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['moderator_core', 'lead_moderator_advanced', 'dispute_resolution',
                     'rainbow_bridge_protocol', 'fraud_detection', 'all_sops'],
    prerequisites: ['moderator'],
    minimumTimeInPrereqDays: 90,
    recertificationDays: 180,
    maxActiveCases: 25,
    maxShiftHours: 10,
    badgeColor: '#DC2626',
    iconName: 'ShieldCheck',
  },

  moderator: {
    id: 'moderator',
    name: 'Moderator',
    description: 'Core case management and volunteer coordination. Handles standard verifications.',
    level: 70,
    category: 'moderator',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.edit_own', 'case.close',
      'case.escalate', 'case.assign', 'case.reassign',
      'match.view', 'match.suggest', 'match.verify', 'match.reject', 'match.notify_owner',
      'verification.view', 'verification.initiate', 'verification.add_evidence',
      'verification.verify_evidence', 'verification.administer_test', 'verification.approve',
      'verification.reject', 'verification.set_hold', 'verification.clear_hold',
      'verification.escalate_dispute',
      'volunteer.view', 'volunteer.dispatch', 'volunteer.mentor', 'volunteer.assign_buddy',
      'moderator.view',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3',
      'asset.view', 'asset.checkout', 'asset.checkin',
      'field.view_operations', 'field.start_operation', 'field.checkin', 'field.escalate_safety',
      'training.view', 'training.complete_own',
      'governance.view_sops', 'governance.view_incidents',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: ['junior_moderator', 'transporter', 'foster', 'community_volunteer'],
    reportsTo: 'lead_moderator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'nda_agreement', 'background_check_consent'],
    requiredIAL: 'IAL2',
    requires2FA: true,
    minAgeYears: 18,
    requiresTraining: true,
    trainingModules: ['moderator_core', 'match_verification', 'owner_verification',
                     'volunteer_coordination', 'safety_protocols'],
    prerequisites: ['junior_moderator'],
    minimumTimeInPrereqDays: 30,
    recertificationDays: 180,
    maxActiveCases: 15,
    maxShiftHours: 8,
    badgeColor: '#EA580C',
    iconName: 'Shield',
  },

  junior_moderator: {
    id: 'junior_moderator',
    name: 'Junior Moderator',
    description: 'Entry-level moderator. Handles basic triage and case updates under supervision.',
    level: 60,
    category: 'moderator',
    permissions: [
      'case.view', 'case.create', 'case.edit_own', 'case.escalate',
      'match.view', 'match.suggest',
      'verification.view', 'verification.add_evidence',
      'volunteer.view',
      'moderator.view',
      'alert.view', 'alert.trigger_t1',
      'asset.view',
      'field.view_operations', 'field.start_operation', 'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent'],
    requiredIAL: 'IAL1',
    requires2FA: true,
    minAgeYears: 18,
    requiresTraining: true,
    trainingModules: ['moderator_core', 'case_triage', 'communication_basics'],
    recertificationDays: 90,
    maxActiveCases: 8,
    maxShiftHours: 6,
    reapplicationCooldownDays: 90,
    badgeColor: '#F59E0B',
    iconName: 'ShieldQuestion',
  },

  // ─────────────────────────────────────────────────────────────────
  // VOLUNTEER ROLES
  // ─────────────────────────────────────────────────────────────────
  senior_transporter: {
    id: 'senior_transporter',
    name: 'Senior Transporter',
    description: 'Experienced transporter who can handle complex transports and mentor others.',
    level: 50,
    category: 'volunteer',
    permissions: [
      'case.view', 'case.edit_own',
      'volunteer.view', 'volunteer.mentor',
      'asset.view', 'asset.checkout', 'asset.checkin',
      'field.view_operations', 'field.start_operation', 'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: ['transporter'],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresWaivers: ['liability_waiver', 'vehicle_indemnification', 'background_check_consent',
                     'location_sharing_consent'],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['transporter_core', 'advanced_animal_handling', 'emergency_response'],
    prerequisites: ['transporter'],
    minimumTimeInPrereqDays: 60,
    recertificationDays: 365,
    maxConcurrentDispatches: 3,
    badgeColor: '#0891B2',
    iconName: 'Truck',
  },

  transporter: {
    id: 'transporter',
    name: 'Transporter',
    description: 'Provides animal transport between locations.',
    level: 40,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view',
      'asset.view', 'asset.checkout', 'asset.checkin',
      'field.view_operations', 'field.start_operation', 'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: false,
    requiresWaivers: ['liability_waiver', 'vehicle_indemnification', 'background_check_consent',
                     'location_sharing_consent'],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['transporter_core', 'animal_handling_basics', 'safety_protocols'],
    recertificationDays: 365,
    maxConcurrentDispatches: 2,
    reapplicationCooldownDays: 60,
    badgeColor: '#0D9488',
    iconName: 'Car',
  },

  emergency_foster: {
    id: 'emergency_foster',
    name: 'Emergency Foster',
    description: 'Provides immediate temporary housing in crisis situations.',
    level: 45,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view',
      'asset.view', 'asset.checkout', 'asset.checkin',
      'field.view_operations', 'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent', 'photo_consent'],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['foster_core', 'emergency_intake', 'basic_medical_care'],
    recertificationDays: 180,
    reapplicationCooldownDays: 30,
    badgeColor: '#DB2777',
    iconName: 'Heart',
  },

  foster: {
    id: 'foster',
    name: 'Foster',
    description: 'Provides temporary housing for animals awaiting placement.',
    level: 40,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view',
      'asset.view',
      'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent', 'photo_consent'],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 21,
    requiresTraining: true,
    trainingModules: ['foster_core', 'animal_care_basics'],
    recertificationDays: 365,
    reapplicationCooldownDays: 60,
    badgeColor: '#EC4899',
    iconName: 'Home',
  },

  trapper: {
    id: 'trapper',
    name: 'Trapper',
    description: 'Trained in humane trapping for difficult-to-catch animals.',
    level: 45,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view',
      'asset.view', 'asset.checkout', 'asset.checkin',
      'field.view_operations', 'field.start_operation', 'field.checkin',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresInterview: true,
    requiresWaivers: ['liability_waiver', 'background_check_consent', 'location_sharing_consent'],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 18,
    requiresTraining: true,
    trainingModules: ['trapper_core', 'humane_trapping', 'feral_animal_handling', 'safety_protocols'],
    recertificationDays: 180,
    reapplicationCooldownDays: 60,
    badgeColor: '#65A30D',
    iconName: 'Target',
  },

  community_volunteer: {
    id: 'community_volunteer',
    name: 'Community Volunteer',
    description: 'General volunteer for community outreach, flyering, and basic assistance.',
    level: 30,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view',
      'training.view', 'training.complete_own',
      'governance.view_sops',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresWaivers: ['liability_waiver'],
    requiredIAL: 'IAL0',
    requires2FA: false,
    minAgeYears: 16,
    requiresTraining: true,
    trainingModules: ['volunteer_orientation', 'community_outreach'],
    autoExpireDays: 365,
    reapplicationCooldownDays: 30,
    badgeColor: '#8B5CF6',
    iconName: 'Users',
  },

  // ─────────────────────────────────────────────────────────────────
  // BASE ROLES
  // ─────────────────────────────────────────────────────────────────
  verified_user: {
    id: 'verified_user',
    name: 'Verified User',
    description: 'User with verified identity who can report and claim animals.',
    level: 20,
    category: 'user',
    permissions: [
      'case.view', 'case.create',
      'verification.initiate', 'verification.add_evidence',
      'training.view',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: null,
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresWaivers: [],
    requiredIAL: 'IAL1',
    requires2FA: false,
    minAgeYears: 13,
    requiresTraining: false,
    trainingModules: [],
    badgeColor: '#6B7280',
    iconName: 'UserCheck',
  },

  user: {
    id: 'user',
    name: 'User',
    description: 'Basic registered user.',
    level: 10,
    category: 'user',
    permissions: [
      'case.view', 'case.create',
      'grievance.submit', 'grievance.view_own',
    ],
    canApprove: [],
    reportsTo: null,
    requiresBackgroundCheck: false,
    requiresInterview: false,
    requiresWaivers: [],
    requiredIAL: 'IAL0',
    requires2FA: false,
    minAgeYears: 13,
    requiresTraining: false,
    trainingModules: [],
    badgeColor: '#9CA3AF',
    iconName: 'User',
  },
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function getRoleDefinition(roleId: RoleId): RoleDefinition {
  return ROLE_DEFINITIONS[roleId];
}

export function getRolesByCategory(category: RoleCategory): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).filter(r => r.category === category);
}

export function getRoleLevel(roleId: RoleId): number {
  return ROLE_DEFINITIONS[roleId]?.level ?? 0;
}

export function outranks(roleA: RoleId, roleB: RoleId): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

export function getReportingChain(roleId: RoleId): RoleId[] {
  const chain: RoleId[] = [];
  let current: RoleId | null = roleId;
  
  while (current) {
    const def: RoleDefinition = ROLE_DEFINITIONS[current];
    if (def.reportsTo) {
      chain.push(def.reportsTo);
      current = def.reportsTo;
    } else {
      current = null;
    }
  }
  
  return chain;
}

export function canRoleApprove(approverRole: RoleId, targetRole: RoleId): boolean {
  const approverDef = ROLE_DEFINITIONS[approverRole];
  return approverDef.canApprove.includes(targetRole);
}

export function getRequiredWaivers(roleId: RoleId): WaiverType[] {
  return ROLE_DEFINITIONS[roleId]?.requiresWaivers ?? [];
}

export function getRequiredTrainingModules(roleId: RoleId): string[] {
  return ROLE_DEFINITIONS[roleId]?.trainingModules ?? [];
}
