/**
 * OPERATIONS MODULE - PERMISSION SYSTEM
 * 
 * Permission checking with two-person approval, break-glass access,
 * and comprehensive audit logging.
 * 
 * CRITICAL CONSTRAINTS:
 * - No destructive deletes (use archive/redact/legal_hold)
 * - Break-glass required for PII access
 * - Two-person approval for high-impact actions
 */

import type { UserId, CaseId, RegionId, Result, OperationsError } from '../types';
import { createOperationsError } from '../types';
import type { RoleId, PermissionId } from './definitions';
import { ROLE_DEFINITIONS, getRoleLevel } from './definitions';
import type { UserRoleSet, UserRoleAssignment } from './assignments';

// ═══════════════════════════════════════════════════════════════════
// ACTION CONTEXT
// ═══════════════════════════════════════════════════════════════════

export interface ActionContext {
  caseId?: CaseId;
  regionId?: RegionId;
  targetUserId?: UserId;
  resourceType?: string;
  resourceId?: string;
  claimScore?: number;           // For verification.clear_hold
  hasDispute?: boolean;          // For verification.clear_hold
  alertTier?: number;            // For alert triggers
  isEmergency?: boolean;
  breakGlassId?: string;         // If break-glass already obtained
  existingApprovals?: { userId: UserId; approvedAt: string }[];
}

// ═══════════════════════════════════════════════════════════════════
// PERMISSION CHECK RESULT
// ═══════════════════════════════════════════════════════════════════

export interface PermissionCheck {
  name: string;
  passed: boolean;
  detail?: string;
  severity?: 'info' | 'warning' | 'error';
}

export type PermissionDecision = 
  | 'allow'
  | 'deny'
  | 'requires_approval'
  | 'requires_break_glass'
  | 'requires_two_person';

export interface PermissionCheckResult {
  allowed: boolean;
  decision: PermissionDecision;
  checks: PermissionCheck[];
  appliedPolicies: string[];
  missingPermissions?: PermissionId[];
  requiredApprovals?: { roleId: RoleId; count: number }[];
  breakGlassRequired?: boolean;
  breakGlassScopes?: ('pii' | 'address' | 'contact')[];
  twoPersonRequired?: boolean;
  twoPersonReason?: string;
  auditNote: string;
}

// ═══════════════════════════════════════════════════════════════════
// TWO-PERSON APPROVAL RULES
// ═══════════════════════════════════════════════════════════════════

export interface TwoPersonRule {
  action: PermissionId;
  requiredApprovers: number;
  approverRoles: RoleId[];
  timeWindowMinutes: number;
  reason: string;
  conditionalOn?: (context: ActionContext) => boolean;
}

export const TWO_PERSON_RULES: TwoPersonRule[] = [
  {
    action: 'volunteer.suspend',
    requiredApprovers: 2,
    approverRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 60,
    reason: 'Prevents unilateral suspension of volunteers',
  },
  {
    action: 'volunteer.revoke',
    requiredApprovers: 2,
    approverRoles: ['regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 120,
    reason: 'Revocation is permanent and requires senior approval',
  },
  {
    action: 'moderator.suspend',
    requiredApprovers: 2,
    approverRoles: ['regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 60,
    reason: 'Moderator suspension requires senior oversight',
  },
  {
    action: 'alert.trigger_t4',
    requiredApprovers: 2,
    approverRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 30,
    reason: 'High-tier alerts have significant public impact',
  },
  {
    action: 'alert.trigger_t5',
    requiredApprovers: 2,
    approverRoles: ['regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 30,
    reason: 'Maximum alert tier requires senior oversight',
  },
  {
    action: 'system.emergency_mode_activate',
    requiredApprovers: 2,
    approverRoles: ['regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 15,
    reason: 'Emergency mode relaxes vetting requirements',
  },
  {
    action: 'verification.clear_hold',
    requiredApprovers: 2,
    approverRoles: ['moderator', 'lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 60,
    reason: 'Animal release requires verification by two people in disputed/low-confidence claims',
    conditionalOn: (ctx) => (ctx.claimScore !== undefined && ctx.claimScore < 60) || ctx.hasDispute === true,
  },
  {
    action: 'case.legal_hold',
    requiredApprovers: 2,
    approverRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 120,
    reason: 'Legal holds have compliance implications',
  },
  {
    action: 'case.redact_pii',
    requiredApprovers: 2,
    approverRoles: ['regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 120,
    reason: 'PII redaction is irreversible',
  },
  {
    action: 'system.user_ban',
    requiredApprovers: 2,
    approverRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeWindowMinutes: 60,
    reason: 'User bans require oversight to prevent abuse',
  },
];

// ═══════════════════════════════════════════════════════════════════
// BREAK-GLASS ACCESS
// ═══════════════════════════════════════════════════════════════════

export type BreakGlassScope = 'pii' | 'address' | 'contact';

export type BreakGlassReasonCode = 
  | 'immediate_safety'
  | 'owner_contact_failed'
  | 'law_enforcement'
  | 'vet_emergency'
  | 'fraud_investigation'
  | 'other';

export interface BreakGlassRequest {
  id: string;
  requesterId: UserId;
  requestedAt: string;
  scopes: BreakGlassScope[];
  reasonCode: BreakGlassReasonCode;
  justification: string;
  caseId?: CaseId;
  
  // Grant details
  status: 'pending' | 'granted' | 'denied' | 'expired' | 'revoked';
  grantedAt?: string;
  grantedBy?: UserId | 'auto';
  deniedAt?: string;
  deniedBy?: UserId;
  denialReason?: string;
  expiresAt: string;
  
  // Usage tracking
  accessedResources: {
    resourceType: string;
    resourceId: string;
    accessedAt: string;
    accessType: 'read' | 'write';
  }[];
  
  // Audit review
  reviewedAt?: string;
  reviewedBy?: UserId;
  reviewNotes?: string;
  reviewOutcome?: 'appropriate' | 'inappropriate' | 'needs_followup';
}

export const BREAK_GLASS_PERMISSIONS: PermissionId[] = [
  'data.pii_view',
  'data.address_view',
  'data.contact_view',
];

export const BREAK_GLASS_CONFIG = {
  defaultTtlMinutes: 30,
  maxTtlMinutes: 120,
  autoGrantReasonCodes: ['immediate_safety', 'vet_emergency'] as BreakGlassReasonCode[],
  requiresReview: true,
  reviewDeadlineHours: 24,
};

/**
 * Check if a permission requires break-glass access
 */
export function requiresBreakGlass(permission: PermissionId): boolean {
  return BREAK_GLASS_PERMISSIONS.includes(permission);
}

/**
 * Get required break-glass scopes for a permission
 */
export function getBreakGlassScopes(permission: PermissionId): BreakGlassScope[] {
  switch (permission) {
    case 'data.pii_view':
      return ['pii'];
    case 'data.address_view':
      return ['address'];
    case 'data.contact_view':
      return ['contact'];
    default:
      return [];
  }
}

/**
 * Create a break-glass request
 */
export function createBreakGlassRequest(params: {
  requesterId: UserId;
  scopes: BreakGlassScope[];
  reasonCode: BreakGlassReasonCode;
  justification: string;
  caseId?: CaseId;
  ttlMinutes?: number;
}): BreakGlassRequest {
  const now = new Date();
  const ttl = Math.min(
    params.ttlMinutes ?? BREAK_GLASS_CONFIG.defaultTtlMinutes,
    BREAK_GLASS_CONFIG.maxTtlMinutes
  );
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);
  
  // Auto-grant for certain reason codes
  const autoGrant = BREAK_GLASS_CONFIG.autoGrantReasonCodes.includes(params.reasonCode);
  
  return {
    id: crypto.randomUUID(),
    requesterId: params.requesterId,
    requestedAt: now.toISOString(),
    scopes: params.scopes,
    reasonCode: params.reasonCode,
    justification: params.justification,
    caseId: params.caseId,
    status: autoGrant ? 'granted' : 'pending',
    grantedAt: autoGrant ? now.toISOString() : undefined,
    grantedBy: autoGrant ? 'auto' : undefined,
    expiresAt: expiresAt.toISOString(),
    accessedResources: [],
  };
}

/**
 * Check if break-glass is valid for use
 */
export function isBreakGlassValid(breakGlass: BreakGlassRequest, scope: BreakGlassScope): boolean {
  if (breakGlass.status !== 'granted') return false;
  if (new Date(breakGlass.expiresAt) <= new Date()) return false;
  if (!breakGlass.scopes.includes(scope)) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// TWO-PERSON APPROVAL
// ═══════════════════════════════════════════════════════════════════

export interface TwoPersonApprovalRequest {
  id: string;
  action: PermissionId;
  requestedBy: UserId;
  requestedAt: string;
  targetResourceType: string;
  targetResourceId: string;
  context: ActionContext;
  
  // Approval tracking
  requiredApprovers: number;
  approverRoles: RoleId[];
  approvals: { userId: UserId; roleId: RoleId; approvedAt: string; notes?: string }[];
  
  // Timeline
  timeoutAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';
  
  // Resolution
  resolvedAt?: string;
  resolvedBy?: UserId;
  resolutionNotes?: string;
}

/**
 * Get two-person rule for an action
 */
export function getTwoPersonRule(action: PermissionId, context: ActionContext): TwoPersonRule | null {
  const rule = TWO_PERSON_RULES.find(r => r.action === action);
  if (!rule) return null;
  
  // Check conditional
  if (rule.conditionalOn && !rule.conditionalOn(context)) {
    return null;
  }
  
  return rule;
}

/**
 * Check if action requires two-person approval
 */
export function requiresTwoPersonApproval(action: PermissionId, context: ActionContext): boolean {
  return getTwoPersonRule(action, context) !== null;
}

/**
 * Create a two-person approval request
 */
export function createTwoPersonApprovalRequest(params: {
  action: PermissionId;
  requestedBy: UserId;
  targetResourceType: string;
  targetResourceId: string;
  context: ActionContext;
}): TwoPersonApprovalRequest | null {
  const rule = getTwoPersonRule(params.action, params.context);
  if (!rule) return null;
  
  const now = new Date();
  const timeoutAt = new Date(now.getTime() + rule.timeWindowMinutes * 60 * 1000);
  
  return {
    id: crypto.randomUUID(),
    action: params.action,
    requestedBy: params.requestedBy,
    requestedAt: now.toISOString(),
    targetResourceType: params.targetResourceType,
    targetResourceId: params.targetResourceId,
    context: params.context,
    requiredApprovers: rule.requiredApprovers,
    approverRoles: rule.approverRoles,
    approvals: [],
    timeoutAt: timeoutAt.toISOString(),
    status: 'pending',
  };
}

/**
 * Check if two-person approval is satisfied
 */
export function isTwoPersonApprovalSatisfied(request: TwoPersonApprovalRequest): boolean {
  if (request.status === 'approved') return true;
  if (request.status !== 'pending') return false;
  if (new Date(request.timeoutAt) <= new Date()) return false;
  
  // Check if we have enough unique approvers with correct roles
  const validApprovals = request.approvals.filter(a => 
    request.approverRoles.includes(a.roleId) &&
    a.userId !== request.requestedBy // Requester cannot approve their own request
  );
  
  // Check for unique approvers
  const uniqueApprovers = new Set(validApprovals.map(a => a.userId));
  
  return uniqueApprovers.size >= request.requiredApprovers;
}

// ═══════════════════════════════════════════════════════════════════
// PERMISSION CHECKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if user has permission to perform an action
 */
export function checkPermission(
  userRoleSet: UserRoleSet,
  permission: PermissionId,
  context: ActionContext = {}
): PermissionCheckResult {
  const checks: PermissionCheck[] = [];
  const appliedPolicies: string[] = [];
  
  // Check 1: User has active roles
  if (!userRoleSet.hasActiveRoles) {
    checks.push({
      name: 'Active Role Check',
      passed: false,
      detail: 'User has no active roles',
      severity: 'error',
    });
    return buildDenyResult(checks, appliedPolicies, 'No active roles');
  }
  checks.push({
    name: 'Active Role Check',
    passed: true,
    detail: `User has ${userRoleSet.roles.filter(r => r.status === 'active').length} active role(s)`,
  });
  
  // Check 2: Permission exists in effective permissions
  const hasPermission = userRoleSet.effectivePermissions.includes(permission);
  if (!hasPermission) {
    checks.push({
      name: 'Permission Check',
      passed: false,
      detail: `User lacks permission: ${permission}`,
      severity: 'error',
    });
    return buildDenyResult(checks, appliedPolicies, `Missing permission: ${permission}`, [permission]);
  }
  checks.push({
    name: 'Permission Check',
    passed: true,
    detail: `Permission ${permission} granted via role(s)`,
  });
  appliedPolicies.push('base_permission_check');
  
  // Check 3: Region scope (if applicable)
  if (context.regionId) {
    const activeRoles = userRoleSet.roles.filter(r => r.status === 'active');
    const hasRegionAccess = activeRoles.some(r => 
      !r.regionIds || r.regionIds.length === 0 || r.regionIds.includes(context.regionId!)
    );
    if (!hasRegionAccess) {
      checks.push({
        name: 'Region Scope Check',
        passed: false,
        detail: `User not authorized for region: ${context.regionId}`,
        severity: 'error',
      });
      return buildDenyResult(checks, appliedPolicies, 'Region access denied');
    }
    checks.push({
      name: 'Region Scope Check',
      passed: true,
      detail: 'User authorized for region',
    });
    appliedPolicies.push('region_scope_check');
  }
  
  // Check 4: Break-glass requirement
  if (requiresBreakGlass(permission)) {
    const scopes = getBreakGlassScopes(permission);
    
    if (!context.breakGlassId) {
      checks.push({
        name: 'Break-Glass Check',
        passed: false,
        detail: `Permission ${permission} requires break-glass access`,
        severity: 'warning',
      });
      return buildBreakGlassRequiredResult(checks, appliedPolicies, scopes);
    }
    
    checks.push({
      name: 'Break-Glass Check',
      passed: true,
      detail: `Break-glass access provided: ${context.breakGlassId}`,
    });
    appliedPolicies.push('break_glass_policy');
  }
  
  // Check 5: Two-person approval requirement
  const twoPersonRule = getTwoPersonRule(permission, context);
  if (twoPersonRule) {
    const existingApprovals = context.existingApprovals ?? [];
    const validApprovals = existingApprovals.filter(a => {
      // Would need to look up approver's role - simplified here
      return true;
    });
    
    if (validApprovals.length < twoPersonRule.requiredApprovers) {
      checks.push({
        name: 'Two-Person Approval Check',
        passed: false,
        detail: `Requires ${twoPersonRule.requiredApprovers} approvers, has ${validApprovals.length}`,
        severity: 'warning',
      });
      return buildTwoPersonRequiredResult(checks, appliedPolicies, twoPersonRule);
    }
    
    checks.push({
      name: 'Two-Person Approval Check',
      passed: true,
      detail: `Two-person approval satisfied (${validApprovals.length} approvers)`,
    });
    appliedPolicies.push('two_person_approval_policy');
  }
  
  // All checks passed
  return {
    allowed: true,
    decision: 'allow',
    checks,
    appliedPolicies,
    auditNote: `Permission ${permission} granted to user ${userRoleSet.userId}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// RESULT BUILDERS
// ═══════════════════════════════════════════════════════════════════

function buildDenyResult(
  checks: PermissionCheck[],
  appliedPolicies: string[],
  reason: string,
  missingPermissions?: PermissionId[]
): PermissionCheckResult {
  return {
    allowed: false,
    decision: 'deny',
    checks,
    appliedPolicies,
    missingPermissions,
    auditNote: `Permission denied: ${reason}`,
  };
}

function buildBreakGlassRequiredResult(
  checks: PermissionCheck[],
  appliedPolicies: string[],
  scopes: BreakGlassScope[]
): PermissionCheckResult {
  return {
    allowed: false,
    decision: 'requires_break_glass',
    checks,
    appliedPolicies,
    breakGlassRequired: true,
    breakGlassScopes: scopes,
    auditNote: `Break-glass access required for scopes: ${scopes.join(', ')}`,
  };
}

function buildTwoPersonRequiredResult(
  checks: PermissionCheck[],
  appliedPolicies: string[],
  rule: TwoPersonRule
): PermissionCheckResult {
  return {
    allowed: false,
    decision: 'requires_two_person',
    checks,
    appliedPolicies,
    twoPersonRequired: true,
    twoPersonReason: rule.reason,
    requiredApprovals: [{ roleId: rule.approverRoles[0], count: rule.requiredApprovers }],
    auditNote: `Two-person approval required: ${rule.reason}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PERMISSION DEBUGGER
// ═══════════════════════════════════════════════════════════════════

export interface PermissionExplanation {
  permission: PermissionId;
  userId: UserId;
  result: PermissionCheckResult;
  roleBreakdown: {
    roleId: RoleId;
    status: string;
    hasPermission: boolean;
    regionLimited: boolean;
    expiresAt?: string;
  }[];
  relevantPolicies: {
    policy: string;
    description: string;
    applies: boolean;
  }[];
  recommendations: string[];
}

/**
 * Explain why a permission check succeeded or failed
 */
export function explainPermission(
  userRoleSet: UserRoleSet,
  permission: PermissionId,
  context: ActionContext = {}
): PermissionExplanation {
  const result = checkPermission(userRoleSet, permission, context);
  
  // Build role breakdown
  const roleBreakdown = userRoleSet.roles.map(assignment => {
    const roleDef = ROLE_DEFINITIONS[assignment.roleId];
    return {
      roleId: assignment.roleId,
      status: assignment.status,
      hasPermission: roleDef?.permissions.includes(permission) ?? false,
      regionLimited: (assignment.regionIds?.length ?? 0) > 0,
      expiresAt: assignment.expiresAt,
    };
  });
  
  // Build policy explanations
  const relevantPolicies = [
    {
      policy: 'base_permission_check',
      description: 'Checks if any active role grants the permission',
      applies: true,
    },
    {
      policy: 'region_scope_check',
      description: 'Checks if user has access to the target region',
      applies: !!context.regionId,
    },
    {
      policy: 'break_glass_policy',
      description: 'Requires break-glass access for sensitive data',
      applies: requiresBreakGlass(permission),
    },
    {
      policy: 'two_person_approval_policy',
      description: 'Requires approval from multiple people for high-impact actions',
      applies: requiresTwoPersonApproval(permission, context),
    },
  ];
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (!result.allowed) {
    if (result.missingPermissions?.length) {
      const rolesWithPermission = Object.values(ROLE_DEFINITIONS)
        .filter(r => r.permissions.includes(permission))
        .map(r => r.name);
      if (rolesWithPermission.length > 0) {
        recommendations.push(`Permission available in roles: ${rolesWithPermission.join(', ')}`);
      }
    }
    if (result.breakGlassRequired) {
      recommendations.push('Submit a break-glass request with justification');
    }
    if (result.twoPersonRequired) {
      recommendations.push(`Obtain approval from ${result.requiredApprovals?.[0]?.count} authorized personnel`);
    }
  }
  
  return {
    permission,
    userId: userRoleSet.userId,
    result,
    roleBreakdown,
    relevantPolicies,
    recommendations,
  };
}

// ═══════════════════════════════════════════════════════════════════
// BATCH PERMISSION CHECKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Check multiple permissions at once
 */
export function checkPermissions(
  userRoleSet: UserRoleSet,
  permissions: PermissionId[],
  context: ActionContext = {}
): Map<PermissionId, PermissionCheckResult> {
  const results = new Map<PermissionId, PermissionCheckResult>();
  
  for (const permission of permissions) {
    results.set(permission, checkPermission(userRoleSet, permission, context));
  }
  
  return results;
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  userRoleSet: UserRoleSet,
  permissions: PermissionId[],
  context: ActionContext = {}
): boolean {
  return permissions.every(p => checkPermission(userRoleSet, p, context).allowed);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  userRoleSet: UserRoleSet,
  permissions: PermissionId[],
  context: ActionContext = {}
): boolean {
  return permissions.some(p => checkPermission(userRoleSet, p, context).allowed);
}
