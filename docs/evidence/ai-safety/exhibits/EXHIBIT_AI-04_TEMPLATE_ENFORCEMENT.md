# EXHIBIT_AI-04 — Response Template Enforcement

## Control Objective
Ensure user-facing responses follow pre-approved templates with enforced required and forbidden content.

## Control Statement
All categories MUST have `RESPONSE_TEMPLATES` entries including `mustContain` and `mustNotContain`. CI MUST fail if any category is missing templates or violates template contracts.

## Implementation
- **Templates**: `src/lib/ai/counselor-engine.ts` (`RESPONSE_TEMPLATES`)
- **Governance Enforcement**: `scripts/canon-governance.js` (template completeness + contract checks)
- **Tests**: `__tests__/counselor-engine.test.ts` validates key inclusions/exclusions

## Evidence Procedure
1. Run `npm run governance`.
2. Verify output includes:
   - `CHECKING RESPONSE TEMPLATE CONTRACT...`
   - `PASS: Response template contract satisfied`

## Pass Criteria
- Every category has templates.
- Contracts pass for mustContain/mustNotContain.

## Evidence to Attach
- Governance output for template contract checks.

---

**Control Mapping**: SOC2 CC6.1 / ISO A.8.23 / NIST PR.AC-5
