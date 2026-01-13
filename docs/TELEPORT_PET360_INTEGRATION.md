# Pet911 ↔ Pet360 Teleport Integration

## Overview

Pet360 shelters can integrate Pet911 emergency response data directly into their existing dashboard via the Teleport API. This eliminates the need for separate logins while maintaining the standalone Partner Portal for rescues, fosters, and transport networks.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│     Pet360      │ ←─────→ │    Teleport     │ ←─────→ │     Pet911      │
│  (Shelter OS)   │   API   │   (API Layer)   │         │ (Emergency Sys) │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                                    ↓
                            ┌─────────────────┐
                            │                 │
                            │     LifeLog     │
                            │ (Immutable Log) │
                            │                 │
                            └─────────────────┘
```

## Authentication

All requests require Teleport authentication headers:

```http
X-Teleport-Org-ID: org_abc123
X-Teleport-API-Key: tpk_live_xxx
X-Teleport-Source: PET360
```

API keys are issued during partner onboarding and can be rotated via the admin console.

## Endpoints

### GET /api/teleport/v1/pet911/alerts

Fetch active alerts for your service area.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | ACTIVE | Filter: ACTIVE, ACKNOWLEDGED, ALL |
| since | ISO8601 | 24h ago | Alerts created after this time |
| limit | number | 50 | Max results (cap: 100) |

**Response:**
```json
{
  "organization_id": "org_abc123",
  "alerts": [
    {
      "alert_id": "ALT-2026-0001",
      "tier": "TIER_2_URGENT",
      "code": "CHARLIE",
      "urgency": "URGENT",
      "animal": {
        "species": "CAT",
        "description": "Orange tabby, appears injured",
        "condition": "INJURED_STABLE"
      },
      "location": {
        "county": "GREENBRIER",
        "city": "Lewisburg",
        "approximate_area": "Downtown Lewisburg"
      },
      "status": "ACTIVE",
      "actions": {
        "can_acknowledge": true,
        "acknowledge_url": "/api/teleport/v1/pet911/alerts/ALT-2026-0001/acknowledge"
      }
    }
  ]
}
```

**Privacy Note:** Exact address and reporter contact are withheld until alert is acknowledged.

---

### POST /api/teleport/v1/pet911/alerts/:id/acknowledge

Acknowledge an alert and receive full details for pickup.

**Response:**
```json
{
  "alert_id": "ALT-2026-0001",
  "acknowledged_at": "2026-01-12T21:00:00Z",
  "reporter": {
    "name": "Jane Doe",
    "phone": "(304) 555-1234",
    "can_hold_animal": true,
    "available_until": "2026-01-12T23:00:00Z"
  },
  "location_exact": {
    "address": "123 Main St, Lewisburg, WV 24901",
    "instructions": "Behind the blue dumpster"
  }
}
```

---

### POST /api/teleport/v1/pet911/intake

Log animal intake after pickup.

**Request:**
```json
{
  "alert_id": "ALT-2026-0001",
  "organization_id": "org_abc123",
  "animal": {
    "species": "CAT",
    "description": "Orange tabby male",
    "microchip_id": "985141404123456",
    "microchip_scanned": true
  },
  "intake": {
    "received_at": "2026-01-12T21:30:00Z",
    "received_by": "Staff: Mike Johnson",
    "source": "PET911_ALERT",
    "condition_on_arrival": "Limping, otherwise stable"
  },
  "disposition": {
    "stray_hold_days": 5,
    "placement_type": "SHELTER"
  }
}
```

**Response:**
```json
{
  "success": true,
  "intake_id": "INT-1705093800000",
  "lifelog_event_id": "LL-1705093800000",
  "next_steps": {
    "stray_hold_expires": "2026-01-17T21:30:00Z",
    "reunification_url": "/api/teleport/v1/pet911/reunification"
  }
}
```

---

### POST /api/teleport/v1/pet911/reunification

Log successful reunification with owner.

**Request:**
```json
{
  "alert_id": "ALT-2026-0001",
  "pet911_case_id": "CASE-2026-0001",
  "organization_id": "org_abc123",
  "reunification": {
    "reunited_at": "2026-01-14T14:00:00Z",
    "method": "MICROCHIP",
    "verified_by": "Staff: Jane Smith",
    "owner_verified": true,
    "proof_of_ownership": "Vet records + photo ID"
  },
  "outcome": {
    "type": "REUNITED",
    "days_in_care": 2
  }
}
```

---

### GET /api/teleport/v1/pet911/metrics

Fetch performance metrics for dashboard widget.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | MONTH | DAY, WEEK, MONTH, YEAR |

**Response:**
```json
{
  "metrics": {
    "alerts": {
      "received": 24,
      "acknowledged": 22,
      "avg_response_minutes": 138
    },
    "outcomes": {
      "total_intake": 18,
      "reunifications": 12,
      "reunification_rate": 0.67
    },
    "comparison": {
      "county_avg_reunification_rate": 0.42,
      "state_avg_reunification_rate": 0.38
    }
  }
}
```

---

## Webhooks

Pet360 can subscribe to real-time events:

| Event | Description |
|-------|-------------|
| `ALERT_NEW` | New alert in service area |
| `ALERT_ESCALATED` | Alert upgraded to Tier 1 |
| `ALERT_EXPIRED` | Alert expired without action |
| `CASE_REUNITED` | Successful reunification |

**Webhook Payload:**
```json
{
  "type": "ALERT_NEW",
  "timestamp": "2026-01-12T21:00:00Z",
  "payload": { ... }
}
```

---

## Pet360 Widget Integration

Embed Pet911 data in Pet360 dashboard:

```jsx
// Pet360 Dashboard Component
import { usePet911Alerts, usePet911Metrics } from '@pet360/teleport-client';

function Pet911Widget() {
  const { alerts, acknowledge } = usePet911Alerts();
  const { metrics } = usePet911Metrics('MONTH');

  return (
    <div className="pet911-widget">
      <h3>🚨 Pet911 Alerts ({alerts.length})</h3>
      {alerts.map(alert => (
        <AlertCard 
          key={alert.alert_id} 
          alert={alert}
          onAcknowledge={() => acknowledge(alert.alert_id)}
        />
      ))}
      <MetricsSummary metrics={metrics} />
    </div>
  );
}
```

---

## Data Flow

```
1. Stray reported via Pet911 app
   ↓
2. Moderator triages → Alert broadcast to service area
   ↓
3. Pet360 receives webhook OR polls /alerts endpoint
   ↓
4. Shelter acknowledges → Gets reporter contact
   ↓
5. Animal picked up → Shelter logs intake via /intake
   ↓
6. LifeLog event created (immutable)
   ↓
7. Owner found → Shelter logs via /reunification
   ↓
8. Metrics updated → Impact dashboard reflects outcome
```

---

## Partner Portal (Standalone)

Organizations NOT using Pet360 can use the standalone Partner Portal at:

```
https://pet911.proveniq.io/partner/dashboard
```

This is recommended for:
- Rescue organizations
- Foster networks
- Transport coordinators
- Veterinary clinics (limited intake)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /alerts | 60/min |
| POST /acknowledge | 30/min |
| POST /intake | 30/min |
| GET /metrics | 10/min |

---

## Support

Integration support: `integrations@proveniq.io`
API status: `status.proveniq.io`
