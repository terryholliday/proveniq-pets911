# PROVENIQ PETS (WV) — CANONICAL LAW

**Version:** 1.0.0  
**Status:** ACTIVE  
**Effective Date:** 2026-01-05  
**Authority:** Proveniq Prime / Terry (Founder)  
**Jurisdiction:** West Virginia Pilot (Greenbrier County, Kanawha County)

---

## 0. PREAMBLE

This document constitutes the **Canonical Law** for the PROVENIQ Pets (WV) subsystem. All implementation agents (Windsurf, human developers, or other execution systems) MUST treat this document as **READ-ONLY LAW**. Deviation from this specification constitutes a protocol violation.

**Mission:** Reduce preventable pet deaths and permanent family separations through deterministic, audit-safe emergency coordination infrastructure.

**Strategic Doctrine (Microchip Legacy Replacement):** The system serves as a zero-cost "Truth Layer" for microchip identification, actively replacing rent-seeking registry companies that gate reunification behind paywalls.

---

## 1. POWER HIERARCHY (FINAL)

| Rank | Entity | Authority |
|------|--------|-----------|
| 1 | **Terry (Founder)** | May override any constraint. Sole veto authority. |
| 2 | **Proveniq Prime** | Interprets law; issues enforcement rulings. |
| 3 | **Canonical Law (This Document)** | Defines invariants; read-only by implementers. |
| 4 | **PigPig Moderator** | Operational authority within case scope. May escalate, lock, confirm matches. |
| 5 | **Shelter Moderator** | Intake authority for found animals within shelter scope. |
| 6 | **System Admin** | Technical operations only. No case adjudication authority. |
| 7 | **Owner / Finder / Public User** | Reporting authority only. No direct case modification. |

---

## 2. SYSTEM BOUNDARIES

### 2.1 IN-SCOPE

| Capability | Description |
|------------|-------------|
| **Emergency Vet Notification** | Email + Twilio voice (TTS) to landline for after-hours emergencies |
| **Municipal Interaction Logging** | In-app dialer with on-screen script; user-reported outcome capture |
| **Offline Caching** | Per-county pack (Greenbrier / Kanawha); functional in dead zones |
| **Triage Dashboard** | PigPig moderators escalate to shelter; lock cases |
| **Match Suggestions** | Found→Missing matching, non-public until moderator confirmation |
| **Pilot Telemetry** | Day 1 metrics: case_type, county, action, outcome |
| **Microchip Registry** | Zero-cost registration and lookup; replacement for legacy paid registries |

### 2.2 OUT-OF-SCOPE (PROHIBITED)

| Prohibition | Rationale |
|-------------|-----------|
| Facebook/Meta scraping or auto-reply | Not authorized; legal exposure |
| Automatic owner contact info release | Privacy; requires moderator gating |
| Public "name and shame" dashboard | Defamation risk; requires counsel review |
| Medical diagnosis or treatment advice | AI advisory only; no certainty claims |
| Legal conclusions about municipal liability | Operational logs only; no public records claims |
| SMS to owners (default) | Opt-in only; push/in-app notification default |

---

## 3. STACK ASSUMPTIONS (LOCKED)

These stack decisions are **immutable** for this specification. Implementation MUST NOT substitute alternatives.

| Layer | Technology | Notes |
|-------|------------|-------|
| Authentication | Firebase Auth | Single project across all PROVENIQ apps |
| Relational Data | Supabase (Postgres) | Primary datastore |
| Voice Notifications | Twilio (TTS) | Landlines for ER vets |
| SMS (Future) | Twilio | Opt-in only; not default |
| Email | Resend (or equivalent) | Clinic/shelter notifications |
| Frontend | PWA/Next.js | Windsurf implementation scope |
| Backend | (Undefined) | May be FastAPI, Next API routes, or other. Contracts define behavior only. |

---

## 4. MASTER INVARIANTS

These invariants are **NON-NEGOTIABLE**. Any violation constitutes a system failure.

### 4.1 Match Suggestion Privacy

```
INVARIANT: MATCH_SUGGESTION_PRIVATE
├─ Match suggestions (Found→Missing) are NEVER visible to:
│   ├─ Public users
│   ├─ Owners (until moderator confirmation)
│   └─ Finders (unless moderator explicitly shares)
├─ Only visible to: PigPigModerator, ShelterModerator, SystemAdmin
└─ Transition to "confirmed" requires explicit ModeratorAction
```

### 4.2 Notification Logging

```
INVARIANT: NOTIFICATION_LOG_COMPLETE
├─ Every outbound notification attempt MUST spawn a log entry
├─ Log entry MUST include:
│   ├─ notification_type: email | voice | sms | push
│   ├─ provider_status: attempted | sent | delivered | failed
│   ├─ provider_id: external reference (Twilio SID, Resend ID, etc.)
│   └─ timestamp_utc
└─ No notification may be sent without corresponding log entry
```

### 4.3 Offline Idempotency

```
INVARIANT: OFFLINE_IDEMPOTENT
├─ Every offline-queued POST MUST include an idempotency_key
├─ Server MUST reject duplicate idempotency_keys within 24-hour window
├─ Client MUST retry failed syncs with same idempotency_key
└─ No action may be duplicated due to connectivity interruption
```

### 4.4 AI Output Boundaries

```
INVARIANT: AI_NO_CERTAINTY
├─ AI outputs MUST be bounded to:
│   ├─ summarize (aggregate user-reported data)
│   ├─ cluster (group similar sightings/cases)
│   ├─ rank (prioritize by recency, proximity, confidence factors)
│   └─ highlight_uncertainty (explicitly state confidence bounds)
├─ AI MUST NOT:
│   ├─ Claim certainty about pet location or status
│   ├─ Provide medical advice or diagnosis
│   ├─ Make legal conclusions
│   └─ Generate "false hope" messaging
└─ All AI-generated text MUST include disclosure: "AI advisory only. Not a guarantee."
```

### 4.5 Pilot Metrics Integrity

```
INVARIANT: PILOT_METRICS_COMPLETE
├─ Every significant workflow completion MUST spawn PilotMetricsLog entry
├─ Required fields: case_type, county, timestamp, action_taken, outcome
├─ Workflow completions include:
│   ├─ MissingPetCase created
│   ├─ FoundAnimalCase created
│   ├─ Sighting reported
│   ├─ Emergency vet notification sent
│   ├─ Municipal call logged
│   ├─ Match confirmed or rejected
│   └─ Case closed (any resolution)
└─ PilotMetricsLog is append-only; no deletes or updates
```

### 4.6 Contact Info Gating

```
INVARIANT: CONTACT_GATED
├─ Owner contact information is NEVER auto-released to finders
├─ Release requires explicit ModeratorAction of type RELEASE_CONTACT
├─ ModeratorAction MUST log:
│   ├─ moderator_id
│   ├─ timestamp_utc
│   ├─ reason (optional note)
│   └─ consent_method (owner opt-in, emergency override, etc.)
└─ Finder receives only notification that "owner has been contacted"
```

---

## 5. LEGAL/SAFETY CONSTRAINTS (BINDING)

### 5.1 Municipal Accountability Language

**PROHIBITED** language constructs:

| Prohibited | Required Alternative |
|------------|---------------------|
| "This creates a public record" | "This creates an operational audit log for internal tracking" |
| "The county is required to respond" | "County ordinance indicates officers should respond; requesting assistance" |
| "Officer [Name] failed to act" | "Response status: pending/complete/unknown" (no individual attribution) |
| "Name and shame" phrasing | Aggregated, anonymized metrics only; counsel review before publication |

### 5.2 No Defamatory Framing

Municipal interaction logs are **OPERATIONAL AUDIT LOGS**. They:

- DO NOT constitute formal complaints unless user explicitly files one through proper channels
- DO NOT imply negligence, malfeasance, or misconduct
- DO contain factual data: call initiated, duration, user-reported outcome
- ARE subject to internal aggregation and anonymization before any publication

### 5.3 AI Disclosure Requirements

Every AI-generated output visible to users MUST include one of the following disclosures:

| Context | Required Disclosure |
|---------|---------------------|
| Match suggestions | "AI-suggested match. Moderator verification required." |
| Sighting clusters | "Approximate area based on reported sightings. Actual location unknown." |
| Triage recommendations | "Priority suggestion only. Human moderator makes final decisions." |
| Any AI summary | "AI advisory only. Not a guarantee of accuracy or outcome." |

### 5.4 False Hope Prohibition

The system MUST NOT generate messaging that:

- Implies a lost pet will definitely be found
- Suggests a sighting is confirmed without moderator verification
- Claims certainty about pet health, location, or survival
- Promises specific response times from municipal agencies

**REQUIRED** alternative framing:

| Prohibited | Required |
|------------|----------|
| "Your pet has been found!" | "A potential match has been reported. Awaiting verification." |
| "Help is on the way" | "Assistance has been requested. Response times vary." |
| "Don't worry, we'll find them" | "We're working to coordinate search efforts." |

---

## 6. ROLE DEFINITIONS

### 6.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM ADMIN                              │
│     (Technical ops: DB access, deployments, no case authority)  │
├─────────────────────────────────────────────────────────────────┤
│                      PIGPIG MODERATOR                            │
│   (Case triage, escalation, match confirmation, lock/unlock)    │
├─────────────────────────────────────────────────────────────────┤
│                     SHELTER MODERATOR                            │
│   (Found animal intake, shelter-side case management)           │
├─────────────────────────────────────────────────────────────────┤
│           OWNER              │           FINDER                  │
│   (Report missing pet,       │   (Report found animal,           │
│    receive notifications)    │    log sightings)                 │
├─────────────────────────────────────────────────────────────────┤
│                       PUBLIC USER                                │
│          (Browse, report sightings, no case creation)           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Role Permissions Matrix

| Action | PublicUser | Owner | Finder | PigPigMod | ShelterMod | SysAdmin |
|--------|------------|-------|--------|-----------|------------|----------|
| View public cases | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create MissingPetCase | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Create FoundAnimalCase | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Report sighting | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View match suggestions | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Confirm/reject match | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Lock case | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Escalate to shelter | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Release contact info | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Trigger ER vet notify | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Log municipal call | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View pilot metrics | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Modify retention policy | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 7. NOTIFICATION PROTOCOLS

### 7.1 Emergency Vet Notification (Day 1)

**Trigger:** User initiates "Notify ER Vet" action

**Sequence:**
1. User selects emergency contact from CountyPack
2. System sends **email** to clinic address
3. System initiates **Twilio voice call (TTS)** to clinic landline
4. Both attempts logged to `EmergencyVetNotifyAttempt`
5. User sees delivery status on confirmation screen

**Required Log Fields:**
- `case_id` (nullable if no case context)
- `contact_id` (EmergencyContact reference)
- `email_attempt`: { provider_id, status, timestamp }
- `voice_attempt`: { provider_id, status, duration_seconds, timestamp }

### 7.2 Municipal Call Protocol

**Trigger:** User initiates municipal contact button

**Sequence:**
1. App displays on-screen script based on case type and county
2. App initiates native dialer with pre-populated number
3. Upon return to app, user prompted for outcome logging
4. **Optional:** If agency has explicitly opted-in, send email notification

**Script Template Variables:**
```
${CALLER_NAME} — User-provided name (not required)
${PET_DESCRIPTION} — Species, breed, color, distinguishing features
${LAST_SEEN_LOCATION} — Address or landmark
${LAST_SEEN_TIME} — Relative time ("about 2 hours ago")
${CASE_REFERENCE} — Internal case ID for tracking
```

**Outcome Options (User-Reported):**
- `OFFICER_DISPATCHED` — Agency confirmed dispatch
- `CALLBACK_PROMISED` — Agency promised to call back
- `NO_ANSWER` — Call not answered
- `REFERRED_ELSEWHERE` — Directed to different agency
- `DECLINED` — Agency declined to assist
- `UNKNOWN` — User unsure of outcome

---

## 8. OFFLINE BEHAVIOR REQUIREMENTS

### 8.1 County Pack Caching

Each supported county MUST have a downloadable offline pack containing:

| Data | Update Frequency | Size Constraint |
|------|------------------|-----------------|
| EmergencyContact list | Weekly | < 100KB |
| ACOAvailabilityOverride (current) | Daily | < 10KB |
| Municipal phone numbers | Weekly | < 10KB |
| On-screen scripts | Per-release | < 50KB |

**Current Counties:** Greenbrier, Kanawha

### 8.2 Offline Queue Requirements

When device is offline:

1. All POST actions (new case, sighting, notification request) queued locally
2. Each queued action assigned `idempotency_key` (UUID v4)
3. Queue persists across app restarts (IndexedDB or equivalent)
4. On reconnection:
   - Actions replayed in order
   - Server rejects duplicates (same idempotency_key within 24h)
   - User notified of sync status

### 8.3 Read Behavior When Offline

| Data Type | Offline Behavior |
|-----------|------------------|
| Own cases | Cached, read-only |
| Emergency contacts | Cached from CountyPack |
| Public case list | Stale data with "Last updated" indicator |
| Match suggestions | NOT cached (moderator-only, requires fresh data) |

---

## 9. PILOT METRICS (DAY 1 REQUIREMENT)

The `PilotMetricsLog` table is **MANDATORY** from first deployment.

### 9.1 Required Events

| Event | Trigger | Fields |
|-------|---------|--------|
| `CASE_CREATED_MISSING` | New MissingPetCase | case_id, county, pet_species |
| `CASE_CREATED_FOUND` | New FoundAnimalCase | case_id, county, animal_species |
| `SIGHTING_REPORTED` | New Sighting | case_id (if linked), county, sighting_type |
| `ER_VET_NOTIFY_SENT` | Notification dispatched | case_id, contact_id, channels_used |
| `MUNICIPAL_CALL_LOGGED` | Outcome recorded | case_id, county, outcome |
| `MATCH_CONFIRMED` | Moderator confirms match | missing_case_id, found_case_id |
| `MATCH_REJECTED` | Moderator rejects match | missing_case_id, found_case_id, reason |
| `CASE_CLOSED` | Any case resolution | case_id, resolution_type |

### 9.2 Aggregation Queries (Examples)

```sql
-- Cases by county this week
SELECT county, COUNT(*) FROM pilot_metrics_log 
WHERE action_taken = 'CASE_CREATED_MISSING' 
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY county;

-- Municipal response outcomes
SELECT outcome, COUNT(*) FROM pilot_metrics_log
WHERE action_taken = 'MUNICIPAL_CALL_LOGGED'
GROUP BY outcome;

-- Successful reunifications
SELECT COUNT(*) FROM pilot_metrics_log
WHERE action_taken = 'CASE_CLOSED' 
  AND outcome = 'REUNITED';
```

---

## 10. AMENDMENT PROTOCOL

This Canonical Law may only be amended by:

1. **Founder directive** (Terry) — via explicit written instruction
2. **Proveniq Prime ruling** — with documented justification
3. **Counsel review** — for legal/safety constraint changes

All amendments MUST be versioned with:
- Version number increment
- Effective date
- Summary of changes
- Rationale

**Implementers may not amend this document.** Implementation issues should be escalated to Proveniq Prime for interpretation or amendment.

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| **PigPig** | Central moderator organization for pilot region |
| **County Pack** | Offline-cacheable data bundle per county |
| **ACO** | Animal Control Officer |
| **Idempotency Key** | Unique identifier preventing duplicate action processing |
| **Match Suggestion** | AI-generated potential match between FoundAnimalCase and MissingPetCase |
| **Operational Audit Log** | Internal tracking record, not a formal public record |

---

## APPENDIX B: DOCUMENT RELATIONSHIPS

```
CANONICAL_LAW.md (this document)
├── DATA_MODEL.md — Implements entities defined here
├── API_CONTRACTS.md — Implements notification/logging protocols
├── OFFLINE_PROTOCOL.md — Implements offline requirements
├── AI_GUARDRAILS.md — Implements AI boundary invariants
└── RETENTION_ACCESS.md — Implements role permissions and retention
```

---

**END OF CANONICAL LAW v1.0.0**
