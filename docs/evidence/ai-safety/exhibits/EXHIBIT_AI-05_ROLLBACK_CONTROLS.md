# EXHIBIT_AI-05 — Rollback & Change Control

## Control Objective
Prevent unsafe changes from entering production and enable rollback when required.

## Control Statement
Changes to canonical counselor logic MUST be gated by automated governance checks and human review. If governance fails, deployment MUST be blocked.

## Implementation
- **Pre-commit Gate**: `.husky/pre-commit` runs governance + tests
- **CI Gate**: `.github/workflows/canon-governance.yml`
- **Diff Sanity**: `scripts/canon-governance.js` checks for sane diffs and required files

## Evidence Procedure
1. Show CI workflow requires governance checks.
2. Demonstrate governance failure blocks merge/deploy (by policy).
3. Verify rollback path:
   - Revert commit in version control
   - Re-run CI to confirm restored compliance

## Pass Criteria
- Automated checks are mandatory.
- Non-compliant changes cannot be merged.
- Rollback restores compliance.

## Evidence to Attach
- Screenshot of CI required checks (branch protection / PR checks).
- CI run showing governance executed.

---

**Control Mapping**: SOC2 CC6.2 / ISO A.8.9 / NIST PR.IP-2
