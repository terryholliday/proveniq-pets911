# PetMayday Academy Training Framework Integration

> **Status:** Core types implemented, ready for content development  
> **Last Updated:** 2026-01-12  
> **Related Research:** Operational Framework for Decentralized Animal Emergency Response v1.0

## Overview

This document maps the research framework to the codebase implementation, providing integration points for Claude's training content development.

---

## Type Definitions Created

| File | Purpose |
|------|---------|
| `src/lib/types/triage.ts` | 3-Tier EMS-aligned triage system |
| `src/lib/types/certification-tracks.ts` | 4 certification tracks + badge system |
| `src/lib/types/training-modules.ts` | Training module registry + simulations |

---

## 1. Triage System Integration

### Type Location
```typescript
import { 
  TriageCode, 
  TriageTier, 
  TriageAssessment,
  calculateTriageCode,
  getActionProtocol,
  TIER_1_INDICATORS,
  TIER_2_INDICATORS,
  TIER_3_INDICATORS
} from '@/lib/types/triage';
```

### Mapping to Dispatch Priority

The existing `DispatchPriority` type (`'low' | 'normal' | 'high' | 'urgent' | 'critical'`) maps to the new triage system:

| Triage Code | Triage Tier | Dispatch Priority | EMS Equivalent |
|-------------|-------------|-------------------|----------------|
| ECHO | 1 | `critical` | Code 3 |
| DELTA | 1 | `urgent` | Code 3 |
| CHARLIE | 2 | `high` | Code 2 |
| BRAVO | 2 | `normal` | Code 2 |
| ALPHA | 3 | `low` | Code 1 |
| OMEGA | 3 | `low` | Code 1 |

### Integration Points

1. **Dispatch Request Creation** (`src/app/api/dispatch/request/route.ts`)
   - Add `triageAssessment` field to request payload
   - Use `calculateTriageCode()` to derive priority

2. **Moderator Queue UI** (to be created)
   - Display clinical indicators from `TIER_1_INDICATORS`, etc.
   - Implement ABC assessment workflow

3. **Push Notification Logic**
   - Tier 1: Immediate push to all local volunteers
   - Tier 2: In-app notification only
   - Tier 3: Standard feed, no push

---

## 2. Certification Tracks Integration

### Type Location
```typescript
import {
  CertificationTrack,
  VolunteerTier,
  VerificationBadge,
  TrapperCertification,
  TransportCertification,
  FosterCertification,
  ModeratorCertification,
  TWO_DOOR_RULE,
  BIOSECURITY_ZONES,
  FADING_KITTEN_PROTOCOL,
  COMPASSION_FATIGUE_PROTOCOLS,
  ANTI_VIGILANTISM_PROTOCOLS,
  VERIFICATION_BADGE_PERMISSIONS,
  SKILL_TREE
} from '@/lib/types/certification-tracks';
```

### Track Definitions

| Track | Target Role | Key Protocols |
|-------|-------------|---------------|
| `MODERATOR` | Digital First Responder | ABC Triage, Anti-Vigilantism, Compassion Fatigue Firewall |
| `FIELD_TRAPPER` | TNR Volunteers | Box/Drop Trap, Wildlife Release, Colony Management |
| `TRANSPORT` | Transport Volunteers | Two-Door Rule, Airlock Procedure, Disease Prevention |
| `FOSTER_CARE` | Foster Parents | Biosecurity Zoning, Fading Kitten Protocol, Bridge Builder Mindset |

### Integration Points

1. **Volunteer Profile** (`src/lib/types/volunteer.ts`)
   - Add `certificationTrack: CertificationTrack`
   - Add `volunteerTier: VolunteerTier`
   - Add `verificationBadge: VerificationBadge`

2. **Dispatch Matching** (`src/modules/operations/logistics/dispatch.ts`)
   - Require `TWO_DOOR_RULE` training for transport assignments
   - Check tier qualifications before dispatch

3. **Post Moderation Queue**
   - Filter posts based on `VerificationBadge` level
   - GREY: Enter queue, no donations
   - BLUE: Live immediately, supplies only
   - GOLD: Live + priority + donations allowed

---

## 3. Training Module Integration

### Type Location
```typescript
import {
  TrainingModule,
  TrainingLesson,
  SimulationScenario,
  MODERATOR_MODULES,
  TRANSPORT_MODULES,
  FOSTER_MODULES,
  TRAPPER_MODULES,
  SIMULATION_SCENARIOS,
  ALL_TRAINING_MODULES,
  getModulesByTrack,
  getModulesByTier,
  getPrerequisiteChain
} from '@/lib/types/training-modules';
```

### Module Registry

**Moderator Track:**
- `TRIAGE_FUNDAMENTALS` - 3-Tier system introduction
- `ABC_PROTOCOL` - Airway/Behavior/Context assessment
- `FRAUD_DETECTION` - Scam identification, Paper Test
- `ANTI_VIGILANTISM` - PII scrubbing, de-escalation
- `COMPASSION_FATIGUE_AWARENESS` - Greyscale default, 2-Hour Hard Stop
- `CRISIS_INTERVENTION` - Incident Commander certification

**Transport Track:**
- `TWO_DOOR_RULE` - Double containment (100% pass required)
- `CRATE_SAFETY` - Securement and temperature
- `DISEASE_PREVENTION` - Parvocidal disinfection

**Foster Track:**
- `BIOSECURITY_101` - Hot/Transition/Cold zones
- `FADING_KITTEN_PROTOCOL` - Sugar & Heat Rule
- `BRIDGE_BUILDER_MINDSET` - Emotional resilience

**Trapper Track:**
- `TNR_BASICS` - Feral vs stray, withholding protocol
- `BOX_TRAP_MASTERY` - Sensitivity, placement, transfer
- `WILDLIFE_PROTOCOL` - Cover-Position-Release

### Integration Points

1. **Training Module Pages** (`src/app/training/`)
   - Use `TrainingModule` type for content structure
   - Track progress with `UserTrainingProfile` (existing type)

2. **Certification Exams**
   - Use `SimulationScenario` for practical assessments
   - Check `passingScore` and `maxAttempts`

3. **Badge Awards**
   - Award badges based on module completion
   - Use `SKILL_TREE` for progression visualization

---

## 4. Protocol Reference Cards

The following protocols are defined as constants and should be displayed in the app:

### Two-Door Rule
```typescript
import { TWO_DOOR_RULE } from '@/lib/types/certification-tracks';

// Display: TWO_DOOR_RULE.principle
// Display: TWO_DOOR_RULE.barriers
// Display: TWO_DOOR_RULE.protocol
// Display: TWO_DOOR_RULE.leashRequirements
```

### Biosecurity Zones
```typescript
import { BIOSECURITY_ZONES } from '@/lib/types/certification-tracks';

// Display: BIOSECURITY_ZONES.HOT_ZONE
// Display: BIOSECURITY_ZONES.TRANSITION_ZONE
// Display: BIOSECURITY_ZONES.COLD_ZONE
// Display: BIOSECURITY_ZONES.protocol (step-by-step)
```

### Fading Kitten Protocol
```typescript
import { FADING_KITTEN_PROTOCOL } from '@/lib/types/certification-tracks';

// Display: FADING_KITTEN_PROTOCOL.crashIndicators
// Display: FADING_KITTEN_PROTOCOL.criticalRule
// Display: FADING_KITTEN_PROTOCOL.protocol (Heat → Sugar → Food)
```

### Compassion Fatigue Firewall
```typescript
import { COMPASSION_FATIGUE_PROTOCOLS } from '@/lib/types/certification-tracks';

// Implement: greyscaleDefault for Tier 1 imagery
// Implement: twoHourHardStop for moderator sessions
// Implement: mandatoryDebrief tracking
```

---

## 5. UI Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `TriageAssessmentForm` | ABC protocol input for moderators | HIGH |
| `ClinicalIndicatorChecklist` | Tier-specific indicator selection | HIGH |
| `VerificationBadgeDisplay` | Grey/Blue/Gold badge UI | MEDIUM |
| `ProtocolReferenceCard` | Collapsible protocol display | MEDIUM |
| `SkillTreeVisualization` | Certification progress tree | LOW |
| `SimulationRunner` | Interactive scenario assessments | LOW |

---

## 6. Content Development Notes for Claude

When developing training content, reference these type definitions:

1. **Lesson content** should follow `TrainingLesson.type`:
   - `VIDEO` - Recorded demonstrations
   - `TEXT` - Written guides
   - `INTERACTIVE` - Click-through exercises
   - `SIMULATION` - Decision-point scenarios
   - `QUIZ` - Knowledge checks

2. **Simulation scenarios** should include:
   - Clear `setup` (the situation)
   - Explicit `failResponse` (what NOT to do)
   - Correct `passResponse` (proper protocol)
   - `learningObjective` (key takeaway)

3. **Clinical indicators** should be:
   - Observable from photos/videos (remote assessment)
   - Unambiguous (clear yes/no criteria)
   - Aligned with EMS terminology where applicable

4. **Protocol steps** should be:
   - Numbered sequentially
   - Actionable (verbs, not descriptions)
   - Safety-critical steps in CAPS or bold

---

## 7. Database Schema Additions (Future)

```sql
-- Triage assessment for dispatch requests
ALTER TABLE dispatch_requests ADD COLUMN triage_code TEXT;
ALTER TABLE dispatch_requests ADD COLUMN triage_tier INTEGER;
ALTER TABLE dispatch_requests ADD COLUMN triage_assessment JSONB;

-- Volunteer certification tracking
ALTER TABLE volunteers ADD COLUMN certification_track TEXT;
ALTER TABLE volunteers ADD COLUMN volunteer_tier TEXT DEFAULT 'NOVICE';
ALTER TABLE volunteers ADD COLUMN verification_badge TEXT DEFAULT 'GREY';

-- Moderator session tracking (2-Hour Hard Stop)
CREATE TABLE moderator_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  forced_break BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER
);
```

---

## Summary

The research framework has been translated into TypeScript type definitions that:

1. **Align dispatch priority with EMS triage codes** (ECHO → OMEGA)
2. **Define 4 certification tracks** with clear progression (NOVICE → EXPERT)
3. **Encode safety protocols as code constants** (Two-Door Rule, Biosecurity, etc.)
4. **Structure training modules** with lessons, assessments, and simulations
5. **Enable gamification** through skill tree and badge system

Claude's training content should populate the `lessons` arrays in each `TrainingModule` and expand the `SIMULATION_SCENARIOS` collection.
