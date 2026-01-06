# PROVENIQ Pet 911 — Pilot Program Briefing
## For: Greenbrier Humane Society Leadership

**Prepared by:** PROVENIQ Foundation  
**Date:** January 2026  
**Pilot Region:** West Virginia (Greenbrier County, Kanawha County)

---

## Executive Summary

PROVENIQ Pet 911 is a **free, offline-first emergency coordination system** for lost and found pets, designed specifically for rural communities like Greenbrier County where cellular coverage is unreliable. The system is operated by PROVENIQ Foundation, a West Virginia nonprofit (501(c)(3) status pending).

**Our Mission:** Reduce preventable pet deaths and permanent family separations through deterministic, audit-safe emergency coordination infrastructure.

**Why Greenbrier County?** Your county is one of two pilot regions selected for initial deployment. The rural terrain, variable cellular coverage, and strong community ties make it an ideal proving ground for a system designed to work when other solutions fail.

---

## What PROVENIQ Pet 911 Does

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Emergency Finder Assist** | When someone finds an injured or distressed animal, the app provides immediate triage guidance, emergency vet contacts, and Animal Control Officer (ACO) routing |
| **Missing Pet Reports** | Pet owners can file detailed reports including photos, last seen location, distinguishing features, and microchip information |
| **Found Animal Reports** | Finders can document found animals with photos, condition notes, and location data |
| **Sighting Intelligence** | Community members can report sightings that are clustered and analyzed to identify search areas |
| **AI-Assisted Matching** | The system suggests potential matches between found animals and missing pet reports for moderator review |
| **Municipal Interaction Logging** | When users call Animal Control, the app provides on-screen scripts and logs outcomes (for internal metrics only) |
| **Emergency Vet Notification** | One-tap notification to emergency veterinary clinics via email and voice call (for after-hours landlines) |

### Offline-First Design

**Critical for Greenbrier County:** The app is designed to function in dead zones.

- **County Pack Caching** — Emergency contacts, call scripts, and ACO information are cached locally
- **Offline Queue** — Reports and sightings can be created offline and sync when connectivity returns
- **No Data Loss** — All offline actions are preserved with idempotency protection (no duplicates on sync)

---

## What PROVENIQ Pet 911 Does NOT Do

We believe transparency about limitations is as important as capabilities.

| What We Don't Do | Why |
|------------------|-----|
| **Guarantee reunification** | We improve likelihood and speed, but cannot ensure outcomes |
| **Provide medical advice** | We direct users to veterinary professionals; AI never diagnoses or prescribes |
| **Auto-release contact info** | Owner contact is NEVER automatically shared with finders; requires moderator verification |
| **Scrape or post to Facebook** | No social media integration; no legal exposure for you |
| **Create public "shame" dashboards** | Municipal metrics are internal only; no public scoreboard of agency performance |
| **Make legal conclusions** | Logs are operational audit trails, not formal public records or liability evidence |
| **Claim certainty** | All AI outputs include disclosures; we never say "Your pet HAS been found" |
| **Send unsolicited SMS** | SMS is opt-in only; default notifications are in-app and push |

---

## How The System Works

### User Roles

| Role | Who | What They Can Do |
|------|-----|------------------|
| **Public User** | Any community member | Browse public cases, report sightings |
| **Owner** | Pet parent who files missing report | Create missing pet case, receive notifications, trigger ER vet notify |
| **Finder** | Person who finds an animal | Create found animal case, log municipal calls |
| **Shelter Moderator** | Humane Society staff | Intake found animals, confirm matches, release contact info within scope |
| **PigPig Moderator** | Central PROVENIQ team | Cross-county triage, case escalation, match confirmation, case locking |
| **System Admin** | Technical operations | Database access, no case adjudication authority |

### Match Workflow (Privacy-Protected)

```
1. Finder reports found animal → Creates Found Animal Case
2. Owner reports missing pet → Creates Missing Pet Case
3. AI suggests potential match → ONLY visible to moderators
4. Moderator reviews match → Confirms or rejects
5. If confirmed:
   - Owner is notified (not finder contact info)
   - Moderator contacts owner for consent
   - If owner opts in → Contact released to finder
   - If owner declines → Moderator facilitates reunion (no direct exchange)
```

**Key Privacy Protection:** Finders NEVER automatically receive owner contact information. Every contact release is logged with moderator ID, timestamp, and consent method.

---

## Role of Greenbrier Humane Society in Pilot

### What We're Asking

1. **Shelter Moderator Access** — Staff members would have moderator-level access to:
   - View found animal cases in Greenbrier County
   - Intake found animals into the system
   - Confirm or reject match suggestions
   - Release contact information (with logged consent)

2. **County Pack Data** — Provide/verify emergency contact information:
   - Emergency vet clinics in Greenbrier County
   - Your shelter contact information
   - After-hours protocols

3. **Feedback Loop** — During pilot:
   - Report any system issues or UX friction
   - Suggest workflow improvements
   - Share reunification success stories (for metrics)

### What We Provide

| Resource | Details |
|----------|---------|
| **Free access** | No cost to shelter or community members |
| **Training** | Onboarding for staff on moderator console |
| **Technical support** | Direct line to PROVENIQ team during pilot |
| **Co-branded materials** | Flyers, signage for shelter visitors |
| **Metrics reporting** | Anonymized pilot data on cases, outcomes, usage |

---

## Data Privacy & Security

### What Data Is Collected

| Data Type | Purpose | Who Sees It |
|-----------|---------|-------------|
| Pet descriptions | Matching and search | Public (non-PII only) |
| Photos | Identification | Public |
| Owner contact info | Reunification | Moderators only (gated release) |
| Location data | Search coordination | Owners see exact; public sees area only |
| Municipal call logs | Internal metrics | Moderators, Admins (never public) |

### What We DON'T Do With Data

- ❌ **Never sell data** — Registry data is not sold to anyone
- ❌ **Never share with sponsors** — Partners do not receive personal records
- ❌ **Never monetize** — The Foundation is a nonprofit; this is charitable work

### Data Retention

| Data | Retention |
|------|-----------|
| Active cases | Indefinite while open |
| Closed cases (reunited) | 90 days after closure |
| Pilot metrics | 365 days (anonymized) |
| User profiles | Until account deletion requested |

### Compliance

- GDPR-style export and deletion rights
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Row-level security in database
- Audit logging for all PII access

---

## AI Guardrails

We use AI responsibly with strict boundaries.

### What AI Does

| Function | Example |
|----------|---------|
| **Summarize** | "5 sightings reported in downtown area" |
| **Cluster** | Group sightings by location and time |
| **Rank** | Prioritize cases by urgency factors |
| **Match** | Suggest found→missing connections with confidence score |

### What AI Never Does

| Prohibition | Example of What We Block |
|-------------|-------------------------|
| Claim certainty | "Your pet HAS been found!" → BLOCKED |
| Medical advice | "Give the dog aspirin" → BLOCKED |
| Legal conclusions | "The county is liable" → BLOCKED |
| False hope | "Don't give up hope!" → BLOCKED |
| Blame attribution | "Officer X failed to respond" → BLOCKED |

### Required Disclosures

Every AI output visible to users includes a disclosure:
- Match suggestions: *"AI-suggested match. Moderator verification required."*
- Sighting clusters: *"Approximate area based on reported sightings. Actual location unknown."*
- Any AI text: *"AI advisory only. Not a guarantee of accuracy or outcome."*

---

## Homeward Bound Rewards™ Program

Operated by PROVENIQ Foundation to encourage microchip registration.

### How It Works

- **Free to participate** — No purchase or donation required
- **Earn entries** through protective actions:
  - Register a microchip
  - Complete annual scan confirmation
  - Reunification event
- **Prizes** — Non-cash, pet-related (supplies, gift cards capped at $250)
- **Not a lottery** — Structured as compliant sweepstakes with Official Rules

### Designed To

- Increase microchip registration coverage
- Normalize periodic scan confirmations
- Improve reunification outcomes
- Generate public-benefit data

### Not Designed To

- ❌ Monetize participant data
- ❌ Create pay-to-play dynamics
- ❌ Offer cash prizes

---

## Organizational Structure

### PROVENIQ Foundation
- **Status:** West Virginia nonprofit corporation (501(c)(3) pending)
- **Role:** Operates charitable programs including Pet 911
- **Does NOT own:** The underlying software

### PROVENIQ Charitable Trust (Wyoming)
- **Role:** Owns all proprietary technology
- **Licenses to Foundation:** For charitable and educational purposes only
- **Purpose:** Protects mission integrity; prevents commercialization

**Why This Matters:** The separation ensures that the technology cannot be sold or commercialized. It exists solely for charitable benefit.

---

## Pilot Metrics We Track

All metrics are for internal use and program improvement. No public "scoreboard."

| Metric | Purpose |
|--------|---------|
| Cases created (missing/found) | Volume and adoption |
| Sightings reported | Community engagement |
| Match confirmation rate | AI accuracy |
| Time to reunification | Program effectiveness |
| Municipal call outcomes | Resource allocation (internal) |
| Offline usage | Rural functionality validation |

---

## What Success Looks Like

### For the Pilot

- Functional offline mode validated in Greenbrier dead zones
- Shelter moderators successfully using the console
- At least one reunification facilitated through the system
- Community awareness in pilot region
- Feedback loop established for iteration

### For Greenbrier Humane Society

- Streamlined intake process for found animals
- Reduced phone tag for owner reunification
- Audit trail for all actions (liability protection)
- Data on local lost/found patterns
- Zero cost to participate

---

## Frequently Asked Questions

**Q: Does this replace our existing processes?**  
A: No. This supplements and streamlines. You retain full control over your operations.

**Q: What if the system is down?**  
A: Offline-first design means core functionality works without internet. For server issues, standard shelter protocols continue.

**Q: Who pays for this?**  
A: PROVENIQ Foundation. There is no cost to shelters or users.

**Q: What about liability?**  
A: The system creates operational audit logs, not formal records. All match releases are logged with consent. You're protected by documented process.

**Q: Can we see the municipal accountability data?**  
A: Internal metrics only. We never publicly shame agencies. Data is aggregated and anonymized.

**Q: What happens after the pilot?**  
A: If successful, we expand to additional WV counties. Greenbrier would remain a supported region.

---

## Next Steps

1. **Schedule demo** — 30-minute walkthrough of the system
2. **Identify staff moderators** — Who will have access?
3. **Verify county data** — Confirm emergency contacts, hours, protocols
4. **Soft launch** — Limited rollout with feedback collection
5. **Community announcement** — Co-branded launch communication

---

## Contact

**PROVENIQ Foundation**  
Founder: Terry  
Email: [To be provided]  
Website: proveniqfoundation.org

---

## Appendix: Key Terms

| Term | Definition |
|------|------------|
| **PigPig** | Central moderator organization for the pilot |
| **County Pack** | Offline-cacheable data bundle per county |
| **ACO** | Animal Control Officer |
| **Match Suggestion** | AI-generated potential match (moderator-only visibility) |
| **Idempotency** | Technical guarantee that offline actions won't duplicate |
| **PWA** | Progressive Web App (works like an app but runs in browser) |

---

*This document is current as of January 2026. Program details may evolve during pilot.*
