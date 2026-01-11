/**
 * ROLE HIERARCHY & PERMISSIONS SYSTEM
 * 
 * Defines all volunteer and staff roles for Pet911 operations.
 * Establishes clear chain of command, permissions, and accountability.
 * 
 * HIERARCHY (Top to Bottom):
 * ├── Foundation Staff (Terry/Ops)
 * ├── Regional Coordinator
 * ├── Lead Moderator
 * ├── Moderator
 * ├── Senior Volunteer (any type)
 * └── Volunteer (Transporter, Foster, Trapper, Community)
 */

// ═══════════════════════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export type RoleId =
  // Staff Roles
  | 'foundation_admin'      // Full system access
  | 'regional_coordinator'  // Multi-county oversight
  | 'sysop'                 // System operator: superuser access
  // Moderator Roles
  | 'lead_moderator'        // Can approve moderators, escalate to staff
  | 'moderator'             // Case triage, match verification, volunteer coordination
  | 'junior_moderator'      // Limited mod powers, training period
  // Volunteer Roles
  | 'senior_transporter'    // Experienced, can mentor
  | 'transporter'           // Animal transport
  | 'emergency_foster'      // Short-term emergency foster (24-72 hrs)
  | 'foster'                // Standard foster care
  | 'trapper'               // TNR and humane trapping
  | 'community_volunteer'   // General help, event support
  // Base Roles
  | 'verified_user'         // Verified account, can report
  | 'user';                 // Basic user

export type PermissionId =
  // Case Management
  | 'case.view'
  | 'case.create'
  | 'case.edit'
  | 'case.close'
  | 'case.escalate'
  | 'case.assign'
  | 'case.delete'
  // Match Management
  | 'match.view'
  | 'match.verify'
  | 'match.reject'
  | 'match.notify_owner'
  // Volunteer Management
  | 'volunteer.view'
  | 'volunteer.approve'
  | 'volunteer.suspend'
  | 'volunteer.dispatch'
  | 'volunteer.mentor'
  // Moderator Management
  | 'moderator.view'
  | 'moderator.approve'
  | 'moderator.suspend'
  | 'moderator.assign_cases'
  // Alert Management
  | 'alert.view'
  | 'alert.trigger_t1'
  | 'alert.trigger_t2'
  | 'alert.trigger_t3'
  | 'alert.trigger_t4'
  | 'alert.trigger_t5'
  // System Management
  | 'system.audit_view'
  | 'system.config_edit'
  | 'system.user_ban'
  | 'system.ip_blacklist'
  | 'system.sysop_access'
  // Sensitive Data
  | 'data.pii_view'
  | 'data.address_view'
  | 'data.contact_view'
  | 'data.export';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  level: number; // Higher = more authority
  category: 'staff' | 'moderator' | 'volunteer' | 'user';
  permissions: PermissionId[];
  canApprove: RoleId[]; // Which roles this role can approve applications for
  reportsTo: RoleId | null;
  requiresBackgroundCheck: boolean;
  requiresTraining: boolean;
  trainingModules?: string[];
  minAgeYears: number;
  autoExpireDays?: number; // Certification expiration
}

// ═══════════════════════════════════════════════════════════════════
// ROLE HIERARCHY DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  // ─────────────────────────────────────────────────────────────────
  // STAFF ROLES
  // ─────────────────────────────────────────────────────────────────
  foundation_admin: {
    id: 'foundation_admin',
    name: 'Foundation Administrator',
    description: 'Full system access. PROVENIQ Foundation staff only.',
    level: 100,
    category: 'staff',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.close', 'case.escalate', 'case.assign', 'case.delete',
      'match.view', 'match.verify', 'match.reject', 'match.notify_owner',
      'volunteer.view', 'volunteer.approve', 'volunteer.suspend', 'volunteer.dispatch', 'volunteer.mentor',
      'moderator.view', 'moderator.approve', 'moderator.suspend', 'moderator.assign_cases',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3', 'alert.trigger_t4', 'alert.trigger_t5',
      'system.audit_view', 'system.config_edit', 'system.user_ban', 'system.ip_blacklist',
      'data.pii_view', 'data.address_view', 'data.contact_view', 'data.export',
    ],
    canApprove: ['regional_coordinator', 'lead_moderator', 'moderator', 'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: null,
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['foundation_ops', 'crisis_management', 'legal_compliance'],
    minAgeYears: 21,
  },

  sysop: {
    id: 'sysop',
    name: 'System Operator (SYSOP)',
    description: 'Superuser access. Supersedes all volunteer and moderator roles.',
    level: 95,
    category: 'staff',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.close', 'case.escalate', 'case.assign', 'case.delete',
      'match.view', 'match.verify', 'match.reject', 'match.notify_owner',
      'volunteer.view', 'volunteer.approve', 'volunteer.suspend', 'volunteer.dispatch', 'volunteer.mentor',
      'moderator.view', 'moderator.approve', 'moderator.suspend', 'moderator.assign_cases',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3', 'alert.trigger_t4', 'alert.trigger_t5',
      'system.audit_view', 'system.config_edit', 'system.user_ban', 'system.ip_blacklist', 'system.sysop_access',
      'data.pii_view', 'data.address_view', 'data.contact_view', 'data.export',
    ],
    canApprove: ['regional_coordinator', 'lead_moderator', 'moderator', 'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'foundation_admin',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['sysop_training'],
    minAgeYears: 21,
  },

  regional_coordinator: {
    id: 'regional_coordinator',
    name: 'Regional Coordinator',
    description: 'Oversees multiple counties. Coordinates with shelters and municipal partners.',
    level: 90,
    category: 'staff',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.close', 'case.escalate', 'case.assign',
      'match.view', 'match.verify', 'match.reject', 'match.notify_owner',
      'volunteer.view', 'volunteer.approve', 'volunteer.suspend', 'volunteer.dispatch', 'volunteer.mentor',
      'moderator.view', 'moderator.approve', 'moderator.suspend', 'moderator.assign_cases',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3', 'alert.trigger_t4',
      'system.audit_view',
      'data.pii_view', 'data.address_view', 'data.contact_view',
    ],
    canApprove: ['lead_moderator', 'moderator', 'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'foundation_admin',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['coordinator_training', 'partner_relations', 'crisis_management'],
    minAgeYears: 21,
  },

  // ─────────────────────────────────────────────────────────────────
  // MODERATOR ROLES
  // ─────────────────────────────────────────────────────────────────
  lead_moderator: {
    id: 'lead_moderator',
    name: 'Lead Moderator',
    description: 'Senior moderator. Can approve other moderators and escalate to staff.',
    level: 80,
    category: 'moderator',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.close', 'case.escalate', 'case.assign',
      'match.view', 'match.verify', 'match.reject', 'match.notify_owner',
      'volunteer.view', 'volunteer.approve', 'volunteer.suspend', 'volunteer.dispatch', 'volunteer.mentor',
      'moderator.view', 'moderator.approve', 'moderator.assign_cases',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2', 'alert.trigger_t3',
      'system.audit_view',
      'data.pii_view', 'data.address_view', 'data.contact_view',
    ],
    canApprove: ['moderator', 'junior_moderator', 'senior_transporter', 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'regional_coordinator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['moderator_advanced', 'team_leadership', 'crisis_response'],
    minAgeYears: 21,
    autoExpireDays: 365,
  },

  moderator: {
    id: 'moderator',
    name: 'Moderator',
    description: 'Case triage, match verification, volunteer coordination. The backbone of operations.',
    level: 70,
    category: 'moderator',
    permissions: [
      'case.view', 'case.create', 'case.edit', 'case.close', 'case.escalate',
      'match.view', 'match.verify', 'match.reject', 'match.notify_owner',
      'volunteer.view', 'volunteer.approve', 'volunteer.dispatch',
      'alert.view', 'alert.trigger_t1', 'alert.trigger_t2',
      'data.address_view', 'data.contact_view',
    ],
    canApprove: ['junior_moderator', 'transporter', 'emergency_foster', 'foster', 'trapper', 'community_volunteer'],
    reportsTo: 'lead_moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['moderator_core', 'match_verification', 'volunteer_management'],
    minAgeYears: 18,
    autoExpireDays: 365,
  },

  junior_moderator: {
    id: 'junior_moderator',
    name: 'Junior Moderator',
    description: 'Moderator in training. Limited permissions, supervised by senior moderators.',
    level: 60,
    category: 'moderator',
    permissions: [
      'case.view', 'case.create', 'case.edit',
      'match.view',
      'volunteer.view',
      'alert.view', 'alert.trigger_t1',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['moderator_basics', 'case_triage'],
    minAgeYears: 18,
    autoExpireDays: 90, // Must complete training within 90 days
  },

  // ─────────────────────────────────────────────────────────────────
  // VOLUNTEER ROLES
  // ─────────────────────────────────────────────────────────────────
  senior_transporter: {
    id: 'senior_transporter',
    name: 'Senior Transporter',
    description: 'Experienced transporter. Can mentor new transporters and handle complex situations.',
    level: 50,
    category: 'volunteer',
    permissions: [
      'case.view',
      'volunteer.view', 'volunteer.mentor',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['transport_advanced', 'animal_handling', 'emergency_response'],
    minAgeYears: 21,
    autoExpireDays: 365,
  },

  transporter: {
    id: 'transporter',
    name: 'Transporter',
    description: 'Provides animal transport services between locations.',
    level: 40,
    category: 'volunteer',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'senior_transporter',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['transport_basics', 'vehicle_safety', 'animal_comfort'],
    minAgeYears: 18,
    autoExpireDays: 365,
  },

  emergency_foster: {
    id: 'emergency_foster',
    name: 'Emergency Foster',
    description: 'Provides short-term emergency foster care (24-72 hours).',
    level: 45,
    category: 'volunteer',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['foster_emergency', 'animal_first_aid', 'stress_recognition'],
    minAgeYears: 21,
    autoExpireDays: 365,
  },

  foster: {
    id: 'foster',
    name: 'Foster Care Provider',
    description: 'Provides temporary foster care for animals awaiting placement.',
    level: 40,
    category: 'volunteer',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['foster_basics', 'animal_care', 'medical_monitoring'],
    minAgeYears: 21,
    autoExpireDays: 365,
  },

  trapper: {
    id: 'trapper',
    name: 'Humane Trapper',
    description: 'Certified in humane trapping for TNR and lost pet recovery.',
    level: 45,
    category: 'volunteer',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: true,
    requiresTraining: true,
    trainingModules: ['humane_trapping', 'tnr_certification', 'animal_behavior'],
    minAgeYears: 18,
    autoExpireDays: 365,
  },

  community_volunteer: {
    id: 'community_volunteer',
    name: 'Community Volunteer',
    description: 'General volunteer for events, outreach, and community support.',
    level: 30,
    category: 'volunteer',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: 'moderator',
    requiresBackgroundCheck: false, // Not required for general help
    requiresTraining: true,
    trainingModules: ['volunteer_orientation'],
    minAgeYears: 16,
    autoExpireDays: 365,
  },

  // ─────────────────────────────────────────────────────────────────
  // BASE ROLES
  // ─────────────────────────────────────────────────────────────────
  verified_user: {
    id: 'verified_user',
    name: 'Verified User',
    description: 'Verified account. Can create reports and access community features.',
    level: 20,
    category: 'user',
    permissions: [
      'case.view', 'case.create',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: null,
    requiresBackgroundCheck: false,
    requiresTraining: false,
    minAgeYears: 13,
  },

  user: {
    id: 'user',
    name: 'User',
    description: 'Basic user. Can view public information and submit sightings.',
    level: 10,
    category: 'user',
    permissions: [
      'case.view',
      'alert.view',
    ],
    canApprove: [],
    reportsTo: null,
    requiresBackgroundCheck: false,
    requiresTraining: false,
    minAgeYears: 13,
  },
};

// ═══════════════════════════════════════════════════════════════════
// PERMISSION CHECKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleId: RoleId, permission: PermissionId): boolean {
  const role = ROLE_DEFINITIONS[roleId];
  return role?.permissions.includes(permission) ?? false;
}

/**
 * Check if a role can approve another role's application
 */
export function canApproveRole(approverRole: RoleId, applicantRole: RoleId): boolean {
  const approver = ROLE_DEFINITIONS[approverRole];
  return approver?.canApprove.includes(applicantRole) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleId: RoleId): PermissionId[] {
  return ROLE_DEFINITIONS[roleId]?.permissions ?? [];
}

/**
 * Get the reporting chain for a role
 */
export function getReportingChain(roleId: RoleId): RoleId[] {
  const chain: RoleId[] = [];
  let currentRoleId: RoleId | null = roleId;

  while (currentRoleId) {
    const currentDef: RoleDefinition | undefined = ROLE_DEFINITIONS[currentRoleId];
    if (currentDef?.reportsTo) {
      chain.push(currentDef.reportsTo);
      currentRoleId = currentDef.reportsTo;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Check if one role outranks another
 */
export function outranks(roleA: RoleId, roleB: RoleId): boolean {
  const levelA = ROLE_DEFINITIONS[roleA]?.level ?? 0;
  const levelB = ROLE_DEFINITIONS[roleB]?.level ?? 0;
  return levelA > levelB;
}

/**
 * Get all roles that a given role can manage
 */
export function getManageableRoles(roleId: RoleId): RoleId[] {
  const roleDef = ROLE_DEFINITIONS[roleId];
  if (!roleDef) return [];

  const roleLevel = roleDef.level;
  return (Object.keys(ROLE_DEFINITIONS) as RoleId[]).filter(
    r => ROLE_DEFINITIONS[r].level < roleLevel
  );
}
