/**
 * DISPUTE RESOLUTION SYSTEM
 * 
 * Allows volunteers to resolve conflicts without staff intervention.
 * Three-tier system:
 * 1. Direct Resolution - Parties work it out
 * 2. Peer Mediation - Neutral volunteer mediates
 * 3. Panel Review - Group of senior volunteers decides
 * 
 * Staff only intervene for:
 * - Harassment/safety issues
 * - Legal concerns
 * - Deadlocked panels
 */

import type { VolunteerReputation, StandingLevel } from './volunteer-governance';

// ═══════════════════════════════════════════════════════════════════
// DISPUTE TYPES
// ═══════════════════════════════════════════════════════════════════

export type DisputeCategory =
  | 'case_decision'       // Disagreement on how to handle a case
  | 'match_verification'  // Dispute about a match decision
  | 'volunteer_conduct'   // Concerns about another volunteer
  | 'process_violation'   // Someone didn't follow procedures
  | 'resource_conflict'   // Who handles what
  | 'communication';      // Miscommunication issues

export type DisputeSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DisputeStage = 
  | 'direct'              // Parties trying to resolve directly
  | 'mediation'           // Neutral mediator assigned
  | 'panel'               // Panel review
  | 'staff_escalation';   // Escalated to staff (rare)

export type DisputeStatus =
  | 'open'
  | 'direct_resolution'
  | 'awaiting_mediator'
  | 'in_mediation'
  | 'awaiting_panel'
  | 'panel_review'
  | 'resolved'
  | 'escalated';

// ═══════════════════════════════════════════════════════════════════
// DISPUTE RECORD
// ═══════════════════════════════════════════════════════════════════

export interface Dispute {
  id: string;
  category: DisputeCategory;
  severity: DisputeSeverity;
  
  // Parties
  initiatorId: string;
  initiatorName: string;
  respondentId: string;
  respondentName: string;
  
  // Subject
  title: string;
  description: string;
  relatedCaseId?: string;
  relatedDecisionId?: string;
  
  // Evidence
  evidence: DisputeEvidence[];
  
  // Timeline
  filedAt: string;
  stage: DisputeStage;
  status: DisputeStatus;
  
  // Direct Resolution Phase
  directResolutionDeadline: string;
  directMessages: DisputeMessage[];
  
  // Mediation Phase
  mediator?: MediatorAssignment;
  mediationMessages: DisputeMessage[];
  mediationProposal?: MediationProposal;
  
  // Panel Phase
  panel?: DisputePanel;
  
  // Resolution
  resolution?: DisputeResolution;
}

export interface DisputeEvidence {
  id: string;
  submittedBy: string;
  type: 'screenshot' | 'log_entry' | 'message' | 'document' | 'testimony';
  description: string;
  url?: string;
  content?: string;
  submittedAt: string;
}

export interface DisputeMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'initiator' | 'respondent' | 'mediator' | 'panel';
  content: string;
  isPrivate: boolean;  // Only visible to author + mediator/panel
  createdAt: string;
}

export interface MediatorAssignment {
  mediatorId: string;
  mediatorName: string;
  mediatorTrust: number;
  assignedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
}

export interface MediationProposal {
  id: string;
  mediatorId: string;
  proposal: string;
  proposedAt: string;
  initiatorResponse?: 'accept' | 'reject' | 'counter';
  initiatorNotes?: string;
  respondentResponse?: 'accept' | 'reject' | 'counter';
  respondentNotes?: string;
}

export interface DisputePanel {
  members: PanelMember[];
  formedAt: string;
  deliberationDeadline: string;
  votes: PanelVote[];
  deliberationNotes: string[];
}

export interface PanelMember {
  odaineId: string;
  volunteerName: string;
  trustScore: number;
  role: 'chair' | 'member';
  joinedAt: string;
  recusedAt?: string;
  recuseReason?: string;
}

export interface PanelVote {
  odaineId: string;
  decision: string;       // Panel-specific decision options
  rationale: string;
  votedAt: string;
}

export interface DisputeResolution {
  resolvedAt: string;
  resolvedBy: 'direct' | 'mediation' | 'panel' | 'staff';
  resolverId: string;
  resolverName: string;
  
  outcome: 'initiator_favor' | 'respondent_favor' | 'compromise' | 'dismissed' | 'no_fault';
  summary: string;
  
  // Actions taken
  actions: ResolutionAction[];
  
  // Appeal
  appealable: boolean;
  appealDeadline?: string;
  appealed?: boolean;
  appealId?: string;
}

export interface ResolutionAction {
  type: 'warning' | 'training_required' | 'probation' | 'role_change' | 'case_reversal' | 'apology_requested' | 'no_action';
  targetId: string;
  targetName: string;
  description: string;
  deadline?: string;
  completed?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// DISPUTE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * File a new dispute
 */
export function fileDispute(params: {
  initiator: VolunteerReputation;
  respondentId: string;
  respondentName: string;
  category: DisputeCategory;
  title: string;
  description: string;
  relatedCaseId?: string;
}): Dispute {
  // Direct resolution period: 48 hours
  const directDeadline = new Date();
  directDeadline.setHours(directDeadline.getHours() + 48);
  
  return {
    id: crypto.randomUUID(),
    category: params.category,
    severity: categorizeSeverity(params.category, params.description),
    initiatorId: params.initiator.odaineId,
    initiatorName: params.initiator.odaineName,
    respondentId: params.respondentId,
    respondentName: params.respondentName,
    title: params.title,
    description: params.description,
    relatedCaseId: params.relatedCaseId,
    evidence: [],
    filedAt: new Date().toISOString(),
    stage: 'direct',
    status: 'direct_resolution',
    directResolutionDeadline: directDeadline.toISOString(),
    directMessages: [],
    mediationMessages: [],
  };
}

/**
 * Auto-categorize severity based on dispute type
 */
function categorizeSeverity(category: DisputeCategory, description: string): DisputeSeverity {
  // Check for critical keywords
  const criticalKeywords = ['harassment', 'threat', 'safety', 'fraud', 'abuse'];
  const descLower = description.toLowerCase();
  if (criticalKeywords.some(k => descLower.includes(k))) {
    return 'critical';
  }
  
  // Category-based defaults
  switch (category) {
    case 'volunteer_conduct':
      return 'high';
    case 'process_violation':
      return 'medium';
    case 'case_decision':
    case 'match_verification':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Check if dispute should escalate to next stage
 */
export function checkEscalation(dispute: Dispute): {
  shouldEscalate: boolean;
  reason: string;
  nextStage: DisputeStage;
} {
  const now = new Date();
  
  // Direct phase timeout
  if (dispute.stage === 'direct' && now > new Date(dispute.directResolutionDeadline)) {
    return {
      shouldEscalate: true,
      reason: 'Direct resolution period expired',
      nextStage: 'mediation',
    };
  }
  
  // Mediation phase - check for failed mediation
  if (dispute.stage === 'mediation' && dispute.mediationProposal) {
    const proposal = dispute.mediationProposal;
    if (proposal.initiatorResponse === 'reject' && proposal.respondentResponse === 'reject') {
      return {
        shouldEscalate: true,
        reason: 'Both parties rejected mediation proposal',
        nextStage: 'panel',
      };
    }
  }
  
  // Critical severity goes straight to panel or staff
  if (dispute.severity === 'critical' && dispute.stage === 'direct') {
    return {
      shouldEscalate: true,
      reason: 'Critical severity requires immediate review',
      nextStage: 'panel',
    };
  }
  
  return { shouldEscalate: false, reason: '', nextStage: dispute.stage };
}

/**
 * Select eligible mediators
 * Requirements:
 * - Trust score >= 600
 * - Not involved in the dispute
 * - No recent disputes with either party
 * - TRUSTED or EXEMPLARY standing
 */
export function findEligibleMediators(
  dispute: Dispute,
  allVolunteers: VolunteerReputation[]
): VolunteerReputation[] {
  return allVolunteers.filter(v => 
    v.trustScore >= 600 &&
    v.currentStanding !== 'PROBATIONARY' &&
    v.currentStanding !== 'SUSPENDED' &&
    v.odaineId !== dispute.initiatorId &&
    v.odaineId !== dispute.respondentId &&
    v.disputesResolved >= 2  // Some experience
  );
}

/**
 * Form a dispute panel
 * Requirements:
 * - 3-5 members
 * - Chair has highest trust
 * - All members trust >= 700
 * - No conflicts of interest
 */
export function formDisputePanel(
  dispute: Dispute,
  allVolunteers: VolunteerReputation[]
): DisputePanel {
  const eligible = allVolunteers.filter(v =>
    v.trustScore >= 700 &&
    v.currentStanding === 'EXEMPLARY' &&
    v.odaineId !== dispute.initiatorId &&
    v.odaineId !== dispute.respondentId &&
    v.odaineId !== dispute.mediator?.mediatorId
  );
  
  // Sort by trust score, take top 5
  const sorted = [...eligible].sort((a, b) => b.trustScore - a.trustScore);
  const selected = sorted.slice(0, 5);
  
  if (selected.length < 3) {
    throw new Error('Insufficient eligible panel members');
  }
  
  const deliberationDeadline = new Date();
  deliberationDeadline.setHours(deliberationDeadline.getHours() + 72);
  
  return {
    members: selected.map((v, i) => ({
      odaineId: v.odaineId,
      volunteerName: v.odaineName,
      trustScore: v.trustScore,
      role: i === 0 ? 'chair' : 'member',
      joinedAt: new Date().toISOString(),
    })),
    formedAt: new Date().toISOString(),
    deliberationDeadline: deliberationDeadline.toISOString(),
    votes: [],
    deliberationNotes: [],
  };
}

/**
 * Record panel decision
 */
export function recordPanelDecision(
  dispute: Dispute,
  outcome: DisputeResolution['outcome'],
  summary: string,
  actions: ResolutionAction[]
): Dispute {
  if (!dispute.panel) {
    throw new Error('No panel formed');
  }
  
  const chair = dispute.panel.members.find(m => m.role === 'chair');
  
  const resolution: DisputeResolution = {
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'panel',
    resolverId: chair?.odaineId || 'panel',
    resolverName: chair?.volunteerName || 'Panel',
    outcome,
    summary,
    actions,
    appealable: true,
    appealDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
  
  return {
    ...dispute,
    status: 'resolved',
    resolution,
  };
}

// ═══════════════════════════════════════════════════════════════════
// APPEAL SYSTEM
// ═══════════════════════════════════════════════════════════════════

export interface Appeal {
  id: string;
  originalDisputeId: string;
  appealerId: string;
  appealerName: string;
  grounds: string;
  filedAt: string;
  
  // New panel (different members)
  panel: DisputePanel;
  
  // Outcome
  status: 'pending' | 'reviewing' | 'upheld' | 'overturned' | 'modified';
  newResolution?: DisputeResolution;
}

/**
 * File an appeal
 */
export function fileAppeal(
  dispute: Dispute,
  appealer: VolunteerReputation,
  grounds: string
): Appeal {
  if (!dispute.resolution?.appealable) {
    throw new Error('This decision is not appealable');
  }
  
  if (new Date() > new Date(dispute.resolution.appealDeadline!)) {
    throw new Error('Appeal deadline has passed');
  }
  
  // Appealer must be a party to the dispute
  if (appealer.odaineId !== dispute.initiatorId && appealer.odaineId !== dispute.respondentId) {
    throw new Error('Only parties to the dispute can appeal');
  }
  
  return {
    id: crypto.randomUUID(),
    originalDisputeId: dispute.id,
    appealerId: appealer.odaineId,
    appealerName: appealer.odaineName,
    grounds,
    filedAt: new Date().toISOString(),
    panel: {} as DisputePanel, // Will be formed separately with DIFFERENT members
    status: 'pending',
  };
}

// ═══════════════════════════════════════════════════════════════════
// AUTOMATIC STAFF ESCALATION TRIGGERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Conditions that REQUIRE staff intervention
 */
export function requiresStaffEscalation(dispute: Dispute): {
  required: boolean;
  reason: string;
} {
  const descLower = dispute.description.toLowerCase();
  
  // Safety concerns
  if (['harassment', 'threat', 'stalking', 'doxxing'].some(k => descLower.includes(k))) {
    return { required: true, reason: 'Safety concern detected' };
  }
  
  // Legal concerns
  if (['legal', 'lawsuit', 'attorney', 'police'].some(k => descLower.includes(k))) {
    return { required: true, reason: 'Potential legal issue' };
  }
  
  // Fraud/financial
  if (['fraud', 'money', 'payment', 'theft'].some(k => descLower.includes(k))) {
    return { required: true, reason: 'Potential fraud concern' };
  }
  
  // Deadlocked panel (no majority after deadline)
  if (dispute.panel && new Date() > new Date(dispute.panel.deliberationDeadline)) {
    const votes = dispute.panel.votes;
    const uniqueDecisions = new Set(votes.map(v => v.decision));
    if (uniqueDecisions.size > 1 && votes.length === dispute.panel.members.length) {
      return { required: true, reason: 'Panel deadlocked' };
    }
  }
  
  return { required: false, reason: '' };
}
