/**
 * OPERATIONS MODULE - APPLICATION WORKFLOWS
 * 
 * State machine and workflow logic for volunteer applications.
 */

import type { UserId, AuditMetadata } from '../types';
import type { RoleId } from '../roles';
import type { 
  VolunteerApplication, 
  ApplicationStatus, 
  ApplicationStep,
  ApplicationWorkflow,
  RejectionReason,
  RequirementStatus 
} from './types';
import type { RoleRequirement } from './requirements';

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export interface WorkflowTransition {
  from: ApplicationStatus;
  to: ApplicationStatus;
  action: string;
  requiredBy: RoleId[];
  automatic: boolean;
  sideEffects?: WorkflowSideEffect[];
}

export interface WorkflowSideEffect {
  type: 'send_notification' | 'schedule_interview' | 'initiate_background_check' | 'assign_reviewer';
  params: Record<string, unknown>;
}

export const APPLICATION_WORKFLOW: WorkflowTransition[] = [
  // Initial submission
  {
    from: 'draft',
    to: 'submitted',
    action: 'submit_application',
    requiredBy: ['user'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_received' } },
      { type: 'assign_reviewer', params: {} },
    ],
  },
  
  // Review process
  {
    from: 'submitted',
    to: 'under_review',
    action: 'start_review',
    requiredBy: ['junior_moderator', 'moderator', 'lead_moderator'],
    automatic: false,
  },
  
  // Background check
  {
    from: 'under_review',
    to: 'background_check',
    action: 'initiate_background_check',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
    sideEffects: [
      { type: 'initiate_background_check', params: {} },
      { type: 'send_notification', params: { template: 'background_check_initiated' } },
    ],
  },
  
  // Interview scheduling
  {
    from: 'background_check',
    to: 'interview_scheduled',
    action: 'schedule_interview',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
    sideEffects: [
      { type: 'schedule_interview', params: {} },
      { type: 'send_notification', params: { template: 'interview_scheduled' } },
    ],
  },
  
  // Interview completion
  {
    from: 'interview_scheduled',
    to: 'interview_completed',
    action: 'complete_interview',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
  },
  
  // Approval
  {
    from: 'interview_completed',
    to: 'approved',
    action: 'approve_application',
    requiredBy: ['moderator', 'lead_moderator', 'regional_coordinator'],
    automatic: false,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_approved' } },
    ],
  },
  
  // Rejection paths
  {
    from: 'under_review',
    to: 'rejected',
    action: 'reject_application',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_rejected' } },
    ],
  },
  {
    from: 'background_check',
    to: 'rejected',
    action: 'reject_application',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_rejected' } },
    ],
  },
  {
    from: 'interview_completed',
    to: 'rejected',
    action: 'reject_application',
    requiredBy: ['moderator', 'lead_moderator'],
    automatic: false,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_rejected' } },
    ],
  },
  
  // Withdrawal
  {
    from: 'draft',
    to: 'withdrawn',
    action: 'withdraw_application',
    requiredBy: ['user'],
    automatic: true,
  },
  {
    from: 'submitted',
    to: 'withdrawn',
    action: 'withdraw_application',
    requiredBy: ['user'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_withdrawn' } },
    ],
  },
  {
    from: 'under_review',
    to: 'withdrawn',
    action: 'withdraw_application',
    requiredBy: ['user'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_withdrawn' } },
    ],
  },
  {
    from: 'background_check',
    to: 'withdrawn',
    action: 'withdraw_application',
    requiredBy: ['user'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_withdrawn' } },
    ],
  },
  {
    from: 'interview_scheduled',
    to: 'withdrawn',
    action: 'withdraw_application',
    requiredBy: ['user'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_withdrawn' } },
    ],
  },
  
  // Expiration
  {
    from: 'submitted',
    to: 'expired',
    action: 'expire_application',
    requiredBy: ['foundation_admin'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_expired' } },
    ],
  },
  {
    from: 'under_review',
    to: 'expired',
    action: 'expire_application',
    requiredBy: ['foundation_admin'],
    automatic: true,
    sideEffects: [
      { type: 'send_notification', params: { template: 'application_expired' } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW ENGINE
// ═══════════════════════════════════════════════════════════════════

export interface WorkflowContext {
  applicationId: string;
  userId: string;
  currentStatus: ApplicationStatus;
  requestedBy: UserId;
  requestedByRole: RoleId;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowResult {
  success: boolean;
  newStatus?: ApplicationStatus;
  errors: string[];
  sideEffects: WorkflowSideEffect[];
  auditLog: WorkflowAuditEntry[];
}

export interface WorkflowAuditEntry {
  timestamp: string;
  action: string;
  actor: UserId;
  actorRole: RoleId;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  reason?: string;
}

export class ApplicationWorkflowEngine {
  private transitions: Map<string, WorkflowTransition> = new Map();
  
  constructor() {
    // Build transition map
    for (const transition of APPLICATION_WORKFLOW) {
      const key = `${transition.from}->${transition.to}`;
      this.transitions.set(key, transition);
    }
  }
  
  /**
   * Get possible transitions from current status
   */
  getPossibleTransitions(status: ApplicationStatus, actorRole: RoleId): WorkflowTransition[] {
    return APPLICATION_WORKFLOW.filter(t => 
      t.from === status && 
      (t.requiredBy.includes(actorRole) || t.automatic)
    );
  }
  
  /**
   * Execute a workflow transition
   */
  executeTransition(
    context: WorkflowContext,
    targetStatus: ApplicationStatus,
    reason?: string
  ): WorkflowResult {
    const errors: string[] = [];
    const sideEffects: WorkflowSideEffect[] = [];
    const auditLog: WorkflowAuditEntry[] = [];
    
    // Find transition
    const transitionKey = `${context.currentStatus}->${targetStatus}`;
    const transition = this.transitions.get(transitionKey);
    
    if (!transition) {
      errors.push(`Invalid transition from ${context.currentStatus} to ${targetStatus}`);
      return { success: false, errors, sideEffects, auditLog };
    }
    
    // Check permissions
    if (!transition.automatic && !transition.requiredBy.includes(context.requestedByRole)) {
      errors.push(`Role ${context.requestedByRole} is not authorized for this action`);
      return { success: false, errors, sideEffects, auditLog };
    }
    
    // Execute side effects
    if (transition.sideEffects) {
      sideEffects.push(...transition.sideEffects);
    }
    
    // Create audit entry
    auditLog.push({
      timestamp: context.timestamp,
      action: transition.action,
      actor: context.requestedBy,
      actorRole: context.requestedByRole,
      previousStatus: context.currentStatus,
      newStatus: targetStatus,
      reason,
    });
    
    return {
      success: true,
      newStatus: targetStatus,
      errors,
      sideEffects,
      auditLog,
    };
  }
  
  /**
   * Get current workflow step for an application
   */
  getCurrentStep(status: ApplicationStatus): ApplicationStep {
    const stepMap: Record<ApplicationStatus, ApplicationStep> = {
      draft: 'initial_submission',
      submitted: 'identity_verification',
      under_review: 'background_check',
      background_check: 'reference_checks',
      interview_scheduled: 'interview',
      interview_completed: 'final_review',
      approved: 'approval',
      rejected: 'rejection',
      withdrawn: 'rejection',
      expired: 'rejection',
    };
    
    return stepMap[status] ?? 'initial_submission';
  }
  
  /**
   * Get next action required
   */
  getNextAction(status: ApplicationStatus): string | null {
    const actionMap: Record<ApplicationStatus, string | null> = {
      draft: 'Complete and submit application',
      submitted: 'Awaiting identity verification',
      under_review: 'Application under review',
      background_check: 'Background check in progress',
      interview_scheduled: 'Interview scheduled',
      interview_completed: 'Awaiting final decision',
      approved: 'Application approved - proceed to onboarding',
      rejected: null,
      withdrawn: null,
      expired: null,
    };
    
    return actionMap[status];
  }
}

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW HELPERS
// ═══════════════════════════════════════════════════════════════════

export const workflowEngine = new ApplicationWorkflowEngine();

/**
 * Update application status with workflow validation
 */
export function updateApplicationStatus(
  application: VolunteerApplication,
  newStatus: ApplicationStatus,
  updatedBy: UserId,
  updatedByRole: RoleId,
  reason?: string
): VolunteerApplication {
  const context: WorkflowContext = {
    applicationId: application.id,
    userId: application.userId,
    currentStatus: application.status,
    requestedBy: updatedBy,
    requestedByRole: updatedByRole,
    timestamp: new Date().toISOString(),
  };
  
  const result = workflowEngine.executeTransition(context, newStatus, reason);
  
  if (!result.success) {
    throw new Error(`Workflow transition failed: ${result.errors.join(', ')}`);
  }
  
  return {
    ...application,
    status: newStatus,
    lastUpdated: context.timestamp,
    reviewedAt: newStatus === 'under_review' || newStatus === 'approved' || newStatus === 'rejected' 
      ? context.timestamp 
      : application.reviewedAt,
    reviewedBy: newStatus === 'under_review' || newStatus === 'approved' || newStatus === 'rejected'
      ? updatedBy
      : application.reviewedBy,
    approvedAt: newStatus === 'approved' ? context.timestamp : application.approvedAt,
    rejectedAt: newStatus === 'rejected' ? context.timestamp : application.rejectedAt,
    audit: {
      ...application.audit,
      updatedAt: context.timestamp,
      version: application.audit.version + 1,
    },
  };
}

/**
 * Check if user can perform action on application
 */
export function canPerformAction(
  application: VolunteerApplication,
  action: string,
  userRole: RoleId
): boolean {
  const transitions = workflowEngine.getPossibleTransitions(application.status, userRole);
  return transitions.some(t => t.action === action);
}

/**
 * Get application workflow summary
 */
export function getWorkflowSummary(application: VolunteerApplication): ApplicationWorkflow {
  const currentStep = workflowEngine.getCurrentStep(application.status);
  const nextAction = workflowEngine.getNextAction(application.status);
  
  return {
    applicationId: application.id,
    currentStep,
    completedSteps: getCompletedSteps(application.status),
    nextAction: nextAction ?? undefined,
    dueAt: application.expiresAt,
  };
}

function getCompletedSteps(status: ApplicationStatus): ApplicationStep[] {
  const stepOrder: ApplicationStep[] = [
    'initial_submission',
    'identity_verification',
    'background_check',
    'reference_checks',
    'interview',
    'final_review',
    'approval',
    'onboarding',
  ];
  
  const currentStepIndex = stepOrder.indexOf(workflowEngine.getCurrentStep(status));
  return stepOrder.slice(0, currentStepIndex);
}

/**
 * Auto-expire applications past their due date
 */
export function checkApplicationExpiration(application: VolunteerApplication): boolean {
  if (!application.expiresAt) return false;
  
  const isExpired = new Date(application.expiresAt) <= new Date();
  const canExpire = ['submitted', 'under_review', 'background_check', 'interview_scheduled'].includes(application.status);
  
  return isExpired && canExpire;
}

/**
 * Get rejection reason details
 */
export function getRejectionReasonDetails(reason: RejectionReason): {
  userFriendly: string;
  canReapply: boolean;
  reapplyAfterDays?: number;
} {
  const reasonMap: Record<RejectionReason, {
    userFriendly: string;
    canReapply: boolean;
    reapplyAfterDays?: number;
  }> = {
    incomplete_application: {
      userFriendly: 'Application was incomplete. Please complete all required fields.',
      canReapply: true,
      reapplyAfterDays: 7,
    },
    failed_background_check: {
      userFriendly: 'Background check did not meet requirements.',
      canReapply: false,
    },
    failed_interview: {
      userFriendly: 'Interview did not meet requirements.',
      canReapply: true,
      reapplyAfterDays: 30,
    },
    insufficient_experience: {
      userFriendly: 'Insufficient experience for the requested role.',
      canReapply: true,
      reapplyAfterDays: 90,
    },
    safety_concerns: {
      userFriendly: 'Safety concerns identified during review.',
      canReapply: false,
    },
    reference_check_failed: {
      userFriendly: 'Reference check did not meet requirements.',
      canReapply: true,
      reapplyAfterDays: 30,
    },
    identity_not_verified: {
      userFriendly: 'Identity could not be verified.',
      canReapply: true,
      reapplyAfterDays: 7,
    },
    waivers_not_signed: {
      userFriendly: 'Required waivers were not signed.',
      canReapply: true,
      reapplyAfterDays: 1,
    },
    region_not_available: {
      userFriendly: 'Role is not available in your region.',
      canReapply: true,
      reapplyAfterDays: 30,
    },
    role_not_available: {
      userFriendly: 'Role is currently not accepting applications.',
      canReapply: true,
      reapplyAfterDays: 30,
    },
    duplicate_application: {
      userFriendly: 'Duplicate application found.',
      canReapply: false,
    },
    other: {
      userFriendly: 'Application did not meet requirements.',
      canReapply: true,
      reapplyAfterDays: 30,
    },
  };
  
  return reasonMap[reason];
}
