# CI Evidence Capture — Screenshot Checklist (AI Safety)

## Purpose
Provide a repeatable checklist for capturing SOC 2 audit evidence from CI runs and local verification.

## Required Metadata (record with each capture)
- **Date/time (UTC)**:
- **Git commit SHA**:
- **Branch / Tag**:
- **Operator**:
- **Environment**: local / CI

## CI Evidence (GitHub Actions)
### A. Canon Governance Workflow Run
1. Open the workflow run for the target commit.
2. Capture screenshot of:
   - Workflow name
   - Commit SHA
   - Status = success
3. Open job logs and capture:
   - `npm run governance` output showing `✅ ALL GOVERNANCE CHECKS PASSED`
   - `npm test` output (or counselor-engine test step) showing pass

### B. Artifact Retention (if configured)
- Capture the artifacts section showing:
  - Test results
  - Coverage report (if produced)

## Local Evidence (Developer Machine)
### A. Governance Pass
Run:
- `npm run governance`

Capture:
- Full output showing all checks passing

### B. Targeted Test Pass
Run:
- `npm test -- --testPathPattern=counselor-engine`

Capture:
- Test summary showing pass

## What auditors should be able to verify
- The commit SHA shown in CI matches the commit under review
- Governance checks are executed and pass
- Tests are executed and pass
- Evidence is attributable (date/time, operator)

## Naming Convention
Save files as:
- `<YYYY-MM-DD>_<sha>_AI_GOVERNANCE_PASS.png`
- `<YYYY-MM-DD>_<sha>_AI_TESTS_PASS.png`
- `<YYYY-MM-DD>_<sha>_AI_WORKFLOW_SUMMARY.png`

---

**Version**: v1.0  
**Date**: 2025-01-05
