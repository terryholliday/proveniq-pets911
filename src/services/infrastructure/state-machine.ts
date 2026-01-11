/**
 * STATE MACHINE - Finite State Transition Validator
 * 
 * Enforces valid state transitions for applications, training, safety, etc.
 * All transitions are deterministic and auditable.
 * 
 * CONSTRAINTS:
 * - Transitions must be explicitly defined
 * - Invalid transitions throw (fail fast)
 * - No hard deletes - use ARCHIVED status
 */

import type { UserId } from '@/modules/operations/types';

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StateDefinition<S extends string> {
  name: S;
  isFinal: boolean;
  isArchived?: boolean;
}

export interface TransitionDefinition<S extends string, T extends string> {
  from: S | S[];
  to: S;
  trigger: T;
  guard?: (context: TransitionContext) => boolean;
  requiresTwoPersonApproval?: boolean;
}

export interface TransitionContext {
  actor: UserId | 'SYSTEM';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionResult<S extends string, T extends string> {
  success: boolean;
  fromState: S;
  toState: S;
  trigger: T;
  actor: UserId | 'SYSTEM';
  timestamp: string;
  error?: string;
}

export interface StateMachineConfig<S extends string, T extends string> {
  name: string;
  initialState: S;
  states: StateDefinition<S>[];
  transitions: TransitionDefinition<S, T>[];
}

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class StateMachine<S extends string, T extends string> {
  private readonly config: StateMachineConfig<S, T>;
  private readonly stateMap: Map<S, StateDefinition<S>>;
  private readonly transitionMap: Map<string, TransitionDefinition<S, T>>;

  constructor(config: StateMachineConfig<S, T>) {
    this.config = config;
    this.stateMap = new Map(config.states.map(s => [s.name, s]));
    this.transitionMap = new Map();

    for (const transition of config.transitions) {
      const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];
      for (const from of fromStates) {
        const key = `${from}:${transition.trigger}`;
        this.transitionMap.set(key, transition);
      }
    }
  }

  get name(): string {
    return this.config.name;
  }

  get initialState(): S {
    return this.config.initialState;
  }

  canTransition(currentState: S, trigger: T, context?: TransitionContext): boolean {
    const key = `${currentState}:${trigger}`;
    const transition = this.transitionMap.get(key);

    if (!transition) {
      return false;
    }

    if (transition.guard && context && !transition.guard(context)) {
      return false;
    }

    return true;
  }

  transition(
    currentState: S,
    trigger: T,
    context: TransitionContext
  ): TransitionResult<S, T> {
    const key = `${currentState}:${trigger}`;
    const transition = this.transitionMap.get(key);

    if (!transition) {
      return {
        success: false,
        fromState: currentState,
        toState: currentState,
        trigger,
        actor: context.actor,
        timestamp: context.timestamp,
        error: `Invalid transition: ${currentState} -> ${trigger}`,
      };
    }

    if (transition.guard && !transition.guard(context)) {
      return {
        success: false,
        fromState: currentState,
        toState: currentState,
        trigger,
        actor: context.actor,
        timestamp: context.timestamp,
        error: `Transition guard failed: ${currentState} -> ${trigger}`,
      };
    }

    return {
      success: true,
      fromState: currentState,
      toState: transition.to,
      trigger,
      actor: context.actor,
      timestamp: context.timestamp,
    };
  }

  getValidTriggers(currentState: S): T[] {
    const triggers: T[] = [];
    for (const [key, transition] of Array.from(this.transitionMap.entries())) {
      if (key.startsWith(`${currentState}:`)) {
        triggers.push(transition.trigger as T);
      }
    }
    return triggers;
  }

  isFinalState(state: S): boolean {
    return this.stateMap.get(state)?.isFinal ?? false;
  }

  isArchivedState(state: S): boolean {
    return this.stateMap.get(state)?.isArchived ?? false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION STATE MACHINE (Two-Phase)
// ═══════════════════════════════════════════════════════════════════

export type ApplicationState =
  | 'DRAFT'
  | 'P1_SUBMITTED'
  | 'P1_UNDER_REVIEW'
  | 'P1_APPROVED'
  | 'P1_REJECTED'
  | 'P2_BACKGROUND_CHECK'
  | 'P2_TRAINING'
  | 'P2_INTERVIEW'
  | 'P2_FINAL_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'ARCHIVED';

export type ApplicationTrigger =
  | 'SUBMIT_P1'
  | 'START_P1_REVIEW'
  | 'APPROVE_P1'
  | 'REJECT_P1'
  | 'START_BACKGROUND_CHECK'
  | 'BACKGROUND_CHECK_PASSED'
  | 'BACKGROUND_CHECK_FAILED'
  | 'START_TRAINING'
  | 'TRAINING_COMPLETED'
  | 'SCHEDULE_INTERVIEW'
  | 'INTERVIEW_PASSED'
  | 'INTERVIEW_FAILED'
  | 'START_FINAL_REVIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'WITHDRAW'
  | 'EXPIRE'
  | 'ARCHIVE';

export const applicationStateMachine = new StateMachine<ApplicationState, ApplicationTrigger>({
  name: 'VolunteerApplication',
  initialState: 'DRAFT',
  states: [
    { name: 'DRAFT', isFinal: false },
    { name: 'P1_SUBMITTED', isFinal: false },
    { name: 'P1_UNDER_REVIEW', isFinal: false },
    { name: 'P1_APPROVED', isFinal: false },
    { name: 'P1_REJECTED', isFinal: true },
    { name: 'P2_BACKGROUND_CHECK', isFinal: false },
    { name: 'P2_TRAINING', isFinal: false },
    { name: 'P2_INTERVIEW', isFinal: false },
    { name: 'P2_FINAL_REVIEW', isFinal: false },
    { name: 'APPROVED', isFinal: true },
    { name: 'REJECTED', isFinal: true },
    { name: 'WITHDRAWN', isFinal: true },
    { name: 'EXPIRED', isFinal: true },
    { name: 'ARCHIVED', isFinal: true, isArchived: true },
  ],
  transitions: [
    // Phase 1: Free operations (no background check cost)
    { from: 'DRAFT', to: 'P1_SUBMITTED', trigger: 'SUBMIT_P1' },
    { from: 'P1_SUBMITTED', to: 'P1_UNDER_REVIEW', trigger: 'START_P1_REVIEW' },
    { from: 'P1_UNDER_REVIEW', to: 'P1_APPROVED', trigger: 'APPROVE_P1' },
    { from: 'P1_UNDER_REVIEW', to: 'P1_REJECTED', trigger: 'REJECT_P1' },

    // Phase 2: Background check ONLY after P1 approval (cost control)
    { from: 'P1_APPROVED', to: 'P2_BACKGROUND_CHECK', trigger: 'START_BACKGROUND_CHECK' },
    { from: 'P2_BACKGROUND_CHECK', to: 'P2_TRAINING', trigger: 'BACKGROUND_CHECK_PASSED' },
    { from: 'P2_BACKGROUND_CHECK', to: 'REJECTED', trigger: 'BACKGROUND_CHECK_FAILED' },

    // Training after background check
    { from: 'P2_TRAINING', to: 'P2_INTERVIEW', trigger: 'TRAINING_COMPLETED' },

    // Interview (optional for some roles)
    { from: 'P2_INTERVIEW', to: 'P2_FINAL_REVIEW', trigger: 'INTERVIEW_PASSED' },
    { from: 'P2_INTERVIEW', to: 'REJECTED', trigger: 'INTERVIEW_FAILED' },

    // Final review
    { from: 'P2_FINAL_REVIEW', to: 'APPROVED', trigger: 'APPROVE' },
    { from: 'P2_FINAL_REVIEW', to: 'REJECTED', trigger: 'REJECT' },

    // Withdrawal allowed from most states
    { from: ['DRAFT', 'P1_SUBMITTED', 'P1_UNDER_REVIEW', 'P1_APPROVED', 'P2_BACKGROUND_CHECK', 'P2_TRAINING', 'P2_INTERVIEW'], to: 'WITHDRAWN', trigger: 'WITHDRAW' },

    // Expiration
    { from: ['P1_SUBMITTED', 'P1_UNDER_REVIEW', 'P1_APPROVED', 'P2_BACKGROUND_CHECK', 'P2_TRAINING', 'P2_INTERVIEW'], to: 'EXPIRED', trigger: 'EXPIRE' },

    // Archive final states
    { from: ['P1_REJECTED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'], to: 'ARCHIVED', trigger: 'ARCHIVE' },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// TRAINING MODULE STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

export type TrainingModuleState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ASSESSMENT_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'OVERDUE'
  | 'ARCHIVED';

export type TrainingModuleTrigger =
  | 'START'
  | 'COMPLETE_LESSONS'
  | 'PASS_ASSESSMENT'
  | 'FAIL_ASSESSMENT'
  | 'MARK_OVERDUE'
  | 'RETRY'
  | 'ARCHIVE';

export const trainingModuleStateMachine = new StateMachine<TrainingModuleState, TrainingModuleTrigger>({
  name: 'TrainingModule',
  initialState: 'NOT_STARTED',
  states: [
    { name: 'NOT_STARTED', isFinal: false },
    { name: 'IN_PROGRESS', isFinal: false },
    { name: 'ASSESSMENT_PENDING', isFinal: false },
    { name: 'COMPLETED', isFinal: true },
    { name: 'FAILED', isFinal: false },
    { name: 'OVERDUE', isFinal: false },
    { name: 'ARCHIVED', isFinal: true, isArchived: true },
  ],
  transitions: [
    { from: 'NOT_STARTED', to: 'IN_PROGRESS', trigger: 'START' },
    { from: 'IN_PROGRESS', to: 'ASSESSMENT_PENDING', trigger: 'COMPLETE_LESSONS' },
    { from: 'ASSESSMENT_PENDING', to: 'COMPLETED', trigger: 'PASS_ASSESSMENT' },
    { from: 'ASSESSMENT_PENDING', to: 'FAILED', trigger: 'FAIL_ASSESSMENT' },
    { from: ['IN_PROGRESS', 'ASSESSMENT_PENDING'], to: 'OVERDUE', trigger: 'MARK_OVERDUE' },
    { from: ['FAILED', 'OVERDUE'], to: 'IN_PROGRESS', trigger: 'RETRY' },
    { from: ['COMPLETED', 'FAILED'], to: 'ARCHIVED', trigger: 'ARCHIVE' },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// FIELD OPERATION STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

export type FieldOpState =
  | 'PENDING'
  | 'ACTIVE'
  | 'CHECK_IN_OVERDUE'
  | 'ESCALATED_L1'
  | 'ESCALATED_L2'
  | 'ESCALATED_L3'
  | 'COMPLETED'
  | 'CANCELLED';

export type FieldOpTrigger =
  | 'START'
  | 'CHECK_IN'
  | 'MISS_CHECK_IN'
  | 'ESCALATE'
  | 'DE_ESCALATE'
  | 'COMPLETE'
  | 'CANCEL';

export const fieldOpStateMachine = new StateMachine<FieldOpState, FieldOpTrigger>({
  name: 'FieldOperation',
  initialState: 'PENDING',
  states: [
    { name: 'PENDING', isFinal: false },
    { name: 'ACTIVE', isFinal: false },
    { name: 'CHECK_IN_OVERDUE', isFinal: false },
    { name: 'ESCALATED_L1', isFinal: false },
    { name: 'ESCALATED_L2', isFinal: false },
    { name: 'ESCALATED_L3', isFinal: false },
    { name: 'COMPLETED', isFinal: true },
    { name: 'CANCELLED', isFinal: true },
  ],
  transitions: [
    { from: 'PENDING', to: 'ACTIVE', trigger: 'START' },
    { from: ['ACTIVE', 'CHECK_IN_OVERDUE'], to: 'ACTIVE', trigger: 'CHECK_IN' },
    { from: 'ACTIVE', to: 'CHECK_IN_OVERDUE', trigger: 'MISS_CHECK_IN' },
    { from: 'CHECK_IN_OVERDUE', to: 'ESCALATED_L1', trigger: 'ESCALATE' },
    { from: 'ESCALATED_L1', to: 'ESCALATED_L2', trigger: 'ESCALATE' },
    { from: 'ESCALATED_L2', to: 'ESCALATED_L3', trigger: 'ESCALATE' },
    { from: ['ESCALATED_L1', 'ESCALATED_L2', 'ESCALATED_L3'], to: 'ACTIVE', trigger: 'DE_ESCALATE' },
    { from: ['ACTIVE', 'CHECK_IN_OVERDUE', 'ESCALATED_L1', 'ESCALATED_L2', 'ESCALATED_L3'], to: 'COMPLETED', trigger: 'COMPLETE' },
    { from: ['PENDING', 'ACTIVE', 'CHECK_IN_OVERDUE'], to: 'CANCELLED', trigger: 'CANCEL' },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// OWNERSHIP CLAIM STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

export type ClaimState =
  | 'SUBMITTED'
  | 'EVIDENCE_COLLECTION'
  | 'UNDER_REVIEW'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'RELEASE_AUTHORIZED'
  | 'RELEASED'
  | 'ARCHIVED';

export type ClaimTrigger =
  | 'SUBMIT'
  | 'ADD_EVIDENCE'
  | 'START_REVIEW'
  | 'REQUEST_VERIFICATION'
  | 'VERIFY'
  | 'REJECT'
  | 'DISPUTE'
  | 'RESOLVE_DISPUTE'
  | 'AUTHORIZE_RELEASE'
  | 'COMPLETE_RELEASE'
  | 'ARCHIVE';

export const claimStateMachine = new StateMachine<ClaimState, ClaimTrigger>({
  name: 'OwnershipClaim',
  initialState: 'SUBMITTED',
  states: [
    { name: 'SUBMITTED', isFinal: false },
    { name: 'EVIDENCE_COLLECTION', isFinal: false },
    { name: 'UNDER_REVIEW', isFinal: false },
    { name: 'PENDING_VERIFICATION', isFinal: false },
    { name: 'VERIFIED', isFinal: false },
    { name: 'REJECTED', isFinal: true },
    { name: 'DISPUTED', isFinal: false },
    { name: 'RELEASE_AUTHORIZED', isFinal: false },
    { name: 'RELEASED', isFinal: true },
    { name: 'ARCHIVED', isFinal: true, isArchived: true },
  ],
  transitions: [
    { from: 'SUBMITTED', to: 'EVIDENCE_COLLECTION', trigger: 'ADD_EVIDENCE' },
    { from: 'EVIDENCE_COLLECTION', to: 'UNDER_REVIEW', trigger: 'START_REVIEW' },
    { from: 'UNDER_REVIEW', to: 'PENDING_VERIFICATION', trigger: 'REQUEST_VERIFICATION' },
    { from: 'PENDING_VERIFICATION', to: 'VERIFIED', trigger: 'VERIFY' },
    { from: ['UNDER_REVIEW', 'PENDING_VERIFICATION'], to: 'REJECTED', trigger: 'REJECT' },
    { from: ['UNDER_REVIEW', 'PENDING_VERIFICATION', 'VERIFIED'], to: 'DISPUTED', trigger: 'DISPUTE' },
    { from: 'DISPUTED', to: 'UNDER_REVIEW', trigger: 'RESOLVE_DISPUTE' },
    { from: 'VERIFIED', to: 'RELEASE_AUTHORIZED', trigger: 'AUTHORIZE_RELEASE' },
    { from: 'RELEASE_AUTHORIZED', to: 'RELEASED', trigger: 'COMPLETE_RELEASE' },
    { from: ['REJECTED', 'RELEASED'], to: 'ARCHIVED', trigger: 'ARCHIVE' },
  ],
});
