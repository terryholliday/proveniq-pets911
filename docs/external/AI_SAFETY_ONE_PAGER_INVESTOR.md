# AI Safety One-Pager (Investor / Enterprise)

## What this is
The Pet Crisis Support Companion is a safety-critical AI support system for pet loss and crisis scenarios. It is engineered to be **deterministic**, **auditable**, and **fail-closed** in high-risk conditions.

## Why it matters
In crisis-adjacent domains, the primary failure mode is not “bad UX” — it’s **human harm**, **privacy harm**, and **regulatory exposure**. This system is designed to reduce those risks with mechanical enforcement.

## Safety-critical design (what is different)
### Deterministic routing (not probabilistic improvisation)
- Inputs are routed through a **canonical priority order**.
- Highest-risk categories (suicide, DV coercive control) are evaluated first.
- No category can silently “win” over higher-risk triage.

### Canonical response templates (contract-based output)
- Every response category uses a predefined `RESPONSE_TEMPLATES` entry.
- Each template includes:
  - `mustContain` required safety elements
  - `mustNotContain` banned phrases
- This creates enforceable output constraints.

### No success-rate stats / no certainty claims
- The system explicitly blocks user-facing claims like percentages or guaranteed outcomes.
- Responses use uncertainty language + actionable next steps.

### Privacy by design for DV contexts
- DV coercive-control category includes explicit guidance to **not share exact location or shelter address**.
- The system avoids prompting for identifying details in sensitive contexts.

## Compliance readiness
### SOC 2 / ISO / NIST mapping
- Governance and controls are mapped to SOC 2 and ISO/NIST frameworks.
- Evidence artifacts are defined for audit verification.

## How compliance is enforced (not merely documented)
### Automated governance in CI
A governance script (`scripts/canon-governance.js`) **fails the build** if:
- Suicide triage is not first
- Priority order drifts
- Templates are missing or contracts fail
- Test coverage per category falls below minimum
- Unsafe typing patterns appear
- Prohibited statistical claims appear

## Proof points (verifiable)
- `npm run governance` produces a deterministic pass/fail result
- Unit tests validate routing + content constraints
- CI workflow runs governance and tests on every change

## Where to review
- `docs/governance/ai-safety/EXEC_SUMMARY_REGULATOR.md`
- `docs/governance/ai-safety/AI_SAFETY_CANON.md`
- `docs/governance/ai-safety/CONTROL_MAPPING_AI.md`
- `docs/governance/ai-safety/ISO_NIST_MAPPING_AI.md`

---

**Version**: v1.0  
**Date**: 2025-01-05
