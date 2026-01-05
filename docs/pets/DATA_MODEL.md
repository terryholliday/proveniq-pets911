# PROVENIQ PETS (WV) — DATA MODEL

**Version:** 1.0.0  
**Status:** ACTIVE  
**Authoritative Reference:** CANONICAL_LAW.md  
**Database:** Supabase (Postgres)

---

## 0. SCHEMA OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  county_pack          │  emergency_contact      │  aco_availability_override │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CASE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  missing_pet_case     │  found_animal_case      │  sighting                  │
│                       │                         │                            │
│  ◄─── match_suggestion ───►                     │                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ACTION LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  moderator_action     │  emergency_vet_notify   │  municipal_interaction_log │
│                       │   _attempt              │                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TELEMETRY LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  pilot_metrics_log    │  offline_queued_action                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. ENUMERATIONS

### 1.1 County Enum

```sql
CREATE TYPE county_enum AS ENUM (
  'GREENBRIER',
  'KANAWHA'
);
```

### 1.2 Pet/Animal Species

```sql
CREATE TYPE species_enum AS ENUM (
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'REPTILE',
  'SMALL_MAMMAL',  -- hamster, guinea pig, ferret, etc.
  'LIVESTOCK',     -- horse, goat, pig, etc.
  'OTHER'
);
```

### 1.3 Case Status

```sql
CREATE TYPE case_status_enum AS ENUM (
  'ACTIVE',           -- Case is open, actively being worked
  'PENDING_VERIFY',   -- Awaiting moderator verification
  'MATCHED',          -- Match confirmed, awaiting reunion
  'CLOSED_REUNITED',  -- Pet returned to owner
  'CLOSED_ADOPTED',   -- Found animal adopted (no owner found)
  'CLOSED_DECEASED',  -- Animal confirmed deceased
  'CLOSED_EXPIRED',   -- Case aged out per retention policy
  'CLOSED_DUPLICATE', -- Merged into another case
  'LOCKED'            -- Moderator-locked (abuse, legal, etc.)
);
```

### 1.4 Emergency Contact Type

```sql
CREATE TYPE contact_type_enum AS ENUM (
  'ER_VET',           -- Emergency veterinary clinic
  'SHELTER',          -- Animal shelter
  'ANIMAL_CONTROL',   -- Municipal animal control
  'DISPATCH',         -- 911 or non-emergency dispatch
  'RESCUE_ORG',       -- Private rescue organization
  'OTHER'
);
```

### 1.5 Notification Status

```sql
CREATE TYPE notification_status_enum AS ENUM (
  'QUEUED',      -- In queue, not yet attempted
  'ATTEMPTED',   -- Attempt made, awaiting provider response
  'SENT',        -- Provider accepted, delivery pending
  'DELIVERED',   -- Confirmed delivered
  'FAILED',      -- Permanent failure
  'EXPIRED'      -- TTL exceeded, no longer relevant
);
```

### 1.6 Moderator Action Type

```sql
CREATE TYPE mod_action_type_enum AS ENUM (
  'LOCK_CASE',
  'UNLOCK_CASE',
  'ESCALATE_TO_SHELTER',
  'CONFIRM_MATCH',
  'REJECT_MATCH',
  'RELEASE_CONTACT',
  'MERGE_CASES',
  'ADD_NOTE',
  'FLAG_ABUSE',
  'CLOSE_CASE'
);
```

### 1.7 Municipal Call Outcome

```sql
CREATE TYPE municipal_outcome_enum AS ENUM (
  'OFFICER_DISPATCHED',
  'CALLBACK_PROMISED',
  'NO_ANSWER',
  'REFERRED_ELSEWHERE',
  'DECLINED',
  'UNKNOWN'
);
```

### 1.8 User Role

```sql
CREATE TYPE user_role_enum AS ENUM (
  'PUBLIC_USER',
  'OWNER',
  'FINDER',
  'PIGPIG_MODERATOR',
  'SHELTER_MODERATOR',
  'SYSTEM_ADMIN'
);
```

### 1.9 Pilot Metrics Action

```sql
CREATE TYPE metrics_action_enum AS ENUM (
  'CASE_CREATED_MISSING',
  'CASE_CREATED_FOUND',
  'SIGHTING_REPORTED',
  'ER_VET_NOTIFY_SENT',
  'MUNICIPAL_CALL_LOGGED',
  'MATCH_CONFIRMED',
  'MATCH_REJECTED',
  'CASE_CLOSED'
);
```

### 1.10 Sync Status

```sql
CREATE TYPE sync_status_enum AS ENUM (
  'PENDING',
  'SYNCING',
  'SYNCED',
  'FAILED',
  'CONFLICT'
);
```

---

## 2. INFRASTRUCTURE TABLES

### 2.1 county_pack

Offline-cacheable data bundle per county.

```sql
CREATE TABLE county_pack (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county          county_enum NOT NULL UNIQUE,
  
  -- Metadata
  display_name    TEXT NOT NULL,              -- "Greenbrier County"
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  
  -- Pack versioning
  version         INTEGER NOT NULL DEFAULT 1,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Offline bundle metadata
  bundle_url      TEXT,                       -- CDN URL for offline bundle
  bundle_checksum TEXT,                       -- SHA256 of bundle
  bundle_size_kb  INTEGER,
  
  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_county_pack_county ON county_pack(county);
```

### 2.2 emergency_contact

Veterinary clinics, shelters, animal control, dispatch numbers.

```sql
CREATE TABLE emergency_contact (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_pack_id  UUID NOT NULL REFERENCES county_pack(id),
  
  -- Contact info
  contact_type    contact_type_enum NOT NULL,
  name            TEXT NOT NULL,              -- "Greenbrier Valley Animal Hospital"
  phone_primary   TEXT,                       -- Landline for voice TTS
  phone_secondary TEXT,
  email           TEXT,
  address         TEXT,
  
  -- Operating hours
  is_24_hour      BOOLEAN NOT NULL DEFAULT FALSE,
  hours_json      JSONB,                      -- {"mon": "8:00-17:00", ...}
  
  -- Emergency capabilities
  accepts_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_wildlife  BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_livestock BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Opt-in contact (for municipal agencies)
  opted_in_email_notify BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_contact_county ON emergency_contact(county_pack_id);
CREATE INDEX idx_emergency_contact_type ON emergency_contact(contact_type);
CREATE INDEX idx_emergency_contact_active ON emergency_contact(is_active) WHERE is_active = TRUE;
```

### 2.3 aco_availability_override

Temporary overrides for animal control officer availability.

```sql
CREATE TABLE aco_availability_override (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_pack_id  UUID NOT NULL REFERENCES county_pack(id),
  
  -- Override details
  override_type   TEXT NOT NULL,              -- 'UNAVAILABLE', 'REDUCED_HOURS', 'ALTERNATE_CONTACT'
  reason          TEXT,                       -- "Holiday schedule"
  alternate_phone TEXT,
  alternate_name  TEXT,
  
  -- Validity period
  effective_from  TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ NOT NULL,
  
  -- Audit
  created_by      UUID,                       -- Firebase UID
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aco_override_county ON aco_availability_override(county_pack_id);
CREATE INDEX idx_aco_override_active ON aco_availability_override(effective_from, effective_until);
```

---

## 3. USER TABLE

### 3.1 user_profile

Firebase Auth is source of truth for authentication. This table stores additional profile data.

```sql
CREATE TABLE user_profile (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid        TEXT NOT NULL UNIQUE,     -- Firebase Auth UID
  
  -- Profile
  display_name        TEXT,
  email               TEXT,                     -- Cached from Firebase
  phone               TEXT,
  
  -- Role (highest role assigned)
  role                user_role_enum NOT NULL DEFAULT 'PUBLIC_USER',
  
  -- Contact preferences
  sms_opt_in          BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Location context
  primary_county      county_enum,
  
  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_user_firebase ON user_profile(firebase_uid);
CREATE INDEX idx_user_role ON user_profile(role);
CREATE INDEX idx_user_county ON user_profile(primary_county);
```

---

## 4. CASE TABLES

### 4.1 missing_pet_case

Reported missing pets.

```sql
CREATE TABLE missing_pet_case (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner reference
  owner_id          UUID NOT NULL REFERENCES user_profile(id),
  
  -- Pet details
  pet_name          TEXT NOT NULL,
  species           species_enum NOT NULL,
  breed             TEXT,
  color_primary     TEXT,
  color_secondary   TEXT,
  distinguishing_features TEXT,
  weight_lbs        DECIMAL(5,1),
  age_years         DECIMAL(3,1),
  sex               TEXT,                     -- 'male', 'female', 'unknown'
  is_neutered       BOOLEAN,
  microchip_id      TEXT,
  
  -- Photos (URLs to storage)
  photo_urls        TEXT[],
  
  -- Last seen
  last_seen_at      TIMESTAMPTZ NOT NULL,
  last_seen_lat     DECIMAL(9,6),
  last_seen_lng     DECIMAL(9,6),
  last_seen_address TEXT,
  last_seen_notes   TEXT,
  
  -- Case metadata
  county            county_enum NOT NULL,
  status            case_status_enum NOT NULL DEFAULT 'ACTIVE',
  
  -- Moderator assignment
  assigned_moderator_id UUID REFERENCES user_profile(id),
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  
  -- Soft delete
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_missing_case_owner ON missing_pet_case(owner_id);
CREATE INDEX idx_missing_case_county ON missing_pet_case(county);
CREATE INDEX idx_missing_case_status ON missing_pet_case(status);
CREATE INDEX idx_missing_case_species ON missing_pet_case(species);
CREATE INDEX idx_missing_case_active ON missing_pet_case(status, county) 
  WHERE status = 'ACTIVE';
CREATE INDEX idx_missing_case_location ON missing_pet_case(last_seen_lat, last_seen_lng) 
  WHERE last_seen_lat IS NOT NULL;
```

### 4.2 found_animal_case

Reported found animals.

```sql
CREATE TABLE found_animal_case (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Finder reference
  finder_id         UUID NOT NULL REFERENCES user_profile(id),
  
  -- Animal details (may be estimated)
  species           species_enum NOT NULL,
  breed_guess       TEXT,
  color_primary     TEXT,
  color_secondary   TEXT,
  distinguishing_features TEXT,
  weight_lbs_estimate DECIMAL(5,1),
  age_estimate      TEXT,                     -- 'puppy', 'adult', 'senior'
  sex               TEXT,
  has_collar        BOOLEAN,
  collar_description TEXT,
  microchip_scanned BOOLEAN NOT NULL DEFAULT FALSE,
  microchip_id      TEXT,
  
  -- Condition
  condition_notes   TEXT,                     -- "Appears healthy", "Injured leg"
  needs_immediate_vet BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Photos
  photo_urls        TEXT[],
  
  -- Found location
  found_at          TIMESTAMPTZ NOT NULL,
  found_lat         DECIMAL(9,6),
  found_lng         DECIMAL(9,6),
  found_address     TEXT,
  found_notes       TEXT,
  
  -- Current location (may differ from found location)
  current_location_type TEXT,                 -- 'WITH_FINDER', 'SHELTER', 'VET', 'OTHER'
  current_location_id UUID REFERENCES emergency_contact(id),
  current_location_notes TEXT,
  
  -- Case metadata
  county            county_enum NOT NULL,
  status            case_status_enum NOT NULL DEFAULT 'ACTIVE',
  
  -- Shelter handoff tracking
  shelter_intake_id TEXT,
  shelter_intake_at TIMESTAMPTZ,
  
  -- Moderator assignment
  assigned_moderator_id UUID REFERENCES user_profile(id),
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  
  -- Soft delete
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_found_case_finder ON found_animal_case(finder_id);
CREATE INDEX idx_found_case_county ON found_animal_case(county);
CREATE INDEX idx_found_case_status ON found_animal_case(status);
CREATE INDEX idx_found_case_species ON found_animal_case(species);
CREATE INDEX idx_found_case_active ON found_animal_case(status, county) 
  WHERE status = 'ACTIVE';
CREATE INDEX idx_found_case_location ON found_animal_case(found_lat, found_lng) 
  WHERE found_lat IS NOT NULL;
CREATE INDEX idx_found_case_needs_vet ON found_animal_case(needs_immediate_vet) 
  WHERE needs_immediate_vet = TRUE;
```

### 4.3 sighting

Public sighting reports for missing pets.

```sql
CREATE TABLE sighting (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reporter
  reporter_id       UUID REFERENCES user_profile(id),  -- Nullable for anonymous
  reporter_name     TEXT,                              -- For non-users
  reporter_phone    TEXT,
  
  -- Linked case (optional - may be unlinked sighting)
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  
  -- Sighting details
  sighting_at       TIMESTAMPTZ NOT NULL,
  sighting_lat      DECIMAL(9,6),
  sighting_lng      DECIMAL(9,6),
  sighting_address  TEXT,
  
  -- Description
  description       TEXT,
  direction_heading TEXT,                     -- 'north', 'towards highway', etc.
  animal_behavior   TEXT,                     -- 'friendly', 'scared', 'injured'
  
  -- Confidence
  confidence_level  TEXT NOT NULL DEFAULT 'UNSURE',  -- 'CERTAIN', 'LIKELY', 'UNSURE'
  
  -- Photo
  photo_url         TEXT,
  
  -- Metadata
  county            county_enum NOT NULL,
  
  -- Verification
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by       UUID REFERENCES user_profile(id),
  verified_at       TIMESTAMPTZ,
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_sighting_case ON sighting(missing_case_id);
CREATE INDEX idx_sighting_county ON sighting(county);
CREATE INDEX idx_sighting_time ON sighting(sighting_at DESC);
CREATE INDEX idx_sighting_location ON sighting(sighting_lat, sighting_lng) 
  WHERE sighting_lat IS NOT NULL;
CREATE INDEX idx_sighting_unlinked ON sighting(county, created_at) 
  WHERE missing_case_id IS NULL;
```

### 4.4 match_suggestion

AI-suggested matches between found animals and missing pets.

```sql
CREATE TABLE match_suggestion (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case references
  missing_case_id     UUID NOT NULL REFERENCES missing_pet_case(id),
  found_case_id       UUID NOT NULL REFERENCES found_animal_case(id),
  
  -- Match scoring
  confidence_score    DECIMAL(4,3) NOT NULL,    -- 0.000 to 1.000
  scoring_factors     JSONB,                    -- Breakdown of match factors
  
  -- Status
  status              TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING', 'CONFIRMED', 'REJECTED'
  
  -- Resolution (if confirmed or rejected)
  resolved_by         UUID REFERENCES user_profile(id),
  resolved_at         TIMESTAMPTZ,
  resolution_notes    TEXT,
  
  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate suggestions
  UNIQUE(missing_case_id, found_case_id)
);

CREATE INDEX idx_match_missing ON match_suggestion(missing_case_id);
CREATE INDEX idx_match_found ON match_suggestion(found_case_id);
CREATE INDEX idx_match_pending ON match_suggestion(status) 
  WHERE status = 'PENDING';
CREATE INDEX idx_match_confidence ON match_suggestion(confidence_score DESC) 
  WHERE status = 'PENDING';
```

---

## 5. ACTION TABLES

### 5.1 moderator_action

Audit log of all moderator actions.

```sql
CREATE TABLE moderator_action (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  moderator_id    UUID NOT NULL REFERENCES user_profile(id),
  
  -- Target (at least one required)
  missing_case_id UUID REFERENCES missing_pet_case(id),
  found_case_id   UUID REFERENCES found_animal_case(id),
  match_id        UUID REFERENCES match_suggestion(id),
  target_user_id  UUID REFERENCES user_profile(id),
  
  -- Action details
  action_type     mod_action_type_enum NOT NULL,
  action_data     JSONB,                      -- Additional action-specific data
  notes           TEXT,
  
  -- Consent tracking (for RELEASE_CONTACT)
  consent_method  TEXT,                       -- 'OWNER_OPT_IN', 'EMERGENCY_OVERRIDE'
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: at least one target
  CONSTRAINT chk_mod_action_target CHECK (
    missing_case_id IS NOT NULL OR 
    found_case_id IS NOT NULL OR 
    match_id IS NOT NULL OR 
    target_user_id IS NOT NULL
  )
);

CREATE INDEX idx_mod_action_moderator ON moderator_action(moderator_id);
CREATE INDEX idx_mod_action_missing ON moderator_action(missing_case_id);
CREATE INDEX idx_mod_action_found ON moderator_action(found_case_id);
CREATE INDEX idx_mod_action_type ON moderator_action(action_type);
CREATE INDEX idx_mod_action_time ON moderator_action(created_at DESC);
```

### 5.2 emergency_vet_notify_attempt

Log of emergency veterinary clinic notification attempts.

```sql
CREATE TABLE emergency_vet_notify_attempt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case context (optional - may be general emergency)
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  found_case_id     UUID REFERENCES found_animal_case(id),
  
  -- Initiator
  initiated_by      UUID NOT NULL REFERENCES user_profile(id),
  
  -- Target contact
  contact_id        UUID NOT NULL REFERENCES emergency_contact(id),
  
  -- Email attempt
  email_status      notification_status_enum,
  email_provider_id TEXT,                     -- Resend message ID
  email_sent_at     TIMESTAMPTZ,
  email_error       TEXT,
  
  -- Voice (TTS) attempt
  voice_status      notification_status_enum,
  voice_provider_id TEXT,                     -- Twilio call SID
  voice_initiated_at TIMESTAMPTZ,
  voice_duration_sec INTEGER,
  voice_answered    BOOLEAN,
  voice_error       TEXT,
  
  -- Message content (for audit)
  message_summary   TEXT,                     -- Brief description of emergency
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_er_notify_missing ON emergency_vet_notify_attempt(missing_case_id);
CREATE INDEX idx_er_notify_found ON emergency_vet_notify_attempt(found_case_id);
CREATE INDEX idx_er_notify_contact ON emergency_vet_notify_attempt(contact_id);
CREATE INDEX idx_er_notify_time ON emergency_vet_notify_attempt(created_at DESC);
```

### 5.3 municipal_interaction_log

Log of municipal agency interactions (calls, emails).

```sql
CREATE TABLE municipal_interaction_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case context
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  found_case_id     UUID REFERENCES found_animal_case(id),
  
  -- Initiator
  initiated_by      UUID NOT NULL REFERENCES user_profile(id),
  
  -- Target contact
  contact_id        UUID REFERENCES emergency_contact(id),
  contact_name      TEXT NOT NULL,            -- Cached for audit
  contact_phone     TEXT NOT NULL,            -- Cached for audit
  
  -- Dialer interaction
  dialer_initiated_at TIMESTAMPTZ NOT NULL,
  call_duration_sec   INTEGER,                -- If available from device
  
  -- User-reported outcome
  outcome           municipal_outcome_enum NOT NULL,
  outcome_notes     TEXT,
  outcome_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Agency opt-in email (if applicable)
  email_notify_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_provider_id TEXT,
  email_status      notification_status_enum,
  
  -- Script used
  script_version    TEXT,                     -- Version of on-screen script
  
  -- County
  county            county_enum NOT NULL,
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_municipal_case ON municipal_interaction_log(missing_case_id);
CREATE INDEX idx_municipal_county ON municipal_interaction_log(county);
CREATE INDEX idx_municipal_outcome ON municipal_interaction_log(outcome);
CREATE INDEX idx_municipal_time ON municipal_interaction_log(created_at DESC);
```

---

## 6. TELEMETRY TABLES

### 6.1 pilot_metrics_log

**DAY 1 MANDATORY** — Append-only telemetry for pilot efficacy tracking.

```sql
CREATE TABLE pilot_metrics_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  action_taken    metrics_action_enum NOT NULL,
  
  -- Context references (nullable based on action type)
  case_id         UUID,                       -- Missing or Found case ID
  case_type       TEXT,                       -- 'missing' or 'found'
  contact_id      UUID,
  match_id        UUID,
  
  -- Location
  county          county_enum NOT NULL,
  
  -- Outcome (for closed events)
  outcome         TEXT,                       -- 'REUNITED', 'ADOPTED', etc.
  
  -- Additional metadata
  metadata        JSONB,                      -- Action-specific data
  
  -- User context (anonymized)
  actor_role      user_role_enum,
  
  -- Timestamps
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: No UPDATE or DELETE triggers allowed
-- RLS policy: INSERT only, no SELECT for non-admins

CREATE INDEX idx_metrics_action ON pilot_metrics_log(action_taken);
CREATE INDEX idx_metrics_county ON pilot_metrics_log(county);
CREATE INDEX idx_metrics_time ON pilot_metrics_log(timestamp DESC);
CREATE INDEX idx_metrics_case ON pilot_metrics_log(case_id);
CREATE INDEX idx_metrics_outcome ON pilot_metrics_log(outcome) 
  WHERE outcome IS NOT NULL;
```

### 6.2 offline_queued_action

Client-side queue for offline operations.

```sql
CREATE TABLE offline_queued_action (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Idempotency
  idempotency_key     UUID NOT NULL UNIQUE,
  
  -- Action details
  action_type         TEXT NOT NULL,          -- 'CREATE_CASE', 'REPORT_SIGHTING', etc.
  payload             JSONB NOT NULL,         -- Full request payload
  
  -- User context
  user_id             UUID NOT NULL REFERENCES user_profile(id),
  
  -- Device context
  device_id           TEXT,
  
  -- Sync state
  sync_status         sync_status_enum NOT NULL DEFAULT 'PENDING',
  sync_attempts       INTEGER NOT NULL DEFAULT 0,
  last_sync_attempt   TIMESTAMPTZ,
  sync_error          TEXT,
  
  -- Resolved reference (after successful sync)
  resolved_entity_id  UUID,
  resolved_at         TIMESTAMPTZ,
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE UNIQUE INDEX idx_offline_idempotency ON offline_queued_action(idempotency_key);
CREATE INDEX idx_offline_user ON offline_queued_action(user_id);
CREATE INDEX idx_offline_pending ON offline_queued_action(sync_status) 
  WHERE sync_status = 'PENDING';
CREATE INDEX idx_offline_expires ON offline_queued_action(expires_at);
```

---

## 7. EVENT TAXONOMY

All significant state changes spawn events. This taxonomy defines the canonical event types.

### 7.1 Case Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `CASE.MISSING.CREATED` | New MissingPetCase | { case_id, owner_id, county, species } |
| `CASE.MISSING.UPDATED` | Case details changed | { case_id, changed_fields[] } |
| `CASE.MISSING.STATUS_CHANGED` | Status transition | { case_id, from_status, to_status, reason } |
| `CASE.FOUND.CREATED` | New FoundAnimalCase | { case_id, finder_id, county, species } |
| `CASE.FOUND.UPDATED` | Case details changed | { case_id, changed_fields[] } |
| `CASE.FOUND.STATUS_CHANGED` | Status transition | { case_id, from_status, to_status, reason } |
| `CASE.CLOSED` | Any case closed | { case_id, case_type, resolution } |

### 7.2 Sighting Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `SIGHTING.CREATED` | New sighting reported | { sighting_id, case_id?, county, confidence } |
| `SIGHTING.LINKED` | Sighting linked to case | { sighting_id, case_id } |
| `SIGHTING.VERIFIED` | Moderator verified | { sighting_id, verified_by } |

### 7.3 Match Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `MATCH.SUGGESTED` | AI suggests match | { match_id, missing_id, found_id, score } |
| `MATCH.CONFIRMED` | Moderator confirms | { match_id, resolved_by } |
| `MATCH.REJECTED` | Moderator rejects | { match_id, resolved_by, reason } |

### 7.4 Notification Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `NOTIFY.ER_VET.INITIATED` | ER vet notify started | { attempt_id, case_id, contact_id } |
| `NOTIFY.ER_VET.EMAIL_SENT` | Email delivered | { attempt_id, provider_id } |
| `NOTIFY.ER_VET.VOICE_SENT` | Voice call completed | { attempt_id, provider_id, duration } |
| `NOTIFY.ER_VET.FAILED` | All attempts failed | { attempt_id, error } |
| `NOTIFY.MUNICIPAL.CALL_LOGGED` | Municipal call logged | { log_id, case_id, outcome } |

### 7.5 Moderator Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `MOD.LOCK_CASE` | Case locked | { action_id, case_id, case_type, reason } |
| `MOD.ESCALATE` | Escalated to shelter | { action_id, case_id } |
| `MOD.RELEASE_CONTACT` | Contact info released | { action_id, consent_method } |

---

## 8. VIEW DEFINITIONS

### 8.1 Active Cases Summary

```sql
CREATE VIEW v_active_cases AS
SELECT 
  'missing' AS case_type,
  id,
  county,
  species,
  pet_name AS identifier,
  status,
  created_at,
  last_seen_at AS event_time,
  owner_id AS primary_user_id
FROM missing_pet_case
WHERE status = 'ACTIVE' AND NOT is_deleted

UNION ALL

SELECT 
  'found' AS case_type,
  id,
  county,
  species,
  COALESCE(breed_guess, species::TEXT) AS identifier,
  status,
  created_at,
  found_at AS event_time,
  finder_id AS primary_user_id
FROM found_animal_case
WHERE status = 'ACTIVE' AND NOT is_deleted;
```

### 8.2 Pending Matches

```sql
CREATE VIEW v_pending_matches AS
SELECT 
  ms.id AS match_id,
  ms.confidence_score,
  mp.id AS missing_id,
  mp.pet_name,
  mp.species AS missing_species,
  mp.county AS missing_county,
  fa.id AS found_id,
  fa.species AS found_species,
  fa.county AS found_county,
  ms.created_at
FROM match_suggestion ms
JOIN missing_pet_case mp ON ms.missing_case_id = mp.id
JOIN found_animal_case fa ON ms.found_case_id = fa.id
WHERE ms.status = 'PENDING'
ORDER BY ms.confidence_score DESC;
```

---

## 9. ROW LEVEL SECURITY (RLS) POLICIES

### 9.1 General Principles

- Public users: Read-only access to non-PII case data
- Owners: Full access to own cases
- Finders: Full access to own found reports
- Moderators: Read/write on assigned counties
- System Admin: Full access

### 9.2 Example Policy: missing_pet_case

```sql
-- Enable RLS
ALTER TABLE missing_pet_case ENABLE ROW LEVEL SECURITY;

-- Public read (non-sensitive fields only, handled by API layer)
CREATE POLICY "public_read_active_cases" ON missing_pet_case
  FOR SELECT
  USING (status = 'ACTIVE' AND NOT is_deleted);

-- Owner full access to own cases
CREATE POLICY "owner_full_access" ON missing_pet_case
  FOR ALL
  USING (owner_id = (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()));

-- Moderator access by county
CREATE POLICY "moderator_access" ON missing_pet_case
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profile 
      WHERE firebase_uid = auth.uid() 
        AND role IN ('PIGPIG_MODERATOR', 'SHELTER_MODERATOR', 'SYSTEM_ADMIN')
    )
  );
```

---

## 10. TRIGGER DEFINITIONS

### 10.1 Audit Timestamp Updates

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_missing_case_updated_at
  BEFORE UPDATE ON missing_pet_case
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_found_case_updated_at
  BEFORE UPDATE ON found_animal_case
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_emergency_contact_updated_at
  BEFORE UPDATE ON emergency_contact
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 10.2 Pilot Metrics Auto-Spawn

```sql
CREATE OR REPLACE FUNCTION spawn_pilot_metric_on_case_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pilot_metrics_log (
    action_taken,
    case_id,
    case_type,
    county,
    actor_role,
    metadata
  )
  SELECT 
    CASE TG_TABLE_NAME 
      WHEN 'missing_pet_case' THEN 'CASE_CREATED_MISSING'::metrics_action_enum
      ELSE 'CASE_CREATED_FOUND'::metrics_action_enum
    END,
    NEW.id,
    TG_TABLE_NAME,
    NEW.county,
    up.role,
    jsonb_build_object('species', NEW.species)
  FROM user_profile up
  WHERE up.id = CASE TG_TABLE_NAME 
    WHEN 'missing_pet_case' THEN NEW.owner_id 
    ELSE NEW.finder_id 
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_missing_case_metric
  AFTER INSERT ON missing_pet_case
  FOR EACH ROW EXECUTE FUNCTION spawn_pilot_metric_on_case_create();

CREATE TRIGGER trg_found_case_metric
  AFTER INSERT ON found_animal_case
  FOR EACH ROW EXECUTE FUNCTION spawn_pilot_metric_on_case_create();
```

---

## 11. MIGRATION SEQUENCE

Initial migration order (respecting foreign key dependencies):

1. Create ENUMs
2. `county_pack`
3. `emergency_contact`
4. `aco_availability_override`
5. `user_profile`
6. `missing_pet_case`
7. `found_animal_case`
8. `sighting`
9. `match_suggestion`
10. `moderator_action`
11. `emergency_vet_notify_attempt`
12. `municipal_interaction_log`
13. `pilot_metrics_log`
14. `offline_queued_action`
15. Create views
16. Create triggers
17. Enable RLS policies

---

**END OF DATA MODEL v1.0.0**
