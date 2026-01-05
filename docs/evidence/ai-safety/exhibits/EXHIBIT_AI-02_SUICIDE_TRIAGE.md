# EXHIBIT_AI-02 — Suicide Triage Escalation

## Control Objective
Detect suicide intent/ideation and provide immediate escalation resources.

## Control Statement
Suicide triage MUST be present and MUST be evaluated before any other detection logic. High-risk responses MUST include crisis resources.

## Implementation
- **Triage Function**: `src/lib/ai/counselor-engine.ts` (`analyzeSuicideRisk`)
- **Routing**: `generateCompanionResponse` calls triage first
- **Governance Enforcement**: `scripts/canon-governance.js` (suicide triage safety + ordering checks)
- **Tests**: `__tests__/counselor-engine.test.ts` (suicide suites)

## Evidence Procedure
1. Run `npm run governance`.
2. Verify output includes:
   - `CHECKING SUICIDE TRIAGE SAFETY...`
   - `PASS: Suicide triage precedes all other logic`
3. Run `npm test -- --testPathPattern=counselor-engine`.
4. Verify suicide-related test suites pass.

## Pass Criteria
- Governance passes suicide triage checks.
- Tests validate crisis-resource inclusion.

## Evidence to Attach
- CI log excerpt showing suicide triage checks pass.
- Test run summary showing suicide suites pass.

---

**Control Mapping**: SOC2 CC8.2 / ISO A.14.3 / NIST PR.PS-8
