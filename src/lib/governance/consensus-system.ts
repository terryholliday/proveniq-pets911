/**
 * CONSENSUS & DECISION MAKING SYSTEM
 * 
 * Enables volunteers to make collective decisions without staff intervention.
 * Inspired by Wikipedia's AfD, RFC, and consensus processes.
 * 
 * Decision Types:
 * - Quick Consensus: Simple decisions, 3 votes, 24 hours
 * - Standard Consensus: Important decisions, 5 votes, 72 hours
 * - Major Consensus: Policy changes, 10 votes, 7 days
 */

import type { RoleId } from '../roles';
import type { VolunteerReputation, StandingLevel } from './volunteer-governance';

// ═══════════════════════════════════════════════════════════════════
// DECISION TYPES
// ═══════════════════════════════════════════════════════════════════

export type DecisionType = 
  | 'case_action'        // Close case, escalate, etc.
  | 'match_verification' // Verify a potential match
  | 'volunteer_action'   // Action on a volunteer (warn, etc.)
  | 'dispute_resolution' // Resolve a dispute
  | 'policy_change'      // Change a procedure
  | 'promotion'          // Promote a volunteer
  | 'removal';           // Remove someone from role

export type ConsensusLevel = 'quick' | 'standard' | 'major';

export interface ConsensusConfig {
  level: ConsensusLevel;
  minVotes: number;
  durationHours: number;
  requiredMajority: number;  // Percentage (e.g., 66.7 for 2/3)
  minVoterTrust: number;     // Minimum trust score to vote
  canOverrideWith?: RoleId;  // Role that can override
}

export const CONSENSUS_CONFIGS: Record<ConsensusLevel, ConsensusConfig> = {
  quick: {
    level: 'quick',
    minVotes: 3,
    durationHours: 24,
    requiredMajority: 66.7,
    minVoterTrust: 200,
    canOverrideWith: 'lead_moderator',
  },
  standard: {
    level: 'standard',
    minVotes: 5,
    durationHours: 72,
    requiredMajority: 66.7,
    minVoterTrust: 300,
    canOverrideWith: 'regional_coordinator',
  },
  major: {
    level: 'major',
    minVotes: 10,
    durationHours: 168, // 7 days
    requiredMajority: 75,
    minVoterTrust: 500,
    canOverrideWith: 'foundation_admin',
  },
};

// Map decision types to consensus levels
export const DECISION_CONSENSUS_LEVELS: Record<DecisionType, ConsensusLevel> = {
  case_action: 'quick',
  match_verification: 'quick',
  volunteer_action: 'standard',
  dispute_resolution: 'standard',
  policy_change: 'major',
  promotion: 'standard',
  removal: 'major',
};

// ═══════════════════════════════════════════════════════════════════
// CONSENSUS PROPOSAL
// ═══════════════════════════════════════════════════════════════════

export interface ConsensusProposal {
  id: string;
  type: DecisionType;
  consensusLevel: ConsensusLevel;
  
  // Subject
  title: string;
  description: string;
  subjectId?: string;       // Case ID, volunteer ID, etc.
  subjectType?: string;
  
  // Proposer
  proposerId: string;
  proposerName: string;
  proposerTrust: number;
  proposedAt: string;
  
  // Options (for multi-choice decisions)
  options: ConsensusOption[];
  
  // Votes
  votes: ConsensusVote[];
  
  // Timeline
  votingEndsAt: string;
  status: ProposalStatus;
  
  // Discussion
  discussionThread: DiscussionMessage[];
  
  // Resolution
  outcome?: ConsensusOutcome;
}

export interface ConsensusOption {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
}

export interface ConsensusVote {
  odaineId: string;
  volunteerName: string;
  optionId: string;          // Which option they voted for
  weight: number;            // Based on trust score
  rationale?: string;
  votedAt: string;
  changedFrom?: string;      // If they changed their vote
}

export interface DiscussionMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorTrust: number;
  content: string;
  createdAt: string;
  replyToId?: string;
  reactions: { emoji: string; count: number; voters: string[] }[];
}

export type ProposalStatus = 
  | 'discussion'      // Open for discussion before voting
  | 'voting'          // Active voting period
  | 'pending_review'  // Voting ended, awaiting finalization
  | 'passed'
  | 'failed'
  | 'withdrawn'
  | 'overridden';     // Staff override

export interface ConsensusOutcome {
  winningOptionId: string;
  winningOptionLabel: string;
  voteBreakdown: { optionId: string; votes: number; weightedVotes: number }[];
  totalVotes: number;
  totalWeightedVotes: number;
  passedThreshold: boolean;
  resolvedAt: string;
  resolvedBy: string;      // 'consensus' or staff ID if overridden
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONSENSUS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new consensus proposal
 */
export function createProposal(params: {
  type: DecisionType;
  title: string;
  description: string;
  proposer: VolunteerReputation;
  options: { label: string; description: string }[];
  subjectId?: string;
  subjectType?: string;
}): ConsensusProposal {
  const consensusLevel = DECISION_CONSENSUS_LEVELS[params.type];
  const config = CONSENSUS_CONFIGS[consensusLevel];
  
  const votingEndsAt = new Date();
  votingEndsAt.setHours(votingEndsAt.getHours() + config.durationHours);
  
  return {
    id: crypto.randomUUID(),
    type: params.type,
    consensusLevel,
    title: params.title,
    description: params.description,
    subjectId: params.subjectId,
    subjectType: params.subjectType,
    proposerId: params.proposer.odaineId,
    proposerName: params.proposer.odaineName,
    proposerTrust: params.proposer.trustScore,
    proposedAt: new Date().toISOString(),
    options: params.options.map((o, i) => ({
      id: `option_${i}`,
      label: o.label,
      description: o.description,
    })),
    votes: [],
    votingEndsAt: votingEndsAt.toISOString(),
    status: 'voting',
    discussionThread: [],
  };
}

/**
 * Cast or change a vote
 */
export function castVote(
  proposal: ConsensusProposal,
  voter: VolunteerReputation,
  optionId: string,
  rationale?: string
): ConsensusProposal {
  const config = CONSENSUS_CONFIGS[proposal.consensusLevel];
  
  // Check voter eligibility
  if (voter.trustScore < config.minVoterTrust) {
    throw new Error(`Insufficient trust score (${voter.trustScore} < ${config.minVoterTrust})`);
  }
  
  // Check if voting is still open
  if (new Date() > new Date(proposal.votingEndsAt)) {
    throw new Error('Voting period has ended');
  }
  
  // Calculate vote weight (1.0 at threshold, up to 2.0 at max trust)
  const weight = Math.min(2.0, 1.0 + (voter.trustScore - config.minVoterTrust) / 1000);
  
  // Check for existing vote
  const existingVoteIdx = proposal.votes.findIndex(v => v.odaineId === voter.odaineId);
  
  const newVote: ConsensusVote = {
    odaineId: voter.odaineId,
    volunteerName: voter.odaineName,
    optionId,
    weight,
    rationale,
    votedAt: new Date().toISOString(),
    changedFrom: existingVoteIdx >= 0 ? proposal.votes[existingVoteIdx].optionId : undefined,
  };
  
  const newVotes = existingVoteIdx >= 0
    ? [...proposal.votes.slice(0, existingVoteIdx), newVote, ...proposal.votes.slice(existingVoteIdx + 1)]
    : [...proposal.votes, newVote];
  
  return { ...proposal, votes: newVotes };
}

/**
 * Calculate current vote tally
 */
export function tallyVotes(proposal: ConsensusProposal): ConsensusOutcome['voteBreakdown'] {
  const tally: Record<string, { votes: number; weightedVotes: number }> = {};
  
  // Initialize all options
  for (const option of proposal.options) {
    tally[option.id] = { votes: 0, weightedVotes: 0 };
  }
  
  // Count votes
  for (const vote of proposal.votes) {
    if (tally[vote.optionId]) {
      tally[vote.optionId].votes += 1;
      tally[vote.optionId].weightedVotes += vote.weight;
    }
  }
  
  return proposal.options.map(o => ({
    optionId: o.id,
    votes: tally[o.id]?.votes || 0,
    weightedVotes: tally[o.id]?.weightedVotes || 0,
  }));
}

/**
 * Check if proposal has reached consensus
 */
export function checkConsensus(proposal: ConsensusProposal): {
  hasConsensus: boolean;
  meetsMinVotes: boolean;
  meetsThreshold: boolean;
  winningOption: string | null;
  percentage: number;
} {
  const config = CONSENSUS_CONFIGS[proposal.consensusLevel];
  const breakdown = tallyVotes(proposal);
  
  const totalVotes = proposal.votes.length;
  const totalWeighted = breakdown.reduce((sum, b) => sum + b.weightedVotes, 0);
  
  // Find winning option (by weighted votes)
  const sorted = [...breakdown].sort((a, b) => b.weightedVotes - a.weightedVotes);
  const winner = sorted[0];
  
  const percentage = totalWeighted > 0 ? (winner.weightedVotes / totalWeighted) * 100 : 0;
  const meetsMinVotes = totalVotes >= config.minVotes;
  const meetsThreshold = percentage >= config.requiredMajority;
  
  return {
    hasConsensus: meetsMinVotes && meetsThreshold,
    meetsMinVotes,
    meetsThreshold,
    winningOption: winner?.optionId || null,
    percentage,
  };
}

/**
 * Finalize a proposal
 */
export function finalizeProposal(
  proposal: ConsensusProposal,
  resolvedBy: string = 'consensus'
): ConsensusProposal {
  const breakdown = tallyVotes(proposal);
  const consensus = checkConsensus(proposal);
  
  const totalVotes = proposal.votes.length;
  const totalWeighted = breakdown.reduce((sum, b) => sum + b.weightedVotes, 0);
  
  const winningOption = proposal.options.find(o => o.id === consensus.winningOption);
  
  const outcome: ConsensusOutcome = {
    winningOptionId: consensus.winningOption || '',
    winningOptionLabel: winningOption?.label || 'No winner',
    voteBreakdown: breakdown,
    totalVotes,
    totalWeightedVotes: totalWeighted,
    passedThreshold: consensus.hasConsensus,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  };
  
  return {
    ...proposal,
    status: consensus.hasConsensus ? 'passed' : 'failed',
    outcome,
  };
}

// ═══════════════════════════════════════════════════════════════════
// REVIEW QUEUES (Like Stack Overflow)
// ═══════════════════════════════════════════════════════════════════

export type ReviewQueueType =
  | 'new_cases'           // Cases needing initial triage
  | 'potential_matches'   // Matches awaiting verification
  | 'volunteer_apps'      // Applications to review
  | 'flagged_content'     // Flagged for concerns
  | 'disputes'            // Open disputes
  | 'promotions';         // Promotion nominations

export interface ReviewQueueItem {
  id: string;
  queueType: ReviewQueueType;
  itemId: string;
  itemType: string;
  title: string;
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  
  // Assignment
  assignedTo?: string;
  assignedAt?: string;
  
  // Progress
  reviewsNeeded: number;
  reviewsCompleted: number;
  reviews: QueueReview[];
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface QueueReview {
  reviewerId: string;
  reviewerName: string;
  reviewerTrust: number;
  action: string;           // Queue-specific action taken
  notes?: string;
  reviewedAt: string;
}

/**
 * Get available review queue items for a volunteer
 */
export function getAvailableQueueItems(
  rep: VolunteerReputation,
  queueType: ReviewQueueType,
  allItems: ReviewQueueItem[]
): ReviewQueueItem[] {
  // Filter based on trust score and role
  const minTrust: Record<ReviewQueueType, number> = {
    new_cases: 200,
    potential_matches: 500,
    volunteer_apps: 600,
    flagged_content: 400,
    disputes: 700,
    promotions: 800,
  };
  
  if (rep.trustScore < minTrust[queueType]) {
    return [];
  }
  
  return allItems.filter(item => 
    item.queueType === queueType &&
    item.status === 'pending' &&
    !item.reviews.some(r => r.reviewerId === rep.odaineId) // Haven't reviewed yet
  );
}

// ═══════════════════════════════════════════════════════════════════
// QUICK ACTIONS (No consensus needed)
// ═══════════════════════════════════════════════════════════════════

/**
 * Actions that trusted volunteers can take unilaterally
 * but are logged and can be reversed by peers
 */
export interface QuickAction {
  id: string;
  actionType: string;
  actorId: string;
  actorName: string;
  actorTrust: number;
  subjectId: string;
  subjectType: string;
  description: string;
  performedAt: string;
  
  // Reversibility
  reversible: boolean;
  reversedAt?: string;
  reversedBy?: string;
  reverseReason?: string;
  
  // Review
  challengedAt?: string;
  challengedBy?: string;
  challengeReason?: string;
  challengeStatus?: 'open' | 'upheld' | 'overturned';
}

export const QUICK_ACTION_TRUST_REQUIREMENTS: Record<string, number> = {
  add_case_note: 100,
  update_case_status: 300,
  assign_volunteer: 400,
  send_notification: 300,
  flag_for_review: 200,
  close_resolved_case: 500,
  reopen_case: 600,
};

/**
 * Check if volunteer can perform quick action
 */
export function canPerformQuickAction(
  rep: VolunteerReputation,
  actionType: string
): boolean {
  const required = QUICK_ACTION_TRUST_REQUIREMENTS[actionType];
  return required !== undefined && rep.trustScore >= required;
}
