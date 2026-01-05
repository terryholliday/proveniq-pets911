# Canonical Governance Enforcement

## Overview

The Pet Crisis Companion engine is protected by **automated governance checks** that enforce canonical behavioral law. These checks **FAIL LOUDLY** with human-readable error messages when violations are detected.

## Governance Rules

### 1. Priority Order Enforcement
The routing order in `generateCompanionResponse` must match the canonical specification:

```
1. Suicide Risk Triage
2. MDD
3. Grief Paralysis
4. Neurodivergent Attachment
5. Death – Traumatic
6. Death – Euthanasia
7. Death – General
8. Death – Found Deceased
9. Anticipatory Grief
10. Emergency
11. Scam Detection
12. Found Pet
13. Lost Pet
14. Guilt (CBT)
15. Disenfranchised Grief
16. Pediatric Grief
17. Quality of Life
18. General Support
```

### 2. Suicide Triage Safety
- **Negation Guard:** Must detect patterns like "I don't want to die"
- **Attribution Guard:** Must ignore quoted speech and someone else's statements
- **Intent Override:** Explicit intent must always win
- **First Priority:** Suicide triage must precede all other logic

### 3. Response Template Contract
- Every routing category must have a `RESPONSE_TEMPLATES` entry
- No unused template categories allowed
- No inline response strings (must use templates)

### 4. Test Coverage Guarantee
- Each category needs ≥2 tests
- Suicide guard tests (negation + attribution) required
- Priority collision tests required

### 5. Type Safety
- No `any` types allowed
- No implicit `unknown` without narrowing

### 6. Diff Sanity
- No `console.log` outside tests
- No `TODO` comments in engine

## Running Governance Checks

### Local Development
```bash
# Run governance checks only
npm run governance

# Run full pre-commit check
npm run pre-commit
```

### CI/CD
Governance checks run automatically on:
- Push to `main`/`develop` branches
- Pull requests to `main`
- When engine or test files are modified

## Example Failure Messages

### Priority Order Violation
```
❌ FAIL: PRIORITY ORDER VIOLATION

📊 EXPECTED ORDER:
  1. suicide_intent
  2. suicide_active
  3. suicide_passive
  4. mdd
  ...

📊 ACTUAL ORDER:
  1. suicide_intent
  2. mdd ❌
  3. suicide_active ❌
  ...

🔧 FIX: Reorder if/else blocks to match canonical priority
```

### Missing Suicide Guard
```
❌ FAIL: SUICIDE NEGATION GUARD MISSING
🔧 FIX: Add negation regex pattern to analyzeSuicideRisk function
   Pattern: /\b(don't|do not|never|won't|doesn't|didn't)\s+(\w+\s+){0,3}(want to die|kill myself|end it|hurt myself)/i
```

### Type Safety Violation
```
❌ FAIL: TYPE SAFETY VIOLATION: Found 'any' types
🔧 FIX: Replace all 'any' with specific interfaces
   Locations: 3
```

## Fixing Violations

### Step 1: Identify the Issue
Run `npm run governance` to see detailed failure messages.

### Step 2: Apply the Fix
Follow the specific instructions provided in the error message.

### Step 3: Verify the Fix
```bash
npm run governance
npm test -- --testPathPattern=counselor-engine
```

### Step 4: Commit
Only commit after all governance checks pass.

## Enforcement Philosophy

- **Fail Loudly:** No warnings-only mode
- **No Best-Effort:** Rules must be mechanically enforceable
- **Human-Readable:** Error messages explain exactly what's wrong and how to fix it
- **Zero Tolerance:** Build fails on any violation

## Allowed Files

The governance system only monitors:
- `src/lib/ai/counselor-engine.ts` (canonical engine)
- `__tests__/counselor-engine.test.ts` (canonical tests)

Modifications to other files do not trigger governance checks.

## Emergency Overrides

In extreme cases (e.g., critical security fixes), the governance check can be bypassed with:

```bash
git commit --no-verify -m "fix: critical security issue [GOVERNANCE OVERRIDE]"
```

This requires explicit team approval and must be reviewed in post-mortem.
