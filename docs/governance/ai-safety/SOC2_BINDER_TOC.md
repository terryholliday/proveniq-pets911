# SOC 2 Evidence Binder — Table of Contents
AI Safety & Crisis Support System

**System**: Pet Crisis Support Companion  
**Binder Type**: SOC 2 Type I / Type II Evidence Binder  
**Audience**: Auditors, regulators, enterprise partners  
**Version**: v1.0 (AI Safety)  

## SECTION 1 — EXECUTIVE OVERVIEW
### 1.1 System Description
### 1.2 Scope of SOC Review
### 1.3 Trust Service Criteria Covered
### 1.4 Safety-Critical Classification Rationale

**Files**
- `docs/governance/ai-safety/EXEC_SUMMARY_REGULATOR.md`
- `docs/external/AI_SAFETY_ONE_PAGER_INVESTOR.md`

## SECTION 2 — GOVERNANCE & CANONICAL LAW
### 2.1 AI Safety Governance Model
### 2.2 Canonical Priority Order (Authoritative)
### 2.3 Deterministic Routing Policy
### 2.4 No Silent Downgrade Policy

**Files**
- `docs/governance/ai-safety/AI_SAFETY_CANON.md`
- `docs/governance/ai-safety/CONTROL_MAPPING_AI.md`

## SECTION 3 — RISK ASSESSMENT
### 3.1 Suicide Risk & Human Harm Risk
### 3.2 False Positive Escalation Risk
### 3.3 Misclassification Risk
### 3.4 Change Regression Risk

**Files**
- `docs/governance/ai-safety/SOC2_AI_SAFETY_NARRATIVE.md`

## SECTION 4 — CONTROL DESIGN & IMPLEMENTATION
### 4.1 Suicide Risk Triage Controls
### 4.2 Priority Enforcement Controls
### 4.3 Negation & Attribution Guards
### 4.4 Response Template Enforcement
### 4.5 Type Safety & Determinism Controls

**Files**
- `docs/governance/ai-safety/CONTROL_MAPPING_AI.md`
- `docs/governance/ai-safety/ISO_NIST_MAPPING_AI.md`

## SECTION 5 — CONTROL EVIDENCE (EXHIBITS)
### 5.1 EXHIBIT_AI-01 — Priority Order Enforcement
### 5.2 EXHIBIT_AI-02 — Suicide Triage Escalation
### 5.3 EXHIBIT_AI-03 — Negation & Attribution Guards
### 5.4 EXHIBIT_AI-04 — Response Template Enforcement
### 5.5 EXHIBIT_AI-05 — Rollback & Change Control

**Files**
- `docs/evidence/ai-safety/exhibits/EXHIBIT_AI-01_PRIORITY_ORDER.md`
- `docs/evidence/ai-safety/exhibits/EXHIBIT_AI-02_SUICIDE_TRIAGE.md`
- `docs/evidence/ai-safety/exhibits/EXHIBIT_AI-03_NEGATION_GUARDS.md`
- `docs/evidence/ai-safety/exhibits/EXHIBIT_AI-04_TEMPLATE_ENFORCEMENT.md`
- `docs/evidence/ai-safety/exhibits/EXHIBIT_AI-05_ROLLBACK_CONTROLS.md`

## SECTION 6 — TESTING & VALIDATION
### 6.1 Unit Test Coverage Summary
### 6.2 Boundary Case Testing
### 6.3 Priority Collision Tests
### 6.4 Suicide Hardening Tests

**Evidence Sources**
- Canonical test suite(s): `__tests__/counselor-engine.test.ts`
- CI governance run output: `npm run governance` (captured per release)
- CI test output artifacts: GitHub Actions run logs / artifacts

## SECTION 7 — CHANGE MANAGEMENT
### 7.1 Baseline Recording Process
### 7.2 Fix-Loop Enforcement
### 7.3 Rollback Procedures
### 7.4 Human Approval Requirements

**Files**
- `docs/evidence/ai-safety/ci/CI_SCREENSHOT_CHECKLIST.md`

## SECTION 8 — CONTINUOUS MONITORING & AUDITABILITY
### 8.1 CI Assertions
### 8.2 Drift Detection
### 8.3 Evidence Retention

**Primary Mechanism**
- Automated checks implemented in `scripts/canon-governance.js` and CI workflow `.github/workflows/canon-governance.yml`

## SECTION 9 — MANAGEMENT ASSERTION
### 9.1 Statement of Control Effectiveness
### 9.2 Period of Review

---

## Appendix A — Evidence Collection Conventions
- **Record identifier**: `<YYYY-MM-DD>_<git-sha>_<control-id>`
- **Required metadata**: date/time (UTC), git commit SHA, environment, operator
- **Storage**: attach to the audit package or evidence repository per your internal policy

## Appendix B — Automated CI Assertions (Fail-the-Build)
Automated fail conditions are implemented in `scripts/canon-governance.js` and enforced via CI.

- **Priority Order Assertion**: suicide triage must be first routing branch
- **Response Template Completeness**: every category must have template rules
- **Must-Contain / Must-Not-Contain Enforcement**: responses must satisfy contracts
- **Negation & Attribution Guard Assertion**: negated language must not escalate
- **Type Safety Assertion**: block any unsafe typing patterns
- **Drift Detection Assertion**: required governance docs must exist
- **Rollback Safety Assertion**: refuse to claim completion without changes
