# Mayday Alert Testing & Compliance (E2E Determinism)

## Commands

```bash
npm test -- --testPathPattern=Mayday-alert-compliance
npm run test:Mayday-alert-compliance
```

## Evidence Produced

- `Mayday.alert.policy_evaluated`
- `Mayday.alert.emitted`
- `Mayday.alert.suppressed`

## Determinism Controls

- Evaluation is driven by `FakeClock` seeded from fixture timestamps.
- During evaluation the test forbids:

```ts
Date.now()
Math.random()
```

## Canonicalization

- Canonical JSON serialization is used for deterministic hashing.
- Decision IDs and idempotency keys are SHA-256 of canonical JSON inputs.

## Fail-Closed Rules

- Missing or ambiguous inputs MUST not emit alerts.
- Ambiguity is represented as `reason_code: "policy_ambiguity"`.

## Differential Evaluation

The suite runs evaluation twice:

- ProjectionBuilder (incremental production path)
- Pure replay (reference path)

The canonical JSON of the decisions must match exactly.

## Mutation Testing (Optional Hook)

A `stryker.conf.json` exists as an opt-in template. To enable mutation testing locally:

```bash
npm i -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
npx stryker run
```
