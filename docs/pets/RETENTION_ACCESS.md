# PROVENIQ PETS (WV) — RETENTION & ACCESS CONTROL

**Version:** 1.0.0  
**Status:** ACTIVE  
**Authoritative Reference:** CANONICAL_LAW.md  
**Invariant:** CONTACT_GATED

---

## 0. PURPOSE

This document defines the data retention schedules, role-based access controls, PII handling boundaries, and privacy preservation requirements for the PROVENIQ Pets system. These policies ensure compliance with applicable privacy laws, protect user trust, and maintain operational audit capability.

**Core Principle:** Collect the minimum data necessary, retain only as long as required, and gate access by role and purpose.

---

## 1. ROLE DEFINITIONS

### 1.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM_ADMIN (Level 5)                     │
│                                                                 │
│   Full database access. No case adjudication authority.         │
│   Technical operations, deployment, emergency access.           │
├─────────────────────────────────────────────────────────────────┤
│                   PIGPIG_MODERATOR (Level 4)                    │
│                                                                 │
│   Cross-county case triage. Match confirmation.                 │
│   Contact release authority. Case lock/escalation.              │
├─────────────────────────────────────────────────────────────────┤
│                  SHELTER_MODERATOR (Level 3)                    │
│                                                                 │
│   Shelter intake. Found animal case management.                 │
│   Match confirmation within shelter scope.                      │
├─────────────────────────────────────────────────────────────────┤
│        OWNER (Level 2)         │        FINDER (Level 2)        │
│                                │                                │
│   Create/manage own            │   Create/manage own            │
│   missing pet cases.           │   found animal cases.          │
│   View sightings for           │   View potential matches       │
│   own cases.                   │   (after moderator action).    │
├─────────────────────────────────────────────────────────────────┤
│                     PUBLIC_USER (Level 1)                       │
│                                                                 │
│   Browse public cases. Report sightings.                        │
│   No case creation. Limited to non-PII data.                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Role Assignment

| Role | Assignment Method | Approval Required |
|------|-------------------|-------------------|
| PUBLIC_USER | Default on signup | None |
| OWNER | Automatic when creating missing pet case | None |
| FINDER | Automatic when creating found animal case | None |
| SHELTER_MODERATOR | Manual assignment | PigPig admin approval |
| PIGPIG_MODERATOR | Manual assignment | Founder approval |
| SYSTEM_ADMIN | Manual assignment | Founder approval |

### 1.3 Role Escalation

Users may hold multiple roles. Highest role determines access level.

```
Example: User creates a missing pet case (becomes OWNER)
         Later assigned SHELTER_MODERATOR role
         Access level = SHELTER_MODERATOR (Level 3)
```

---

## 2. ACCESS CONTROL MATRIX

### 2.1 Data Entity Access

| Entity | PUBLIC | OWNER | FINDER | SHELTER_MOD | PIGPIG_MOD | SYS_ADMIN |
|--------|--------|-------|--------|-------------|------------|-----------|
| **county_pack** | Read | Read | Read | Read | Read | Full |
| **emergency_contact** | Read | Read | Read | Read | Read/Write | Full |
| **aco_availability_override** | Read | Read | Read | Read | Read/Write | Full |
| **user_profile (own)** | Read | Full | Full | Full | Full | Full |
| **user_profile (others)** | — | — | — | PII-gated | PII-gated | Full |
| **missing_pet_case (public)** | Read* | Read* | Read* | Read | Read | Full |
| **missing_pet_case (own)** | — | Full | — | — | — | Full |
| **missing_pet_case (assigned)** | — | — | — | Full | Full | Full |
| **found_animal_case (public)** | Read* | Read* | Read* | Read | Read | Full |
| **found_animal_case (own)** | — | — | Full | — | — | Full |
| **found_animal_case (assigned)** | — | — | — | Full | Full | Full |
| **sighting** | Read* | Read* | Read* | Full | Full | Full |
| **match_suggestion** | — | — | — | Full | Full | Full |
| **moderator_action** | — | — | — | Own | Full | Full |
| **emergency_vet_notify_attempt** | — | Own | Own | Read | Full | Full |
| **municipal_interaction_log** | — | Own | Own | Read | Full | Full |
| **pilot_metrics_log** | — | — | — | Read | Read | Full |
| **offline_queued_action** | — | Own | Own | — | — | Full |

*Read = Non-PII fields only (see Section 3)

### 2.2 Action Permissions

| Action | PUBLIC | OWNER | FINDER | SHELTER_MOD | PIGPIG_MOD | SYS_ADMIN |
|--------|--------|-------|--------|-------------|------------|-----------|
| Create missing case | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Create found case | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Report sighting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View match suggestions | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Confirm match | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reject match | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Lock case | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Escalate to shelter | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Release contact info | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Trigger ER vet notify | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Log municipal call | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View pilot metrics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Export data | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modify retention policy | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. PII BOUNDARIES

### 3.1 PII Field Classification

| Field | Classification | Visible To |
|-------|----------------|------------|
| `user_profile.email` | PII | Own, Moderators (gated), Admin |
| `user_profile.phone` | PII | Own, Moderators (gated), Admin |
| `user_profile.display_name` | Semi-PII | Own, Moderators, Admin |
| `missing_pet_case.owner_id` | Link to PII | Moderators, Admin |
| `missing_pet_case.last_seen_address` | Location PII | Owner, Moderators, Admin |
| `missing_pet_case.last_seen_lat/lng` | Location PII | Owner, Moderators, Admin |
| `found_animal_case.finder_id` | Link to PII | Moderators, Admin |
| `found_animal_case.found_address` | Location PII | Finder, Moderators, Admin |
| `sighting.reporter_phone` | PII | Moderators, Admin |
| `sighting.reporter_name` | Semi-PII | Moderators, Admin |
| `sighting.sighting_lat/lng` | Location PII | Case owner, Moderators, Admin |

### 3.2 Public View Redaction

When serving data to PUBLIC_USER or unauthenticated requests:

```javascript
function redactForPublic(case: MissingPetCase): PublicCaseView {
  return {
    id: case.id,
    case_reference: case.case_reference,
    pet_name: case.pet_name,
    species: case.species,
    breed: case.breed,
    color_primary: case.color_primary,
    distinguishing_features: case.distinguishing_features,
    photo_url: case.photo_urls?.[0],  // Primary photo only
    last_seen_area: geocodeToArea(case.last_seen_lat, case.last_seen_lng),  // "Downtown Lewisburg"
    last_seen_at: case.last_seen_at,
    status: case.status,
    created_at: case.created_at,
    // REDACTED: owner_id, exact address, exact coordinates, all contact info
  };
}
```

### 3.3 Contact Information Gating

```
INVARIANT: CONTACT_GATED
├─ Owner contact info is NEVER auto-released to finders
├─ Release requires ModeratorAction of type RELEASE_CONTACT
├─ ModeratorAction logs:
│   ├─ moderator_id (who released)
│   ├─ timestamp_utc
│   ├─ reason (optional note)
│   └─ consent_method:
│       ├─ OWNER_OPT_IN: Owner explicitly approved release
│       ├─ EMERGENCY_OVERRIDE: Medical emergency, moderator judgment
│       └─ SHELTER_INTAKE: Animal at shelter, standard protocol
└─ Finder receives message: "The owner has been contacted"
   (NOT the owner's contact information)
```

### 3.4 Consent Flow

```
Found animal matches missing pet
    │
    ▼
Moderator reviews match
    │
    ▼
Moderator contacts OWNER (not finder) via system
    │
    ├─── Owner opts-in to contact release
    │         │
    │         ▼
    │    ModeratorAction: RELEASE_CONTACT
    │    consent_method: OWNER_OPT_IN
    │         │
    │         ▼
    │    Finder receives owner contact info
    │
    └─── Owner declines
              │
              ▼
         Moderator facilitates reunion
         (no direct contact exchange)
```

---

## 4. RETENTION SCHEDULES

### 4.1 Default Retention (Pilot)

| Data Category | Retention Period | Trigger |
|---------------|------------------|---------|
| **Active cases** | Indefinite while ACTIVE | Status change |
| **Closed cases (REUNITED)** | 90 days | closed_at |
| **Closed cases (ADOPTED)** | 90 days | closed_at |
| **Closed cases (DECEASED)** | 30 days | closed_at |
| **Closed cases (EXPIRED)** | 30 days | closed_at |
| **Sightings (linked)** | Same as parent case | Case retention |
| **Sightings (unlinked)** | 30 days | created_at |
| **Match suggestions** | 90 days | resolved_at or created_at |
| **Moderator actions** | 180 days | created_at |
| **Emergency vet notify attempts** | 180 days | created_at |
| **Municipal interaction logs** | 90 days | created_at |
| **Pilot metrics logs** | 365 days | timestamp |
| **Offline queued actions (synced)** | 7 days | resolved_at |
| **Offline queued actions (failed)** | 30 days | last_sync_attempt |
| **User profiles (active)** | Indefinite | last_active_at |
| **User profiles (inactive >1 year)** | Marked for review | last_active_at |

### 4.2 Retention Policy Overrides

System Admin may configure policy knobs per deployment:

```yaml
retention_policy:
  closed_case_days: 90           # Default: 90
  municipal_log_days: 90         # Default: 90, Policy may require 180
  pilot_metrics_days: 365        # Default: 365
  inactive_user_threshold_days: 365
  enable_auto_purge: false       # Pilot: manual review required
```

### 4.3 Retention Enforcement

```
Daily Retention Job (02:00 UTC)
    │
    ▼
┌─────────────────────────────────────────┐
│ Query entities past retention date      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ For each entity:                        │
│   1. Check for holds (legal, audit)     │
│   2. If no hold: Mark for deletion      │
│   3. Log retention action               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ If enable_auto_purge:                   │
│   Execute deletions                     │
│ Else:                                   │
│   Generate report for manual review     │
└─────────────────────────────────────────┘
```

### 4.4 Legal Holds

```typescript
interface LegalHold {
  id: string;
  entity_type: 'case' | 'log' | 'user';
  entity_id: string;
  reason: string;
  requested_by: string;
  effective_from: string;
  effective_until: string | null;  // null = indefinite
  created_at: string;
}

// Entities under legal hold are NEVER auto-purged
// Manual release by System Admin + Founder approval
```

---

## 5. DATA EXPORT & DELETION

### 5.1 User Data Export (GDPR-style)

Users may request export of their data:

| Included | Format |
|----------|--------|
| User profile | JSON |
| Own cases (missing or found) | JSON |
| Own sightings | JSON |
| Own notification attempts | JSON |
| Own municipal call logs | JSON |

| Excluded | Reason |
|----------|--------|
| Other users' data | Privacy |
| System logs referencing user | Operational necessity |
| Aggregated metrics | Anonymized; not personal |

### 5.2 Export Process

```
User requests export via API/support
    │
    ▼
Request logged with timestamp
    │
    ▼
System generates export package (async)
    │
    ▼
Export package available for download (72 hours)
    │
    ▼
Download link sent to verified email
    │
    ▼
After 72 hours: Export deleted
```

### 5.3 Right to Deletion

Users may request deletion of their data:

| Deletable | Action |
|-----------|--------|
| User profile | Anonymize (do not hard delete if linked to cases) |
| Own cases | Soft delete (is_deleted = true) |
| Own sightings | Soft delete |
| Notification attempts (own) | Anonymize user reference |

| Not Deletable | Reason |
|---------------|--------|
| Moderator action logs | Audit trail integrity |
| Pilot metrics (anonymized) | Anonymized; operational necessity |
| Matched case data | May affect other party's case |

### 5.4 Deletion Process

```
User requests deletion
    │
    ▼
Verify identity (re-authentication)
    │
    ▼
Check for active cases
    │
    ├─── Active cases exist
    │         │
    │         ▼
    │    "Please close cases before deletion"
    │
    └─── No active cases
              │
              ▼
         Anonymize user profile
         Soft-delete owned entities
         Log deletion action
              │
              ▼
         Confirmation email to verified address
```

---

## 6. AUDIT LOGGING

### 6.1 Audited Events

All access to sensitive data is logged:

| Event | Logged Fields |
|-------|---------------|
| Case viewed | viewer_id, case_id, access_level |
| PII accessed | accessor_id, data_type, entity_id |
| Contact released | moderator_id, case_id, consent_method |
| Data exported | user_id, export_id, included_entities |
| Data deleted | user_id, deletion_id, affected_entities |
| Role assigned | admin_id, user_id, role, reason |
| Role revoked | admin_id, user_id, role, reason |
| Retention override | admin_id, entity_id, new_retention |
| Legal hold applied | admin_id, hold_id, entity_ids |

### 6.2 Audit Log Retention

| Log Type | Retention |
|----------|-----------|
| Access logs | 90 days |
| PII access logs | 180 days |
| Deletion logs | 365 days |
| Legal hold logs | 7 years |
| Role change logs | 365 days |

### 6.3 Audit Log Access

| Role | Access Level |
|------|--------------|
| Public | None |
| Owner/Finder | Own access logs only |
| Shelter Moderator | None |
| PigPig Moderator | Read (redacted user IDs) |
| System Admin | Full |

---

## 7. MUNICIPAL ACCOUNTABILITY DATA

### 7.1 Internal-Only Analytics

```
INVARIANT: ACCOUNTABILITY_INTERNAL
├─ Municipal interaction logs are OPERATIONAL AUDIT LOGS
├─ They are NOT public records
├─ Aggregated analytics are INTERNAL ONLY
├─ Publication requires:
│   ├─ Anonymization of all individual cases
│   ├─ Aggregation (no single-case data)
│   ├─ Counsel review
│   └─ Founder approval
└─ No "name and shame" dashboards
```

### 7.2 Permitted Internal Metrics

| Metric | Aggregation Level | Access |
|--------|-------------------|--------|
| Calls by county | County (total) | Moderators, Admin |
| Outcome distribution | County (total) | Moderators, Admin |
| Average response (self-reported) | County (total) | Moderators, Admin |
| Trends over time | County, weekly | Moderators, Admin |

### 7.3 Prohibited Metrics

| Metric | Reason |
|--------|--------|
| Response rate by officer | Individual attribution = defamation risk |
| "Failed response" counts by agency | "Failure" language = legal liability |
| Public dashboard of outcomes | Public shaming |
| Comparative "ranking" of counties | Inflammatory without context |

### 7.4 Safe Language for Reports

| Prohibited | Required Alternative |
|------------|---------------------|
| "County X failed 40% of calls" | "40% of calls in County X had unknown outcomes" |
| "Officer Y is unresponsive" | "Response status data unavailable" |
| "Agency Z refuses to help" | "Outcome data for Agency Z: [distribution]" |

---

## 8. IMPLEMENTATION REQUIREMENTS

### 8.1 Row-Level Security (RLS)

Supabase RLS policies MUST enforce:

```sql
-- Users can only see their own profile
CREATE POLICY "users_own_profile" ON user_profile
  FOR ALL USING (firebase_uid = auth.uid());

-- Owners can access own cases
CREATE POLICY "owner_cases" ON missing_pet_case
  FOR ALL USING (
    owner_id = (SELECT id FROM user_profile WHERE firebase_uid = auth.uid())
  );

-- Moderators can access assigned counties
CREATE POLICY "moderator_access" ON missing_pet_case
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profile 
      WHERE firebase_uid = auth.uid() 
        AND role IN ('PIGPIG_MODERATOR', 'SHELTER_MODERATOR')
    )
  );

-- Match suggestions are moderator-only
CREATE POLICY "match_moderator_only" ON match_suggestion
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profile 
      WHERE firebase_uid = auth.uid() 
        AND role IN ('PIGPIG_MODERATOR', 'SHELTER_MODERATOR', 'SYSTEM_ADMIN')
    )
  );
```

### 8.2 API Layer Enforcement

Backend MUST enforce access controls regardless of RLS:

```typescript
function assertCanViewCase(user: User, case: Case): void {
  if (user.role === 'SYSTEM_ADMIN') return;
  
  if (case.type === 'missing' && case.owner_id === user.id) return;
  if (case.type === 'found' && case.finder_id === user.id) return;
  
  if (['PIGPIG_MODERATOR', 'SHELTER_MODERATOR'].includes(user.role)) return;
  
  // For public users, only allow if case is ACTIVE and redacted
  if (case.status !== 'ACTIVE') {
    throw new ForbiddenError('Case not accessible');
  }
  
  // Redact PII for public access
  return redactForPublic(case);
}
```

### 8.3 Encryption Requirements

| Data | At Rest | In Transit |
|------|---------|------------|
| Database | Supabase default (AES-256) | TLS 1.3 |
| File storage | AES-256 | TLS 1.3 |
| Backups | AES-256 | TLS 1.3 |
| API traffic | N/A | TLS 1.3 |
| Webhook payloads | N/A | TLS 1.3 + HMAC signature |

---

## 9. BREACH RESPONSE

### 9.1 Breach Detection Indicators

| Indicator | Severity |
|-----------|----------|
| Mass export requests | High |
| Unusual moderator data access patterns | Medium |
| Failed auth attempts > threshold | Medium |
| API rate limit exceeded persistently | Low |

### 9.2 Response Protocol

```
Breach indicator detected
    │
    ├─── Severity: Low
    │         │
    │         ▼
    │    Log and monitor
    │
    ├─── Severity: Medium
    │         │
    │         ▼
    │    Alert on-call
    │    Investigate within 4 hours
    │    Escalate if confirmed
    │
    └─── Severity: High
              │
              ▼
         Immediate escalation to Founder
         Consider service suspension
         Preserve evidence
         Legal notification if PII exposed
```

### 9.3 Notification Requirements

If breach involves PII:

| Requirement | Timeline |
|-------------|----------|
| Internal notification | Immediate |
| Founder notification | < 1 hour |
| Affected users notification | < 72 hours |
| Regulatory notification (if applicable) | Per regulation |

---

## 10. POLICY GOVERNANCE

### 10.1 Policy Owner

| Policy Area | Owner |
|-------------|-------|
| Retention schedules | System Admin + Founder |
| Access control matrix | Proveniq Prime |
| PII classification | Proveniq Prime + Counsel |
| Municipal accountability framing | Counsel |

### 10.2 Policy Amendment

Amendments to this document require:

1. Written proposal
2. Impact assessment
3. Founder approval
4. Counsel review (if PII or municipal)
5. Version increment
6. Changelog entry

### 10.3 Periodic Review

| Review Type | Frequency |
|-------------|-----------|
| Access control audit | Quarterly |
| Retention schedule review | Annually |
| PII classification review | Annually |
| Breach response drill | Annually |

---

**END OF RETENTION & ACCESS CONTROL v1.0.0**
