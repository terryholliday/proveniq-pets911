# EXHIBIT_AI-03 — Negation & Attribution Guards

## Control Objective
Prevent false escalation when suicide-related terms are negated (e.g., “I don’t want to die”) or attributed to someone else.

## Control Statement
The triage system MUST include negation and attribution guards. CI MUST fail if guards are missing.

## Implementation
- **Guards**: `src/lib/ai/counselor-engine.ts` (negation + attribution logic inside suicide triage)
- **Governance Enforcement**: `scripts/canon-governance.js` (guard presence checks)
- **Tests**: `__tests__/counselor-engine.test.ts` includes red-team guard tests

## Evidence Procedure
1. Run `npm run governance`.
2. Verify output includes:
   - `PASS: Suicide negation guard present`
   - `PASS: Suicide attribution guard present`
3. Run `npm test -- --testPathPattern=counselor-engine`.
4. Verify negation/attribution test cases pass.

## Pass Criteria
- Governance confirms guard presence.
- Tests confirm negated language does not escalate.

## Evidence to Attach
- Governance output section for guard checks.
- Test output showing guard tests pass.

---

**Control Mapping**: SOC2 CC8.2 / ISO A.14.3 / NIST PR.IP-1
