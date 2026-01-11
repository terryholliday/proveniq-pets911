/**
 * OPERATIONS MODULE - ROLE ASSIGNMENTS
 * 
 * Manages multi-role user assignments with scope limitations,
 * suspension tracking, and conflict detection.
 */

import type { UserId, RegionId, ActiveStatus, AuditMetadata, Result } from '../types';
import type { RoleId, PermissionId, RoleDefinition } from './definitions';
import { ROLE_DEFINITIONS, getRoleLevel } from './definitions';

// ═══════════════════════════════════════════════════════════════════
// USER ROLE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

export interface UserRoleAssignment {
  id: string;
  userId: UserId;
  roleId: RoleId;
  status: ActiveStatus;
  isPrimary: boolean;
  
  // Grant info
  grantedAt: string;
  grantedBy: UserId;
  grantReason?: string;
  applicationId?: string;
  
  // Scope limitations
  regionIds?: RegionId[];
  partnerOrgIds?: string[];
  countyRestrictions?: string[];
  
  // Suspension info (if suspended)
  suspendedAt?: string;
  suspendedBy?: UserId;
  suspensionReason?: string;
  suspensionEndsAt?: string;
  suspensionApprovers?: { userId: UserId; approvedAt: string }[];
  
  // Expiration
  expiresAt?: string;
  lastRenewedAt?: string;
  renewalReminderSentAt?: string;
  
  // Revocation info (if revoked)
  revokedAt?: string;
  revokedBy?: UserId;
  revocationReason?: string;
  revocationApprovers?: { userId: UserId; approvedAt: string }[];
  permanentBan?: boolean;
  
  // Metadata
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// USER ROLE SET (Aggregated view)
// ═══════════════════════════════════════════════════════════════════

export interface UserRoleSet {
  userId: UserId;
  roles: UserRoleAssignment[];
  effectivePermissions: PermissionId[];
  highestRole: RoleId;
  highestRoleLevel: number;
  primaryRole: RoleId | null;
  lastComputedAt: string;
  
  // Status summary
  hasActiveRoles: boolean;
  hasSuspendedRoles: boolean;
  hasExpiredRoles: boolean;
  
  // Pending actions
  pendingRenewals: { roleId: RoleId; expiresAt: string }[];
  pendingRetraining: { roleId: RoleId; trainingModuleId: string }[];
}

// ═══════════════════════════════════════════════════════════════════
// ROLE CONFLICTS
// ═══════════════════════════════════════════════════════════════════

export interface RoleConflict {
  roleA: RoleId;
  roleB: RoleId;
  conflictType: 'redundant' | 'incompatible' | 'requires_approval';
  reason: string;
  resolution?: 'keep_higher' | 'keep_lower' | 'requires_manual' | 'block';
}

export const ROLE_CONFLICTS: RoleConflict[] = [
  // Redundant hierarchies
  {
    roleA: 'lead_moderator',
    roleB: 'moderator',
    conflictType: 'redundant',
    reason: 'Lead moderator supersedes standard moderator',
    resolution: 'keep_higher',
  },
  {
    roleA: 'lead_moderator',
    roleB: 'junior_moderator',
    conflictType: 'redundant',
    reason: 'Lead moderator supersedes junior moderator',
    resolution: 'keep_higher',
  },
  {
    roleA: 'moderator',
    roleB: 'junior_moderator',
    conflictType: 'redundant',
    reason: 'Moderator supersedes junior moderator',
    resolution: 'keep_higher',
  },
  {
    roleA: 'senior_transporter',
    roleB: 'transporter',
    conflictType: 'redundant',
    reason: 'Senior transporter supersedes standard transporter',
    resolution: 'keep_higher',
  },
  // Potentially incompatible (separation of duties)
  {
    roleA: 'foundation_admin',
    roleB: 'trapper',
    conflictType: 'requires_approval',
    reason: 'Field roles may conflict with admin oversight duties',
    resolution: 'requires_manual',
  },
];

// ═══════════════════════════════════════════════════════════════════
// ASSIGNMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if adding a role would create a conflict
 */
export function checkRoleConflict(
  existingRoles: RoleId[],
  newRole: RoleId
): RoleConflict | null {
  for (const existing of existingRoles) {
    const conflict = ROLE_CONFLICTS.find(
      c => (c.roleA === existing && c.roleB === newRole) ||
           (c.roleA === newRole && c.roleB === existing)
    );
    if (conflict) return conflict;
  }
  return null;
}

/**
 * Get all effective permissions from a set of role assignments
 */
export function getEffectivePermissions(assignments: UserRoleAssignment[]): PermissionId[] {
  const permissionSet = new Set<PermissionId>();
  
  for (const assignment of assignments) {
    if (assignment.status !== 'active') continue;
    
    const roleDef = ROLE_DEFINITIONS[assignment.roleId];
    if (!roleDef) continue;
    
    for (const permission of roleDef.permissions) {
      permissionSet.add(permission);
    }
  }
  
  return Array.from(permissionSet);
}

/**
 * Find the highest active role from assignments
 */
export function getHighestRole(assignments: UserRoleAssignment[]): RoleId | null {
  let highest: RoleId | null = null;
  let highestLevel = -1;
  
  for (const assignment of assignments) {
    if (assignment.status !== 'active') continue;
    
    const level = getRoleLevel(assignment.roleId);
    if (level > highestLevel) {
      highestLevel = level;
      highest = assignment.roleId;
    }
  }
  
  return highest;
}

/**
 * Get the primary role from assignments
 */
export function getPrimaryRole(assignments: UserRoleAssignment[]): RoleId | null {
  const primary = assignments.find(a => a.isPrimary && a.status === 'active');
  return primary?.roleId ?? null;
}

/**
 * Build a complete UserRoleSet from assignments
 */
export function buildUserRoleSet(userId: UserId, assignments: UserRoleAssignment[]): UserRoleSet {
  const activeAssignments = assignments.filter(a => a.status === 'active');
  const effectivePermissions = getEffectivePermissions(assignments);
  const highestRole = getHighestRole(assignments);
  const primaryRole = getPrimaryRole(assignments);
  
  // Check for pending renewals (expiring in next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const pendingRenewals = activeAssignments
    .filter(a => a.expiresAt && new Date(a.expiresAt) <= thirtyDaysFromNow)
    .map(a => ({ roleId: a.roleId, expiresAt: a.expiresAt! }));
  
  return {
    userId,
    roles: assignments,
    effectivePermissions,
    highestRole: highestRole ?? 'user',
    highestRoleLevel: highestRole ? getRoleLevel(highestRole) : 0,
    primaryRole,
    lastComputedAt: new Date().toISOString(),
    hasActiveRoles: activeAssignments.length > 0,
    hasSuspendedRoles: assignments.some(a => a.status === 'suspended'),
    hasExpiredRoles: assignments.some(a => a.status === 'expired'),
    pendingRenewals,
    pendingRetraining: [], // Would be populated from training module
  };
}

// ═══════════════════════════════════════════════════════════════════
// ASSIGNMENT VALIDATION
// ═══════════════════════════════════════════════════════════════════

export interface AssignmentValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blockers: string[];
}

/**
 * Validate a role assignment before granting
 */
export function validateRoleAssignment(params: {
  userId: UserId;
  roleId: RoleId;
  grantedBy: UserId;
  existingAssignments: UserRoleAssignment[];
  userProfile: {
    age: number;
    ial: string;
    has2FA: boolean;
    signedWaivers: string[];
    completedTraining: string[];
    backgroundCheckStatus?: 'pending' | 'passed' | 'failed' | 'expired';
    interviewCompleted?: boolean;
  };
  granterRoles: RoleId[];
}): AssignmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];
  
  const roleDef = ROLE_DEFINITIONS[params.roleId];
  if (!roleDef) {
    blockers.push(`Unknown role: ${params.roleId}`);
    return { valid: false, errors, warnings, blockers };
  }
  
  // Check if granter can approve this role
  const canApprove = params.granterRoles.some(gr => {
    const granterDef = ROLE_DEFINITIONS[gr];
    return granterDef?.canApprove.includes(params.roleId);
  });
  if (!canApprove) {
    blockers.push(`Granter does not have permission to approve ${params.roleId}`);
  }
  
  // Check minimum age
  if (params.userProfile.age < roleDef.minAgeYears) {
    blockers.push(`Minimum age ${roleDef.minAgeYears} not met (user is ${params.userProfile.age})`);
  }
  
  // Check IAL requirement
  const ialLevels = ['IAL0', 'IAL1', 'IAL2', 'IAL3'];
  const requiredIalIndex = ialLevels.indexOf(roleDef.requiredIAL);
  const userIalIndex = ialLevels.indexOf(params.userProfile.ial);
  if (userIalIndex < requiredIalIndex) {
    blockers.push(`Identity assurance level ${roleDef.requiredIAL} required (user has ${params.userProfile.ial})`);
  }
  
  // Check 2FA requirement
  if (roleDef.requires2FA && !params.userProfile.has2FA) {
    blockers.push('Two-factor authentication required for this role');
  }
  
  // Check background check
  if (roleDef.requiresBackgroundCheck) {
    if (!params.userProfile.backgroundCheckStatus) {
      blockers.push('Background check required but not initiated');
    } else if (params.userProfile.backgroundCheckStatus === 'pending') {
      blockers.push('Background check still pending');
    } else if (params.userProfile.backgroundCheckStatus === 'failed') {
      blockers.push('Background check failed');
    } else if (params.userProfile.backgroundCheckStatus === 'expired') {
      warnings.push('Background check expired - renewal may be required');
    }
  }
  
  // Check interview
  if (roleDef.requiresInterview && !params.userProfile.interviewCompleted) {
    blockers.push('Interview required but not completed');
  }
  
  // Check waivers
  const missingWaivers = roleDef.requiresWaivers.filter(
    w => !params.userProfile.signedWaivers.includes(w)
  );
  if (missingWaivers.length > 0) {
    blockers.push(`Missing required waivers: ${missingWaivers.join(', ')}`);
  }
  
  // Check training
  if (roleDef.requiresTraining) {
    const missingTraining = roleDef.trainingModules.filter(
      t => !params.userProfile.completedTraining.includes(t)
    );
    if (missingTraining.length > 0) {
      blockers.push(`Missing required training: ${missingTraining.join(', ')}`);
    }
  }
  
  // Check prerequisites
  if (roleDef.prerequisites && roleDef.prerequisites.length > 0) {
    const hasPrereq = params.existingAssignments.some(
      a => roleDef.prerequisites!.includes(a.roleId) && a.status === 'active'
    );
    if (!hasPrereq) {
      blockers.push(`Prerequisite role required: ${roleDef.prerequisites.join(' or ')}`);
    }
    
    // Check minimum time in prerequisite
    if (roleDef.minimumTimeInPrereqDays && hasPrereq) {
      const prereqAssignment = params.existingAssignments.find(
        a => roleDef.prerequisites!.includes(a.roleId) && a.status === 'active'
      );
      if (prereqAssignment) {
        const daysInPrereq = Math.floor(
          (Date.now() - new Date(prereqAssignment.grantedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysInPrereq < roleDef.minimumTimeInPrereqDays) {
          blockers.push(
            `Must hold prerequisite role for ${roleDef.minimumTimeInPrereqDays} days ` +
            `(currently ${daysInPrereq} days)`
          );
        }
      }
    }
  }
  
  // Check for conflicts
  const existingRoleIds = params.existingAssignments
    .filter(a => a.status === 'active')
    .map(a => a.roleId);
  const conflict = checkRoleConflict(existingRoleIds, params.roleId);
  if (conflict) {
    if (conflict.resolution === 'block') {
      blockers.push(`Role conflict: ${conflict.reason}`);
    } else if (conflict.resolution === 'requires_manual') {
      warnings.push(`Role conflict requires review: ${conflict.reason}`);
    } else {
      warnings.push(`Role conflict (${conflict.conflictType}): ${conflict.reason}`);
    }
  }
  
  // Check reapplication cooldown
  const previousAssignment = params.existingAssignments.find(
    a => a.roleId === params.roleId && (a.status === 'revoked' || a.status === 'expired')
  );
  if (previousAssignment && roleDef.reapplicationCooldownDays) {
    const revokedAt = previousAssignment.revokedAt || previousAssignment.expiresAt;
    if (revokedAt) {
      const daysSinceRevoked = Math.floor(
        (Date.now() - new Date(revokedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceRevoked < roleDef.reapplicationCooldownDays) {
        const daysRemaining = roleDef.reapplicationCooldownDays - daysSinceRevoked;
        blockers.push(`Reapplication cooldown: ${daysRemaining} days remaining`);
      }
    }
  }
  
  return {
    valid: blockers.length === 0,
    errors,
    warnings,
    blockers,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ASSIGNMENT ACTIONS
// ═══════════════════════════════════════════════════════════════════

export interface AssignRoleParams {
  userId: UserId;
  roleId: RoleId;
  grantedBy: UserId;
  isPrimary?: boolean;
  regionIds?: RegionId[];
  grantReason?: string;
  applicationId?: string;
  expiresAt?: string;
}

export interface SuspendRoleParams {
  assignmentId: string;
  suspendedBy: UserId;
  reason: string;
  endsAt?: string;
  twoPersonApproval: { approver1: UserId; approver2: UserId };
}

export interface RevokeRoleParams {
  assignmentId: string;
  revokedBy: UserId;
  reason: string;
  permanentBan?: boolean;
  twoPersonApproval: { approver1: UserId; approver2: UserId };
}

/**
 * Create a new role assignment
 */
export function createRoleAssignment(params: AssignRoleParams): UserRoleAssignment {
  const now = new Date().toISOString();
  const roleDef = ROLE_DEFINITIONS[params.roleId];
  
  // Calculate expiration if role has auto-expire
  let expiresAt = params.expiresAt;
  if (!expiresAt && roleDef.autoExpireDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + roleDef.autoExpireDays);
    expiresAt = expiry.toISOString();
  }
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    roleId: params.roleId,
    status: 'active',
    isPrimary: params.isPrimary ?? false,
    grantedAt: now,
    grantedBy: params.grantedBy,
    grantReason: params.grantReason,
    applicationId: params.applicationId,
    regionIds: params.regionIds,
    expiresAt,
    audit: {
      createdAt: now,
      createdBy: params.grantedBy,
      version: 1,
    },
  };
}

/**
 * Suspend a role assignment (requires two-person approval)
 */
export function suspendRoleAssignment(
  assignment: UserRoleAssignment,
  params: SuspendRoleParams
): UserRoleAssignment {
  const now = new Date().toISOString();
  
  return {
    ...assignment,
    status: 'suspended',
    suspendedAt: now,
    suspendedBy: params.suspendedBy,
    suspensionReason: params.reason,
    suspensionEndsAt: params.endsAt,
    suspensionApprovers: [
      { userId: params.twoPersonApproval.approver1, approvedAt: now },
      { userId: params.twoPersonApproval.approver2, approvedAt: now },
    ],
    audit: {
      ...assignment.audit,
      updatedAt: now,
      updatedBy: params.suspendedBy,
      version: assignment.audit.version + 1,
    },
  };
}

/**
 * Revoke a role assignment (requires two-person approval)
 */
export function revokeRoleAssignment(
  assignment: UserRoleAssignment,
  params: RevokeRoleParams
): UserRoleAssignment {
  const now = new Date().toISOString();
  
  return {
    ...assignment,
    status: 'revoked',
    revokedAt: now,
    revokedBy: params.revokedBy,
    revocationReason: params.reason,
    permanentBan: params.permanentBan,
    revocationApprovers: [
      { userId: params.twoPersonApproval.approver1, approvedAt: now },
      { userId: params.twoPersonApproval.approver2, approvedAt: now },
    ],
    audit: {
      ...assignment.audit,
      updatedAt: now,
      updatedBy: params.revokedBy,
      version: assignment.audit.version + 1,
    },
  };
}

/**
 * Reinstate a suspended role assignment
 */
export function reinstateRoleAssignment(
  assignment: UserRoleAssignment,
  reinstatedBy: UserId,
  notes?: string
): UserRoleAssignment {
  if (assignment.status !== 'suspended') {
    throw new Error('Can only reinstate suspended assignments');
  }
  
  const now = new Date().toISOString();
  
  return {
    ...assignment,
    status: 'active',
    suspendedAt: undefined,
    suspendedBy: undefined,
    suspensionReason: undefined,
    suspensionEndsAt: undefined,
    audit: {
      ...assignment.audit,
      updatedAt: now,
      updatedBy: reinstatedBy,
      version: assignment.audit.version + 1,
    },
  };
}

/**
 * Renew an expiring role assignment
 */
export function renewRoleAssignment(
  assignment: UserRoleAssignment,
  renewedBy: UserId,
  newExpiresAt: string
): UserRoleAssignment {
  const now = new Date().toISOString();
  
  return {
    ...assignment,
    expiresAt: newExpiresAt,
    lastRenewedAt: now,
    renewalReminderSentAt: undefined,
    audit: {
      ...assignment.audit,
      updatedAt: now,
      updatedBy: renewedBy,
      version: assignment.audit.version + 1,
    },
  };
}

/**
 * Check and mark expired assignments
 */
export function checkExpiration(assignment: UserRoleAssignment): UserRoleAssignment {
  if (assignment.status !== 'active' || !assignment.expiresAt) {
    return assignment;
  }
  
  if (new Date(assignment.expiresAt) <= new Date()) {
    return {
      ...assignment,
      status: 'expired',
      audit: {
        ...assignment.audit,
        updatedAt: new Date().toISOString(),
        version: assignment.audit.version + 1,
      },
    };
  }
  
  return assignment;
}
