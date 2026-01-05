# AI Safety Canon

## Purpose
This document defines the canonical safety requirements and governance enforcement for the Pet Crisis Support Companion AI system.

## Scope
- Applies universally to all AI-generated responses in the system
- Specific missing-pet intelligence rules apply only to that subsystem
- Enforced via automated CI checks in `scripts/canon-governance.js`

## Core Principles

### 1. No Certainty / No Medical Advice
- AI must never claim certainty about outcomes
- Must not provide medical diagnosis or treatment advice
- Use uncertainty language and actionable steps instead

### 2. No False Hope
- Avoid promising specific recovery outcomes
- Focus on present-moment support and resources
- Do not suggest pets will "definitely" be found

### 3. Fail-Closed Filters
- When in doubt, route to safer response
- Prioritize suicide risk triage above all other logic
- Include escalation resources for high-risk situations

### 4. Privacy by Design
- Never request precise location from users indicating DV risk
- Include privacy guidance in DV coercive control responses
- Do not store or share identifying details without consent

## Canonical Priority Order

The following routing order MUST be preserved in `generateCompanionResponse`:

1. `suicide_intent` - Immediate suicide intent
2. `suicide_active` - Active suicidal ideation with plan
3. `suicide_passive` - Passive suicidal thoughts
4. `dv_coercive_control` - Domestic violence coercive control
5. `mdd` - Major depressive disorder vs grief
6. `paralysis` - Grief paralysis/opposite action
7. `neurodivergent` - Neurodivergent-aware responses
8. `death_traumatic` - Traumatic death
9. `death_euthanasia` - Euthanasia decision support
10. `death_general` - General death/grief
11. `death_found_deceased` - Found deceased pet
12. `anticipatory` - Anticipatory grief
13. `emergency` - Emergency veterinary care
14. `scam` - Scam detection
15. `found_pet` - Found pet scenarios
16. `lost_pet` - Lost pet/ambiguous loss
17. `guilt_cbt` - Guilt with CBT framework
18. `disenfranchised` - Disenfranchised grief
19. `pediatric` - Pediatric grief
20. `quality_of_life` - Quality of life/euthanasia
21. `general` - Fallback support

## Response Template Requirements

All categories MUST have:
- `response` field with user-facing text
- `mustContain` array with required elements
- `mustNotContain` array with forbidden phrases

### Forbidden Phrases
- "just a" (minimizing)
- "get another pet" (replacement suggestion)
- Success rate statistics or percentages
- Medical advice or diagnosis
- Certainty claims about outcomes

### Required Elements for High-Risk Categories
- Suicide categories: 988, appropriate crisis resources
- DV coercive control: National DV Hotline, privacy guidance
- MDD: Depression resources, distinction from grief

## Test Coverage Requirements

Each category (except `general`) MUST have:
- Minimum 2 test cases
- Tests verifying category routing
- Tests verifying required response elements
- Tests verifying forbidden phrase absence

## Enforcement Mechanisms

### CI Governance Script
`scripts/canon-governance.js` enforces:
- Priority order compliance
- Suicide triage safety (negation/attribution guards)
- Response template contract completeness
- Test coverage minimums
- Type safety (no `any` types)
- Absence of success-rate statistics
- Diff sanity (no untracked changes)

### Pre-commit Hook
`.husky/pre-commit` runs:
- `npm run governance` - All canonical checks
- `npm test -- --testPathPattern=counselor-engine` - Engine tests

### GitHub Actions
`.github/workflows/canon-governance.yml` runs:
- Governance checks on push/PR
- Counselor engine tests
- Type checking

## Version Control

This document is version-controlled and changes require:
- Update to corresponding governance checks
- Test coverage for any new categories
- Documentation updates in `docs/GOVERNANCE.md`

## Compliance References

- SOC 2 Type II controls mapped in `CONTROL_MAPPING_AI.md`
- ISO 27001/NIST control mappings in `ISO_NIST_MAPPING_AI.md`
- Executive summary for regulators in `EXEC_SUMMARY_REGULATOR.md`

---

**Document Status**: Active  
**Last Updated**: 2025-01-05  
**Enforcement**: Automated via CI/CD
