/**
 * PET911 SERVICE LAYER V2
 * 
 * Core services for volunteer applications, training, safety, and verification.
 * All services follow strict architectural constraints:
 * - Cost Control: Background checks deferred to Phase 2
 * - Automation First: Deterministic scoring, minimal human intervention
 * - Safety & Liability: 80+ points for animal release, lone worker protocols
 * - Auditability: Immutable logs, court-safe state transitions
 * - Type Safety: Branded types, state machine validation
 */

// Infrastructure
export * from './infrastructure';

// Core Services
export * from './application.service';
export * from './safety.service';
export * from './verification.service';
export * from './training-progress.service';
