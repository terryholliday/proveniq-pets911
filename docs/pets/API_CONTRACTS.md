# PROVENIQ PETS (WV) — API CONTRACTS

**Version:** 1.0.0  
**Status:** ACTIVE  
**Authoritative Reference:** CANONICAL_LAW.md, DATA_MODEL.md  
**Transport:** HTTPS (TLS 1.3+)  
**Authentication:** Firebase Auth JWT (Bearer token)

---

## 0. CONTRACT CONVENTIONS

### 0.1 Base URL Structure

```
Production: https://api.proveniq.com/pets/v1
Staging:    https://api-staging.proveniq.com/pets/v1
```

### 0.2 Authentication Header

All authenticated endpoints require:

```http
Authorization: Bearer <firebase_jwt_token>
```

### 0.3 Standard Response Envelope

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T05:48:46Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T05:48:46Z"
  }
}
```

### 0.4 Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid JWT |
| `AUTH_EXPIRED` | 401 | JWT expired |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `IDEMPOTENCY_CONFLICT` | 409 | Duplicate idempotency_key within 24h |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### 0.5 Idempotency

All mutating endpoints (POST, PUT, DELETE) MUST accept:

```http
Idempotency-Key: <uuid>
```

Server behavior:
- If key seen within 24 hours: Return cached response, do not re-execute
- If key not seen: Execute and cache response

---

## 1. COUNTY PACK ENDPOINTS

### 1.1 List County Packs

```http
GET /county-packs
```

**Auth Required:** No

**Response (200):**

```json
{
  "success": true,
  "data": {
    "county_packs": [
      {
        "id": "uuid",
        "county": "GREENBRIER",
        "display_name": "Greenbrier County",
        "timezone": "America/New_York",
        "version": 3,
        "last_updated_at": "2026-01-04T00:00:00Z",
        "bundle_url": "https://cdn.proveniq.com/pets/packs/greenbrier_v3.zip",
        "bundle_checksum": "sha256:abc123...",
        "bundle_size_kb": 85
      },
      {
        "id": "uuid",
        "county": "KANAWHA",
        "display_name": "Kanawha County",
        "timezone": "America/New_York",
        "version": 2,
        "last_updated_at": "2026-01-03T00:00:00Z",
        "bundle_url": "https://cdn.proveniq.com/pets/packs/kanawha_v2.zip",
        "bundle_checksum": "sha256:def456...",
        "bundle_size_kb": 72
      }
    ]
  }
}
```

### 1.2 Get Emergency Contacts for County

```http
GET /county-packs/{county}/emergency-contacts
```

**Path Parameters:**
- `county`: `GREENBRIER` | `KANAWHA`

**Query Parameters:**
- `type` (optional): Filter by contact_type (e.g., `ER_VET`, `SHELTER`, `ANIMAL_CONTROL`)
- `accepts_emergency` (optional): `true` to filter 24-hour/emergency capable

**Auth Required:** No

**Response (200):**

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "uuid",
        "contact_type": "ER_VET",
        "name": "Greenbrier Valley Animal Hospital",
        "phone_primary": "+13045551234",
        "phone_secondary": null,
        "email": "emergency@gvah.vet",
        "address": "123 Main St, Lewisburg, WV 24901",
        "is_24_hour": true,
        "accepts_emergency": true,
        "accepts_wildlife": false,
        "accepts_livestock": true,
        "hours": {
          "mon": "24h",
          "tue": "24h",
          "wed": "24h",
          "thu": "24h",
          "fri": "24h",
          "sat": "24h",
          "sun": "24h"
        }
      },
      {
        "id": "uuid",
        "contact_type": "ANIMAL_CONTROL",
        "name": "Greenbrier County Animal Control",
        "phone_primary": "+13045555678",
        "email": null,
        "address": "456 County Rd, Lewisburg, WV 24901",
        "is_24_hour": false,
        "accepts_emergency": true,
        "hours": {
          "mon": "08:00-17:00",
          "tue": "08:00-17:00",
          "wed": "08:00-17:00",
          "thu": "08:00-17:00",
          "fri": "08:00-17:00",
          "sat": "CLOSED",
          "sun": "CLOSED"
        },
        "availability_override": {
          "type": "REDUCED_HOURS",
          "reason": "Staff shortage",
          "effective_until": "2026-01-15T00:00:00Z",
          "alternate_phone": "+13046477911"
        }
      }
    ]
  }
}
```

---

## 2. CASE MANAGEMENT ENDPOINTS

### 2.1 Create Missing Pet Case

```http
POST /cases/missing
```

**Auth Required:** Yes (OWNER, PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "pet_name": "Buddy",
  "species": "DOG",
  "breed": "Golden Retriever",
  "color_primary": "Golden",
  "color_secondary": null,
  "distinguishing_features": "White patch on chest, limps slightly on right front leg",
  "weight_lbs": 65.5,
  "age_years": 4.5,
  "sex": "male",
  "is_neutered": true,
  "microchip_id": "985121054321234",
  "photo_urls": [
    "https://storage.proveniq.com/pets/uploads/abc123.jpg"
  ],
  "last_seen_at": "2026-01-04T14:30:00-05:00",
  "last_seen_lat": 37.8018,
  "last_seen_lng": -80.4456,
  "last_seen_address": "123 Main St, Lewisburg, WV 24901",
  "last_seen_notes": "Got out through back gate. Wearing blue collar with tags.",
  "county": "GREENBRIER"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "uuid",
      "status": "ACTIVE",
      "pet_name": "Buddy",
      "species": "DOG",
      "county": "GREENBRIER",
      "created_at": "2026-01-05T05:48:46Z",
      "case_reference": "GRN-2026-0042"
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T05:48:46Z",
    "pilot_metric_logged": true
  }
}
```

### 2.2 Create Found Animal Case

```http
POST /cases/found
```

**Auth Required:** Yes (FINDER, PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "species": "DOG",
  "breed_guess": "Golden Retriever mix",
  "color_primary": "Golden",
  "color_secondary": "White",
  "distinguishing_features": "White chest, seems to favor right front leg",
  "weight_lbs_estimate": 60,
  "age_estimate": "adult",
  "sex": "male",
  "has_collar": true,
  "collar_description": "Blue collar, no visible tags",
  "microchip_scanned": false,
  "condition_notes": "Appears healthy but hungry. Friendly.",
  "needs_immediate_vet": false,
  "photo_urls": [
    "https://storage.proveniq.com/pets/uploads/def456.jpg"
  ],
  "found_at": "2026-01-05T08:15:00-05:00",
  "found_lat": 37.8025,
  "found_lng": -80.4430,
  "found_address": "Near corner of Oak St and Maple Ave, Lewisburg",
  "found_notes": "Found wandering in my yard. Currently in my garage.",
  "current_location_type": "WITH_FINDER",
  "county": "GREENBRIER"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "uuid",
      "status": "ACTIVE",
      "species": "DOG",
      "county": "GREENBRIER",
      "created_at": "2026-01-05T13:15:00Z",
      "case_reference": "GRN-F-2026-0018"
    },
    "match_suggestions_pending": 1,
    "ai_advisory": "AI-suggested match. Moderator verification required."
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T13:15:00Z",
    "pilot_metric_logged": true
  }
}
```

### 2.3 List Active Cases

```http
GET /cases
```

**Query Parameters:**
- `county` (required): `GREENBRIER` | `KANAWHA`
- `type` (optional): `missing` | `found` | `all` (default: `all`)
- `species` (optional): Filter by species
- `status` (optional): Default `ACTIVE`
- `page` (optional): Default 1
- `per_page` (optional): Default 20, max 100

**Auth Required:** No (public view, PII redacted)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "uuid",
        "type": "missing",
        "case_reference": "GRN-2026-0042",
        "species": "DOG",
        "breed": "Golden Retriever",
        "color_primary": "Golden",
        "distinguishing_features": "White patch on chest",
        "pet_name": "Buddy",
        "last_seen_at": "2026-01-04T14:30:00-05:00",
        "last_seen_area": "Downtown Lewisburg",
        "photo_url": "https://storage.proveniq.com/pets/uploads/abc123_thumb.jpg",
        "status": "ACTIVE",
        "created_at": "2026-01-05T05:48:46Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_count": 42,
      "total_pages": 3
    }
  }
}
```

### 2.4 Get Case Detail

```http
GET /cases/{case_id}
```

**Auth Required:** Conditional
- Public: Basic info only
- Owner/Finder: Full own case
- Moderator: Full detail

**Response (200) — Owner/Moderator View:**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "uuid",
      "type": "missing",
      "case_reference": "GRN-2026-0042",
      "status": "ACTIVE",
      "pet_name": "Buddy",
      "species": "DOG",
      "breed": "Golden Retriever",
      "color_primary": "Golden",
      "color_secondary": null,
      "distinguishing_features": "White patch on chest, limps slightly on right front leg",
      "weight_lbs": 65.5,
      "age_years": 4.5,
      "sex": "male",
      "is_neutered": true,
      "microchip_id": "985121054321234",
      "photo_urls": ["https://storage.proveniq.com/pets/uploads/abc123.jpg"],
      "last_seen_at": "2026-01-04T14:30:00-05:00",
      "last_seen_lat": 37.8018,
      "last_seen_lng": -80.4456,
      "last_seen_address": "123 Main St, Lewisburg, WV 24901",
      "last_seen_notes": "Got out through back gate. Wearing blue collar with tags.",
      "county": "GREENBRIER",
      "owner": {
        "id": "uuid",
        "display_name": "John D.",
        "contact_released": false
      },
      "sightings_count": 3,
      "assigned_moderator_id": "uuid",
      "created_at": "2026-01-05T05:48:46Z",
      "updated_at": "2026-01-05T10:00:00Z"
    },
    "recent_sightings": [
      {
        "id": "uuid",
        "sighting_at": "2026-01-05T09:45:00Z",
        "sighting_area": "Near Walmart parking lot",
        "confidence_level": "LIKELY",
        "is_verified": false
      }
    ]
  }
}
```

---

## 3. SIGHTING ENDPOINTS

### 3.1 Report Sighting

```http
POST /sightings
```

**Auth Required:** Optional (anonymous allowed for PUBLIC_USER)

**Headers:**
```http
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "missing_case_id": "uuid",
  "sighting_at": "2026-01-05T09:45:00-05:00",
  "sighting_lat": 37.8050,
  "sighting_lng": -80.4500,
  "sighting_address": "Walmart parking lot, Lewisburg",
  "description": "Saw a dog matching the description near the shopping carts",
  "direction_heading": "Heading towards the highway",
  "animal_behavior": "scared",
  "confidence_level": "LIKELY",
  "photo_url": null,
  "reporter_name": "Jane Smith",
  "reporter_phone": "+13045551111",
  "county": "GREENBRIER"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "sighting": {
      "id": "uuid",
      "missing_case_id": "uuid",
      "sighting_at": "2026-01-05T09:45:00-05:00",
      "confidence_level": "LIKELY",
      "is_verified": false,
      "created_at": "2026-01-05T14:45:00Z"
    },
    "ai_advisory": "Approximate area based on reported sightings. Actual location unknown."
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T14:45:00Z",
    "pilot_metric_logged": true
  }
}
```

### 3.2 List Sightings for Case

```http
GET /cases/{case_id}/sightings
```

**Auth Required:** No

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sightings": [
      {
        "id": "uuid",
        "sighting_at": "2026-01-05T09:45:00-05:00",
        "sighting_area": "Walmart parking lot",
        "description": "Saw a dog matching the description near the shopping carts",
        "direction_heading": "Heading towards the highway",
        "animal_behavior": "scared",
        "confidence_level": "LIKELY",
        "is_verified": false,
        "has_photo": false,
        "created_at": "2026-01-05T14:45:00Z"
      }
    ],
    "ai_cluster_summary": {
      "advisory": "AI advisory only. Not a guarantee of accuracy or outcome.",
      "hot_zones": [
        {
          "area_name": "Downtown/Walmart area",
          "sighting_count": 3,
          "last_sighting_at": "2026-01-05T09:45:00-05:00",
          "confidence": "MEDIUM"
        }
      ]
    }
  }
}
```

---

## 4. EMERGENCY NOTIFICATION ENDPOINTS

### 4.1 Notify Emergency Vet

```http
POST /notifications/emergency-vet
```

**Auth Required:** Yes (OWNER, FINDER, PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "contact_id": "uuid",
  "case_id": "uuid",
  "case_type": "found",
  "emergency_summary": "Found injured dog, appears to have been hit by car. Bleeding from right hind leg. Currently at 123 Oak St, Lewisburg.",
  "callback_number": "+13045551234"
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "contact": {
      "id": "uuid",
      "name": "Greenbrier Valley Animal Hospital",
      "phone": "+13045551234"
    },
    "channels": {
      "email": {
        "status": "QUEUED",
        "estimated_delivery": "< 30 seconds"
      },
      "voice": {
        "status": "QUEUED",
        "estimated_call_time": "< 60 seconds"
      }
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T15:00:00Z",
    "pilot_metric_logged": true
  }
}
```

### 4.2 Get Emergency Notification Status

```http
GET /notifications/emergency-vet/{attempt_id}
```

**Auth Required:** Yes (initiator or moderator)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "contact": {
      "id": "uuid",
      "name": "Greenbrier Valley Animal Hospital"
    },
    "email_attempt": {
      "status": "DELIVERED",
      "provider_id": "resend_msg_abc123",
      "sent_at": "2026-01-05T15:00:05Z"
    },
    "voice_attempt": {
      "status": "DELIVERED",
      "provider_id": "twilio_CA_xyz789",
      "initiated_at": "2026-01-05T15:00:10Z",
      "duration_seconds": 45,
      "answered": true
    },
    "created_at": "2026-01-05T15:00:00Z"
  }
}
```

---

## 5. MUNICIPAL INTERACTION ENDPOINTS

### 5.1 Get Call Script

```http
GET /municipal/call-script
```

**Query Parameters:**
- `county` (required): `GREENBRIER` | `KANAWHA`
- `case_id` (optional): Pre-fill case details
- `case_type` (optional): `missing` | `found`

**Auth Required:** No

**Response (200):**

```json
{
  "success": true,
  "data": {
    "agency": {
      "name": "Greenbrier County Animal Control",
      "phone": "+13045555678",
      "availability_note": "Office hours: Mon-Fri 8am-5pm"
    },
    "script": {
      "version": "1.2",
      "greeting": "Hello, I'm calling to request assistance with a missing pet.",
      "legal_framing": "County ordinance indicates officers should respond; I'm requesting assistance.",
      "case_details": "I'm looking for a golden retriever named Buddy, last seen near 123 Main St in Lewisburg around 2:30pm yesterday. The case reference number is GRN-2026-0042.",
      "closing": "May I have your name and a reference number for this call? Thank you for your assistance.",
      "prohibited_phrases": [
        "You are required to respond",
        "I'm filing a formal complaint",
        "This is being recorded for public record"
      ],
      "allowed_outcomes": [
        "OFFICER_DISPATCHED",
        "CALLBACK_PROMISED",
        "NO_ANSWER",
        "REFERRED_ELSEWHERE",
        "DECLINED",
        "UNKNOWN"
      ]
    },
    "override": {
      "active": true,
      "type": "REDUCED_HOURS",
      "alternate_phone": "+13045559999",
      "message": "Due to staff shortage, please call alternate number after 3pm."
    }
  }
}
```

### 5.2 Log Municipal Call Outcome

```http
POST /municipal/call-log
```

**Auth Required:** Yes (OWNER, FINDER, PIGPIG_MODERATOR, SHELTER_MODERATOR)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "case_id": "uuid",
  "case_type": "missing",
  "contact_id": "uuid",
  "dialer_initiated_at": "2026-01-05T15:30:00-05:00",
  "call_duration_seconds": 180,
  "outcome": "CALLBACK_PROMISED",
  "outcome_notes": "Spoke with dispatcher. Officer will call back within 2 hours.",
  "county": "GREENBRIER"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "log_id": "uuid",
    "contact_name": "Greenbrier County Animal Control",
    "outcome": "CALLBACK_PROMISED",
    "email_notify_sent": false,
    "created_at": "2026-01-05T20:31:00Z"
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T20:31:00Z",
    "pilot_metric_logged": true,
    "agency_opt_in_note": "Agency has not opted in to email notifications."
  }
}
```

---

## 6. MODERATOR ENDPOINTS

### 6.1 Get Pending Match Suggestions

```http
GET /moderator/match-suggestions
```

**Auth Required:** Yes (PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Query Parameters:**
- `county` (optional): Filter by county
- `min_confidence` (optional): Minimum confidence score (0.0-1.0)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "match_id": "uuid",
        "confidence_score": 0.847,
        "scoring_factors": {
          "species_match": true,
          "breed_similarity": 0.9,
          "color_match": 0.85,
          "size_match": 0.8,
          "location_proximity_km": 1.2,
          "time_gap_hours": 18,
          "distinguishing_features_match": 0.75
        },
        "missing_case": {
          "id": "uuid",
          "case_reference": "GRN-2026-0042",
          "pet_name": "Buddy",
          "species": "DOG",
          "breed": "Golden Retriever",
          "last_seen_at": "2026-01-04T14:30:00-05:00",
          "photo_url": "https://..."
        },
        "found_case": {
          "id": "uuid",
          "case_reference": "GRN-F-2026-0018",
          "species": "DOG",
          "breed_guess": "Golden Retriever mix",
          "found_at": "2026-01-05T08:15:00-05:00",
          "photo_url": "https://..."
        },
        "created_at": "2026-01-05T13:15:00Z",
        "ai_advisory": "AI-suggested match. Moderator verification required."
      }
    ],
    "count": 5
  }
}
```

### 6.2 Resolve Match Suggestion

```http
POST /moderator/match-suggestions/{match_id}/resolve
```

**Auth Required:** Yes (PIGPIG_MODERATOR, SHELTER_MODERATOR)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body:**

```json
{
  "resolution": "CONFIRMED",
  "notes": "Microchip confirmed match. Notifying owner."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "resolution": "CONFIRMED",
    "resolved_by": "uuid",
    "resolved_at": "2026-01-05T21:00:00Z",
    "missing_case_status": "MATCHED",
    "found_case_status": "MATCHED",
    "next_step": "Contact owner to arrange reunion."
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T21:00:00Z",
    "pilot_metric_logged": true
  }
}
```

### 6.3 Record Moderator Action

```http
POST /moderator/actions
```

**Auth Required:** Yes (PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Headers:**
```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
```

**Request Body Examples:**

**Lock Case:**
```json
{
  "action_type": "LOCK_CASE",
  "case_id": "uuid",
  "case_type": "missing",
  "notes": "Duplicate case. Merging with GRN-2026-0039."
}
```

**Release Contact:**
```json
{
  "action_type": "RELEASE_CONTACT",
  "case_id": "uuid",
  "case_type": "missing",
  "target_user_id": "uuid",
  "consent_method": "OWNER_OPT_IN",
  "notes": "Owner approved contact release via app."
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "action_id": "uuid",
    "action_type": "LOCK_CASE",
    "created_at": "2026-01-05T21:15:00Z"
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T21:15:00Z"
  }
}
```

---

## 7. OFFLINE SYNC ENDPOINTS

### 7.1 Submit Queued Actions (Batch)

```http
POST /sync/queue
```

**Auth Required:** Yes

**Headers:**
```http
Authorization: Bearer <jwt>
```

**Request Body:**

```json
{
  "device_id": "device_uuid",
  "actions": [
    {
      "idempotency_key": "uuid-1",
      "action_type": "CREATE_SIGHTING",
      "payload": {
        "missing_case_id": "uuid",
        "sighting_at": "2026-01-05T09:00:00-05:00",
        "sighting_lat": 37.8040,
        "sighting_lng": -80.4480,
        "description": "Saw dog near park",
        "confidence_level": "UNSURE",
        "county": "GREENBRIER"
      },
      "created_at": "2026-01-05T09:01:00-05:00"
    },
    {
      "idempotency_key": "uuid-2",
      "action_type": "CREATE_SIGHTING",
      "payload": {
        "missing_case_id": "uuid",
        "sighting_at": "2026-01-05T09:30:00-05:00",
        "sighting_lat": 37.8055,
        "sighting_lng": -80.4490,
        "description": "Same dog, heading east",
        "confidence_level": "LIKELY",
        "county": "GREENBRIER"
      },
      "created_at": "2026-01-05T09:31:00-05:00"
    }
  ]
}
```

**Response (207 Multi-Status):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "idempotency_key": "uuid-1",
        "status": "SYNCED",
        "resolved_entity_id": "uuid-sighting-1",
        "created": true
      },
      {
        "idempotency_key": "uuid-2",
        "status": "SYNCED",
        "resolved_entity_id": "uuid-sighting-2",
        "created": true
      }
    ],
    "synced_count": 2,
    "failed_count": 0,
    "conflict_count": 0
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-05T21:30:00Z"
  }
}
```

### 7.2 Get Sync Status

```http
GET /sync/status
```

**Auth Required:** Yes

**Query Parameters:**
- `device_id` (optional): Filter by device
- `since` (optional): ISO timestamp

**Response (200):**

```json
{
  "success": true,
  "data": {
    "pending_count": 0,
    "last_sync_at": "2026-01-05T21:30:00Z",
    "pending_actions": []
  }
}
```

---

## 8. PILOT METRICS ENDPOINTS (Admin Only)

### 8.1 Get Pilot Metrics Summary

```http
GET /admin/metrics/summary
```

**Auth Required:** Yes (PIGPIG_MODERATOR, SHELTER_MODERATOR, SYSTEM_ADMIN)

**Query Parameters:**
- `county` (optional): Filter by county
- `start_date` (optional): ISO date
- `end_date` (optional): ISO date

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-01-05"
    },
    "totals": {
      "missing_cases_created": 42,
      "found_cases_created": 18,
      "sightings_reported": 87,
      "er_vet_notifications": 12,
      "municipal_calls_logged": 28,
      "matches_confirmed": 8,
      "matches_rejected": 15,
      "cases_closed": 14
    },
    "outcomes": {
      "reunited": 7,
      "adopted": 3,
      "deceased": 1,
      "expired": 3
    },
    "by_county": {
      "GREENBRIER": {
        "missing_cases_created": 28,
        "found_cases_created": 12,
        "reunited": 5
      },
      "KANAWHA": {
        "missing_cases_created": 14,
        "found_cases_created": 6,
        "reunited": 2
      }
    },
    "municipal_outcomes": {
      "OFFICER_DISPATCHED": 8,
      "CALLBACK_PROMISED": 10,
      "NO_ANSWER": 5,
      "REFERRED_ELSEWHERE": 3,
      "DECLINED": 1,
      "UNKNOWN": 1
    },
    "disclaimer": "Internal pilot metrics. Not for public release without counsel review."
  }
}
```

---

## 9. WEBHOOK CONTRACTS (Outbound)

### 9.1 Shelter Intake Webhook (Opt-In)

For shelters that have opted in to receive automated intake notifications.

**Endpoint:** Configured per shelter  
**Method:** POST  
**Headers:**
```http
Content-Type: application/json
X-Proveniq-Signature: sha256=<hmac_signature>
X-Proveniq-Timestamp: <unix_timestamp>
```

**Payload:**

```json
{
  "event": "FOUND_ANIMAL_CASE_CREATED",
  "timestamp": "2026-01-05T13:15:00Z",
  "case": {
    "id": "uuid",
    "case_reference": "GRN-F-2026-0018",
    "species": "DOG",
    "breed_guess": "Golden Retriever mix",
    "condition_notes": "Appears healthy but hungry. Friendly.",
    "needs_immediate_vet": false,
    "found_at": "2026-01-05T08:15:00-05:00",
    "found_address": "Near corner of Oak St and Maple Ave, Lewisburg",
    "current_location_type": "WITH_FINDER",
    "photo_url": "https://storage.proveniq.com/pets/uploads/def456.jpg",
    "county": "GREENBRIER"
  },
  "match_suggestions": {
    "count": 1,
    "highest_confidence": 0.847,
    "advisory": "AI-suggested match. Moderator verification required."
  }
}
```

---

## 10. RATE LIMITS

| Endpoint Category | Unauthenticated | Authenticated | Moderator |
|-------------------|-----------------|---------------|-----------|
| Read (GET) | 60/min | 120/min | 300/min |
| Write (POST/PUT) | 10/min | 30/min | 100/min |
| Notifications | N/A | 5/min | 20/min |
| Sync (batch) | N/A | 10/min | 30/min |

Exceeded limits return:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retry_after_seconds": 60
  }
}
```

---

**END OF API CONTRACTS v1.0.0**
