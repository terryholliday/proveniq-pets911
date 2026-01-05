# EXHIBIT_AI-01 — Priority Order Enforcement

## Control Objective
Ensure suicide risk triage and other high-risk categories are evaluated before lower-risk categories (deterministic risk-first routing).

## Control Statement
The counselor engine MUST follow the canonical priority order. CI MUST fail if priority order drifts.

## Implementation
- **Engine**: `src/lib/ai/counselor-engine.ts` (`generateCompanionResponse`)
- **Governance Enforcement**: `scripts/canon-governance.js` (priority-order check)
- **CI Workflow**: `.github/workflows/canon-governance.yml`

## Test / Evidence Procedure
1. Run `npm run governance`.
2. Verify output includes:
   - `CHECKING PRIORITY ORDER...`
   - `PASS: Priority order matches canonical specification`

## Pass Criteria
- Governance run passes.
- Priority check reports PASS.

## Failure Mode (Expected)
If the routing order changes such that any lower priority branch precedes a higher priority branch, governance fails with a **PRIORITY ORDER VIOLATION**.

## Evidence to Attach
- Screenshot or text capture of the governance output for the target commit.

---

**Control Mapping**: SOC2 CC8.1 / ISO A.12.2 / NIST PR.IP-1
