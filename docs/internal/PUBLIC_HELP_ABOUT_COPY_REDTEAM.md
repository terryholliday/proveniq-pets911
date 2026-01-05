# Public Help/About Copy — Legal & Liability Red Team Review (Internal Only)

## Purpose
This document explains why the public-facing **About** and **Help & Safety** copy is written the way it is, what it intentionally avoids, and the risk posture it creates.

## Public Pages Covered
- `src/app/about/page.tsx`
- `src/app/help/safety/page.tsx`

## What the Public Copy Does Correctly
### Avoids medical & mental health claims
- No diagnosis language
- No “treatment,” “therapy,” or “clinical” promises
- Clear scope boundaries without claiming professional authority

### Avoids over-promising
- No “always accurate” / “guarantees” claims
- No completeness or correctness assertions

### Establishes reasonable duty of care
- Encourages emergency services when safety is at risk
- Encourages professionals for urgent or clinical situations
- Frames the system as support, not authority

### Uses human-centered language
- Prioritizes dignity, clarity, and compassion
- Avoids mechanistic wording that invites adversarial interpretation

## What Is Deliberately Not Included (and why)
- Priority orders: avoids “why didn’t it do X first?” attack vectors
- Detection markers / trigger logic: reduces gaming and discovery risk
- Test coverage claims: avoids evidentiary overreach
- Internal governance language: not useful to users; increases litigation surface
- Named clinical frameworks: avoids implied clinical authority

## Publication Rules
- Do not link public pages to governance docs.
- Do not publish or reference internal controls, checklists, or evidence exhibits.

## Recommended Review Cadence
- Re-review public copy after any major changes to crisis escalation behavior.
- Re-review public copy before app store submissions or enterprise partner reviews.
