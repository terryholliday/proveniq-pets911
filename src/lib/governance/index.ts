/**
 * Volunteer Self-Governance Module
 * 
 * Wikipedia/Reddit-inspired system for volunteer self-management.
 * Minimizes need for staff intervention through:
 * - Trust & reputation tracking
 * - Peer accountability
 * - Consensus decision-making
 * - Transparent dispute resolution
 */

// Volunteer Reputation & Trust
export {
  BADGE_DEFINITIONS,
  PRIVILEGES,
  PROMOTION_REQUIREMENTS,
  calculateTrustScore,
  determineStanding,
  hasPrivilege,
  getPrivileges,
  getNextPrivilege,
  createEndorsement,
  checkPromotionRequirements,
  calculatePromotionResult,
} from './volunteer-governance';

export type {
  VolunteerReputation,
  StandingLevel,
  Badge,
  TrustFactors,
  Privilege,
  EndorsementType,
  PeerEndorsement,
  PeerConcern,
  ConcernType,
  PromotionNomination,
  PromotionVote,
} from './volunteer-governance';

// Consensus System
export {
  CONSENSUS_CONFIGS,
  DECISION_CONSENSUS_LEVELS,
  QUICK_ACTION_TRUST_REQUIREMENTS,
  createProposal,
  castVote,
  tallyVotes,
  checkConsensus,
  finalizeProposal,
  getAvailableQueueItems,
  canPerformQuickAction,
} from './consensus-system';

export type {
  DecisionType,
  ConsensusLevel,
  ConsensusConfig,
  ConsensusProposal,
  ConsensusOption,
  ConsensusVote,
  DiscussionMessage,
  ProposalStatus,
  ConsensusOutcome,
  ReviewQueueType,
  ReviewQueueItem,
  QueueReview,
  QuickAction,
} from './consensus-system';

// Dispute Resolution
export {
  fileDispute,
  checkEscalation,
  findEligibleMediators,
  formDisputePanel,
  recordPanelDecision,
  fileAppeal,
  requiresStaffEscalation,
} from './dispute-resolution';

export type {
  DisputeCategory,
  DisputeSeverity,
  DisputeStage,
  DisputeStatus,
  Dispute,
  DisputeEvidence,
  DisputeMessage,
  MediatorAssignment,
  MediationProposal,
  DisputePanel,
  PanelMember,
  PanelVote,
  DisputeResolution,
  ResolutionAction,
  Appeal,
} from './dispute-resolution';

// Transparency & Accountability
export {
  queryAuditTrail,
  generateLeaderboard,
  createGovernanceNotification,
} from './transparency';

export type {
  ActivityType,
  ActivityLogEntry,
  PublicVolunteerProfile,
  DecisionLogEntry,
  TransparencyReport,
  AuditTrailQuery,
  LeaderboardEntry,
  LeaderboardType,
  GovernanceNotification,
  NotificationType,
} from './transparency';
