/**
 * OPERATIONS MODULE - STANDARD OPERATING PROCEDURES
 * 
 * Enforceable procedures for all volunteer operations.
 * Each SOP has steps, required documentation, and failure actions.
 */

import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// SOP STRUCTURE
// ═══════════════════════════════════════════════════════════════════

export interface Procedure {
  id: string;
  title: string;
  category: SopCategory;
  version: string;
  effectiveDate: string;
  
  // Applicability
  applicableRoles: RoleId[];
  applicableTaskTypes?: string[];
  
  // Timing
  timeLimit?: string;
  
  // Escalation
  escalationPath: RoleId[];
  
  // Sensitivity
  sensitivityLevel: 'standard' | 'sensitive' | 'critical';
  
  // Steps
  steps: ProcedureStep[];
  
  // References
  relatedSops?: string[];
  externalReferences?: string[];
  
  // Compliance
  requiresAttestation: boolean;
  attestationFrequencyDays?: number;
}

export interface ProcedureStep {
  order: number;
  action: string;
  required: boolean;
  documentation?: string;
  failureAction?: string;
  timeoutMinutes?: number;
  requiresApproval?: boolean;
  approvalRoles?: RoleId[];
}

export type SopCategory = 
  | 'case_management'
  | 'match_verification'
  | 'owner_verification'
  | 'volunteer_coordination'
  | 'safety'
  | 'fraud_response'
  | 'escalation'
  | 'data_handling'
  | 'communication';

// ═══════════════════════════════════════════════════════════════════
// STANDARD OPERATING PROCEDURES
// ═══════════════════════════════════════════════════════════════════

export const STANDARD_PROCEDURES: Procedure[] = [
  // ─────────────────────────────────────────────────────────────────
  // SOP-001: Case Triage
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-001',
    title: 'Initial Case Triage',
    category: 'case_management',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    timeLimit: '30 minutes for standard, 5 minutes for urgent',
    escalationPath: ['moderator', 'lead_moderator', 'regional_coordinator'],
    sensitivityLevel: 'standard',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Review case details: species, location, time missing, distinctive features',
        required: true,
        documentation: 'Case viewed timestamp recorded automatically',
      },
      {
        order: 2,
        action: 'Check for duplicate cases within 10km radius',
        required: true,
        documentation: 'Record duplicate check result',
        failureAction: 'If duplicate found, link cases and consolidate',
      },
      {
        order: 3,
        action: 'Assess urgency: medical needs, weather, traffic, time elapsed',
        required: true,
        documentation: 'Document urgency factors',
      },
      {
        order: 4,
        action: 'Assign priority level (T1-T5)',
        required: true,
        documentation: 'Record priority and justification',
      },
      {
        order: 5,
        action: 'Check for pre-registered profile match',
        required: true,
        documentation: 'Record pre-reg match status',
      },
      {
        order: 6,
        action: 'Assign to appropriate moderator or self-assign',
        required: true,
        documentation: 'Assignment recorded with timestamp',
      },
      {
        order: 7,
        action: 'If T1/T2, immediately trigger appropriate alert tier',
        required: true,
        documentation: 'Alert ID recorded',
        failureAction: 'Escalate to Lead if unable to trigger alert',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-002: Match Verification
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-002',
    title: 'Potential Match Verification',
    category: 'match_verification',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['moderator', 'lead_moderator'],
    timeLimit: '2 hours for standard matches',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    sensitivityLevel: 'standard',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Compare photos side-by-side for distinctive markings',
        required: true,
        documentation: 'List markings compared and match confidence',
      },
      {
        order: 2,
        action: 'Verify species, breed, color, and size match',
        required: true,
        documentation: 'Record each attribute comparison',
      },
      {
        order: 3,
        action: 'Check location proximity and timeline plausibility',
        required: true,
        documentation: 'Record distance and time analysis',
      },
      {
        order: 4,
        action: 'If microchip reported, verify chip number if available',
        required: false,
        documentation: 'Record chip verification result',
      },
      {
        order: 5,
        action: 'Assign confidence level: High/Medium/Low',
        required: true,
        documentation: 'Record confidence with justification',
      },
      {
        order: 6,
        action: 'If High confidence, proceed to owner notification',
        required: true,
        documentation: 'Record decision',
        failureAction: 'If Medium/Low, request additional photos or escalate',
      },
      {
        order: 7,
        action: 'NEVER notify owner of unverified match',
        required: true,
        documentation: 'Verification status must be "verified" before notification',
        failureAction: 'Immediate escalation if false hope protocol violated',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-003: Volunteer Dispatch
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-003',
    title: 'Volunteer Dispatch Protocol',
    category: 'volunteer_coordination',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['moderator', 'lead_moderator'],
    timeLimit: '15 minutes to dispatch',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    sensitivityLevel: 'standard',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Identify required volunteer capabilities (transport, trap, etc.)',
        required: true,
        documentation: 'Record capability requirements',
      },
      {
        order: 2,
        action: 'Search available volunteers within service radius',
        required: true,
        documentation: 'Record search parameters and results',
      },
      {
        order: 3,
        action: 'Check volunteer status: active, not on break, within shift hours',
        required: true,
        documentation: 'Record volunteer status verification',
      },
      {
        order: 4,
        action: 'Verify volunteer has required equipment',
        required: true,
        documentation: 'Record equipment check',
      },
      {
        order: 5,
        action: 'Send dispatch request via preferred contact method',
        required: true,
        documentation: 'Record dispatch request timestamp and method',
      },
      {
        order: 6,
        action: 'Wait for acceptance (max 15 min) or try next volunteer',
        required: true,
        documentation: 'Record response or timeout',
      },
      {
        order: 7,
        action: 'Once accepted, verify volunteer starts Field Operation check-in',
        required: true,
        documentation: 'Record Field Operation ID',
        failureAction: 'Do not proceed without active check-in session',
      },
      {
        order: 8,
        action: 'Provide case details and any safety warnings',
        required: true,
        documentation: 'Record briefing completion',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-007: Deceased Animal (Rainbow Bridge)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-007',
    title: 'Deceased Animal Verification (Rainbow Bridge Protocol)',
    category: 'match_verification',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    timeLimit: 'Handle with care - no rush',
    escalationPath: ['regional_coordinator', 'foundation_admin'],
    sensitivityLevel: 'critical',
    requiresAttestation: true,
    attestationFrequencyDays: 180,
    steps: [
      {
        order: 1,
        action: 'Verify system auto-blurs photo content in case view',
        required: true,
        documentation: 'Confirm blur is active before proceeding',
        failureAction: 'Do not proceed until blur is confirmed',
      },
      {
        order: 2,
        action: 'Review distinctive markings from photos WITHOUT showing to owner',
        required: true,
        documentation: 'Document markings compared to lost report privately',
      },
      {
        order: 3,
        action: 'Check microchip if accessible (coordinate with shelter/finder)',
        required: false,
        documentation: 'Record chip lookup result',
      },
      {
        order: 4,
        action: 'If match is likely, contact owner via PHONE CALL (never automated alert)',
        required: true,
        documentation: 'Record call timestamp, who answered, emotional state',
      },
      {
        order: 5,
        action: 'Offer condolences first. Ask if they would like information about a possible match.',
        required: true,
        documentation: 'Record owner response and consent to proceed',
      },
      {
        order: 6,
        action: 'Describe identifying features verbally - let owner confirm/deny',
        required: true,
        documentation: 'Record features described and owner response',
      },
      {
        order: 7,
        action: 'Only share photos if owner explicitly requests AND consents to graphic imagery',
        required: true,
        documentation: 'Record explicit consent for photos, or note photos not shared',
      },
      {
        order: 8,
        action: 'Provide grief resources if appropriate',
        required: false,
        documentation: 'Note resources provided',
      },
      {
        order: 9,
        action: 'Follow up in 24-48 hours',
        required: true,
        documentation: 'Record follow-up outcome',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-008: Owner Verification Before Release
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-008',
    title: 'Owner Verification Before Animal Release',
    category: 'owner_verification',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['moderator', 'lead_moderator', 'regional_coordinator'],
    timeLimit: 'Complete before any handoff',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    sensitivityLevel: 'critical',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Verify release hold is CLEARED in system (not just claim verified)',
        required: true,
        documentation: 'Screenshot showing hold status = cleared',
        failureAction: 'DO NOT RELEASE - escalate immediately',
      },
      {
        order: 2,
        action: 'Verify claimant identity matches claim record (name, ID if in-person)',
        required: true,
        documentation: 'Record ID type and last 4 digits verified',
      },
      {
        order: 3,
        action: 'Review evidence score and ensure threshold met',
        required: true,
        documentation: 'Record score and threshold used',
      },
      {
        order: 4,
        action: 'If score < 60 or any dispute exists, confirm two-person approval obtained',
        required: true,
        documentation: 'Record both approver names and timestamps',
        failureAction: 'Do not release without required approvals',
        requiresApproval: true,
        approvalRoles: ['moderator', 'lead_moderator', 'regional_coordinator'],
      },
      {
        order: 5,
        action: 'Have claimant sign release form',
        required: true,
        documentation: 'Upload signed release form',
      },
      {
        order: 6,
        action: 'Take photo of claimant with animal at handoff',
        required: true,
        documentation: 'Upload handoff photo',
      },
      {
        order: 7,
        action: 'Record animal condition notes',
        required: true,
        documentation: 'Document visible condition at time of release',
      },
      {
        order: 8,
        action: 'Complete Release record in system',
        required: true,
        documentation: 'Release ID recorded',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-009: Lone Worker Safety
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-009',
    title: 'Field Volunteer Safety Protocol',
    category: 'safety',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['moderator', 'lead_moderator'],
    timeLimit: 'Immediate for overdue check-ins',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    sensitivityLevel: 'critical',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Before dispatch, verify volunteer has started Field Operation check-in session',
        required: true,
        documentation: 'Record Field Operation ID',
        failureAction: 'Do not dispatch without active check-in session',
      },
      {
        order: 2,
        action: 'Verify location consent is captured and current',
        required: true,
        documentation: 'Confirm consent version matches current policy',
      },
      {
        order: 3,
        action: 'If buddy is required (night ops, aggressive animal, etc.), confirm buddy assigned',
        required: true,
        documentation: 'Record buddy user ID or exemption reason',
      },
      {
        order: 4,
        action: 'If check-in missed by 15 min: Send app notification + SMS to volunteer',
        required: true,
        documentation: 'Record notification timestamps',
      },
      {
        order: 5,
        action: 'If no response at 30 min: Contact volunteer emergency contact',
        required: true,
        documentation: 'Record emergency contact call timestamp and response',
      },
      {
        order: 6,
        action: 'If no response at 45 min: Escalate to Lead Moderator / On-Call',
        required: true,
        documentation: 'Record escalation',
      },
      {
        order: 7,
        action: 'If no response at 60 min and safety not confirmed: Lead authorizes 911 contact with last known location',
        required: true,
        documentation: 'Record authorization and 911 case number if applicable',
        failureAction: 'Requires Lead/On-Call authorization unless imminent danger evident',
        requiresApproval: true,
        approvalRoles: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-010: End-of-Shift Handoff
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-010',
    title: 'End-of-Shift Case Handoff',
    category: 'case_management',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    timeLimit: '15 minutes before shift end',
    escalationPath: ['lead_moderator'],
    sensitivityLevel: 'standard',
    requiresAttestation: true,
    attestationFrequencyDays: 30,
    steps: [
      {
        order: 1,
        action: 'Review all active cases assigned to you 15 minutes before shift end',
        required: true,
        documentation: 'List case IDs requiring handoff',
      },
      {
        order: 2,
        action: 'For each active case, write briefing note (current status, pending actions, concerns)',
        required: true,
        documentation: 'Briefing notes saved in each case record',
      },
      {
        order: 3,
        action: 'Create Handoff record for each case, assign to incoming moderator',
        required: true,
        documentation: 'Handoff IDs created',
      },
      {
        order: 4,
        action: 'If no incoming moderator available, escalate to Lead Moderator',
        required: true,
        documentation: 'Record escalation or assignment',
        failureAction: 'Do not end shift with unassigned active cases',
      },
      {
        order: 5,
        action: 'Wait for acknowledgement from receiving moderator (or 15 min timeout)',
        required: true,
        documentation: 'Record acknowledgement timestamp or timeout',
      },
      {
        order: 6,
        action: 'Mark shift as complete only after all handoffs acknowledged or escalated',
        required: true,
        documentation: 'Shift end recorded',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-011: Fraud/Suspicious Claim
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-011',
    title: 'Suspected Fraud or Pet Theft Response',
    category: 'fraud_response',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['moderator', 'lead_moderator', 'regional_coordinator'],
    timeLimit: 'Immediate hold, investigation within 24 hours',
    escalationPath: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    sensitivityLevel: 'critical',
    requiresAttestation: true,
    attestationFrequencyDays: 90,
    steps: [
      {
        order: 1,
        action: 'Immediately set release hold with reason "suspected_fraud"',
        required: true,
        documentation: 'Hold ID and timestamp',
        failureAction: 'Animal MUST NOT be released during investigation',
      },
      {
        order: 2,
        action: 'Document specific fraud indicators observed',
        required: true,
        documentation: 'List all red flags (inconsistent story, no photos, aggressive behavior, etc.)',
      },
      {
        order: 3,
        action: 'Escalate to Lead Moderator immediately',
        required: true,
        documentation: 'Escalation timestamp',
      },
      {
        order: 4,
        action: 'If actual owner is known/contactable, notify them of potential fraud attempt',
        required: true,
        documentation: 'Owner notification timestamp and response',
      },
      {
        order: 5,
        action: 'If theft is suspected, advise actual owner to file police report',
        required: false,
        documentation: 'Police report number if provided',
      },
      {
        order: 6,
        action: 'Regional Coordinator reviews and decides: reject claim, involve law enforcement, or clear',
        required: true,
        documentation: 'Decision and reasoning documented',
        requiresApproval: true,
        approvalRoles: ['regional_coordinator', 'foundation_admin'],
      },
      {
        order: 7,
        action: 'If fraud confirmed, ban user and report to platform trust & safety',
        required: true,
        documentation: 'Ban record and any external reports filed',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SOP-012: Emergency Mode Activation
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-012',
    title: 'Emergency/Disaster Mode Activation',
    category: 'escalation',
    version: '2026-v1.0',
    effectiveDate: '2026-01-01',
    applicableRoles: ['regional_coordinator', 'foundation_admin'],
    timeLimit: 'Activation within 15 minutes of trigger',
    escalationPath: ['foundation_admin'],
    sensitivityLevel: 'critical',
    requiresAttestation: true,
    attestationFrequencyDays: 180,
    steps: [
      {
        order: 1,
        action: 'Confirm emergency criteria met (natural disaster, mass displacement, etc.)',
        required: true,
        documentation: 'Document emergency type and scope',
      },
      {
        order: 2,
        action: 'Obtain two-person approval for emergency mode activation',
        required: true,
        documentation: 'Record both approvers',
        requiresApproval: true,
        approvalRoles: ['regional_coordinator', 'foundation_admin'],
      },
      {
        order: 3,
        action: 'Activate emergency mode in system',
        required: true,
        documentation: 'Activation timestamp and affected regions',
      },
      {
        order: 4,
        action: 'Notify all active moderators and volunteers',
        required: true,
        documentation: 'Notification sent timestamp',
      },
      {
        order: 5,
        action: 'Activate emergency volunteer pool (relaxed vetting)',
        required: false,
        documentation: 'Emergency pool activation status',
      },
      {
        order: 6,
        action: 'Coordinate with partner shelters and emergency services',
        required: true,
        documentation: 'Partner coordination log',
      },
      {
        order: 7,
        action: 'Review and deactivate emergency mode when crisis resolved',
        required: true,
        documentation: 'Deactivation timestamp and post-incident review scheduled',
        requiresApproval: true,
        approvalRoles: ['regional_coordinator', 'foundation_admin'],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get procedures by category
 */
export function getProceduresByCategory(category: SopCategory): Procedure[] {
  return STANDARD_PROCEDURES.filter(p => p.category === category);
}

/**
 * Get procedures for a specific role
 */
export function getProceduresForRole(roleId: RoleId): Procedure[] {
  return STANDARD_PROCEDURES.filter(p => p.applicableRoles.includes(roleId));
}

/**
 * Get procedure by ID
 */
export function getProcedure(sopId: string): Procedure | undefined {
  return STANDARD_PROCEDURES.find(p => p.id === sopId);
}

/**
 * Get required steps for a procedure
 */
export function getRequiredSteps(sopId: string): ProcedureStep[] {
  const sop = getProcedure(sopId);
  return sop?.steps.filter(s => s.required) ?? [];
}

/**
 * Check if a role can execute a procedure
 */
export function canExecuteProcedure(roleId: RoleId, sopId: string): boolean {
  const sop = getProcedure(sopId);
  return sop?.applicableRoles.includes(roleId) ?? false;
}

// ═══════════════════════════════════════════════════════════════════
// SOP ATTESTATION
// ═══════════════════════════════════════════════════════════════════

export interface SopAttestation {
  id: string;
  userId: string;
  sopId: string;
  sopVersion: string;
  attestedAt: string;
  attestationType: 'read' | 'trained' | 'assessed';
  assessmentScore?: number;
  assessmentPassed?: boolean;
  expiresAt: string;
  renewalRequired: boolean;
}

/**
 * Check if user has valid attestation for SOP
 */
export function hasValidAttestation(
  attestations: SopAttestation[],
  sopId: string
): boolean {
  const sop = getProcedure(sopId);
  if (!sop) return false;
  
  const attestation = attestations.find(a => 
    a.sopId === sopId && 
    a.sopVersion === sop.version &&
    new Date(a.expiresAt) > new Date()
  );
  
  return !!attestation;
}

/**
 * Get missing attestations for a role
 */
export function getMissingAttestations(
  roleId: RoleId,
  attestations: SopAttestation[]
): string[] {
  const requiredSops = getProceduresForRole(roleId)
    .filter(p => p.requiresAttestation)
    .map(p => p.id);
  
  return requiredSops.filter(sopId => !hasValidAttestation(attestations, sopId));
}
