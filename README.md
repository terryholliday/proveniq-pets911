# PetNexus Pet911 - Pilot PWA

Emergency coordination for lost and found pets in West Virginia. Offline-first PWA with moderator console.

## Features

- **Emergency Finder Assist** (`/emergency`) - Triage found animals and get routing to ER vets or ACO
- **Moderator Console** (`/admin/pigpig`) - Case triage, match review, escalation tools
- **Sighting Intelligence** - AI-assisted sighting clustering with guardrails
- **Offline-First** - County pack caching, offline queue with idempotency

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Auth**: Firebase Auth (stub)
- **Database**: Supabase/Postgres (stub)
- **Offline Storage**: IndexedDB via `idb`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

See `.env.example` for required configuration:

- Firebase Auth credentials
- Supabase URL and keys
- Twilio/Resend API keys (for notifications)

## Architecture

### Offline-First Design

Per `OFFLINE_PROTOCOL.md`:

1. **County Pack Cache** - ER vets, ACO contacts, call scripts cached in IndexedDB
2. **Offline Queue** - POST actions queued with idempotency keys, synced on reconnect
3. **Network Detection** - ONLINE/DEGRADED/OFFLINE states with visual indicators

### Key Components

```
src/
├── app/
│   ├── emergency/      # Emergency Finder Assist
│   ├── admin/pigpig/   # Moderator Console
│   └── api/            # API route stubs
├── lib/
│   ├── db/             # IndexedDB stores
│   ├── hooks/          # React hooks for offline features
│   └── sync/           # Sync worker
└── components/
    ├── emergency/      # Triage and routing components
    ├── moderator/      # Match review, triage list
    └── offline/        # Network status, queue display
```

## Canonical Law Compliance

This implementation follows:

- **CANONICAL_LAW.md** - Match privacy, notification logging, AI boundaries
- **API_CONTRACTS.md** - Endpoint specifications, idempotency requirements
- **OFFLINE_PROTOCOL.md** - Caching tiers, sync lifecycle
- **AI_GUARDRAILS.md** - Disclosure requirements, prohibited behaviors
- **RETENTION_ACCESS.md** - Role-based access, PII handling

### Key Invariants

1. **Match suggestions visible ONLY to moderators** until confirmed
2. **No "false hope" copy** - Clinical language only
3. **SMS opt-in only** - Default to in-app notifications
4. **Municipal accountability is INTERNAL** - No public scoreboard

## Compliance & Testing

### Compliance Documents

- [Pet911 Alert Compliance](docs/pets/PET911_ALERT_COMPLIANCE.md) – E2E determinism, auditability, fail-closed
- [Offline Sync Compliance](docs/pets/OFFLINE_SYNC_COMPLIANCE.md) – FIFO, idempotency, retry, dependencies
- [Canonical Law](docs/pets/CANONICAL_LAW.md) – Governance and fail-closed rules
- [Offline Protocol](docs/pets/OFFLINE_PROTOCOL.md) – Caching tiers, sync lifecycle

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:pet911-alert-compliance
npm run test:sync-worker-e2e
npm test -- --testPathPattern=offline-queue
npm test -- --testPathPattern=county-pack
npm test -- --testPathPattern=moderator-gating
```

### E2E (Playwright)

```bash
# One-time browser install
npm run e2e:install

# Run E2E smoke suite
npm run e2e
```

## Pilot Counties

- Greenbrier & Kanawha Counties
## API Stubs

Backend endpoints are stubbed with fail-closed behavior (503 responses) per task requirements. 
Connect to actual Supabase/Firebase backend by implementing the TODO comments in:

- `src/app/api/county-packs/route.ts`
- `src/app/api/notifications/emergency-vet/route.ts`
- `src/app/api/municipal/call-log/route.ts`
- `src/app/api/moderator/match-suggestions/route.ts`
- `src/app/api/sync/queue/route.ts`

## License

Proprietary - PROVENIQ Charitable Trust
