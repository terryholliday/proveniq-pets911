# PROVENIQ PETS (WV) — AI GUARDRAILS

**Version:** 1.0.0  
**Status:** ACTIVE  
**Authoritative Reference:** CANONICAL_LAW.md  
**Invariant:** AI_NO_CERTAINTY

---

## 0. PURPOSE

This document defines the boundaries, disclosure requirements, and prohibited behaviors for all AI/ML components within the PROVENIQ Pets system. These guardrails protect users from false hope, ensure transparency about AI limitations, and prevent the system from overstepping into medical, legal, or factual certainty claims.

**Core Doctrine:** AI outputs are **advisory only**. They summarize, cluster, rank, and highlight uncertainty. They never claim certainty, provide medical advice, or make legal conclusions.

---

## 1. AI CAPABILITY BOUNDARIES

### 1.1 Permitted AI Functions

| Function | Description | Output Type |
|----------|-------------|-------------|
| **Summarize** | Aggregate user-reported data into readable summaries | Text |
| **Cluster** | Group similar sightings by location/time/description | Geospatial clusters |
| **Rank** | Prioritize cases/sightings by recency, proximity, confidence | Ordered list |
| **Match** | Suggest potential Found→Missing matches | Scored suggestions |
| **Highlight Uncertainty** | Explicitly communicate confidence bounds | Confidence scores + caveats |
| **Extract** | Parse structured data from user descriptions | Structured fields |

### 1.2 Prohibited AI Functions

| Function | Reason | Required Alternative |
|----------|--------|---------------------|
| **Claim certainty** | No AI output can be guaranteed | Always include confidence caveats |
| **Medical diagnosis** | Not a veterinary service | "Seek veterinary care" |
| **Medical treatment advice** | Liability, harm potential | "Contact a veterinarian" |
| **Legal conclusions** | Not qualified; defamation risk | "Consult appropriate authorities" |
| **Promise outcomes** | False hope is harmful | "We're working to help" |
| **Identify individuals** | Privacy violation | No facial recognition on humans |
| **Predict survival** | Harmful speculation | No life/death predictions |
| **Assign blame** | Defamation risk | Neutral factual statements only |

### 1.3 Capability Boundary Enforcement

```
INVARIANT: AI_CAPABILITY_BOUNDARY
├─ All AI outputs pass through content filter
├─ Filter checks for:
│   ├─ Certainty language (100%, definitely, guaranteed)
│   ├─ Medical terminology (diagnose, treat, prescribe)
│   ├─ Legal conclusions (liable, negligent, required)
│   └─ Promise language (will find, will return)
├─ Flagged content is:
│   ├─ Blocked from display
│   ├─ Logged for review
│   └─ Replaced with safe alternative
└─ Filter failures halt AI pipeline (fail-closed)
```

---

## 2. MANDATORY DISCLOSURES

### 2.1 Disclosure Requirements by Context

Every AI-generated output visible to users MUST include an appropriate disclosure.

| Context | Required Disclosure Text |
|---------|-------------------------|
| Match suggestions (moderator view) | "AI-suggested match. Moderator verification required." |
| Match notification (after confirmation) | "A potential match has been reported. Awaiting verification." |
| Sighting clusters | "Approximate area based on reported sightings. Actual location unknown." |
| Sighting summaries | "Summary based on user-reported sightings. Accuracy not guaranteed." |
| Triage recommendations | "Priority suggestion only. Human moderator makes final decisions." |
| Search area suggestions | "Suggested search area based on patterns. Not a guarantee of pet location." |
| Any AI-generated text | "AI advisory only. Not a guarantee of accuracy or outcome." |

### 2.2 Disclosure Placement

```
┌─────────────────────────────────────────────────────────────────┐
│ [AI CONTENT BLOCK]                                              │
│                                                                 │
│ Based on 5 recent sightings, Buddy may be in the downtown      │
│ Lewisburg area, moving generally eastward.                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ℹ️ AI advisory only. Actual location unknown.               │ │
│ │    Based on unverified user reports.                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Placement Rules:**

| Content Type | Disclosure Location |
|--------------|---------------------|
| Short text (< 50 words) | Inline, immediately after |
| Long text (> 50 words) | Footer of content block |
| Lists/rankings | Header label + footer |
| Maps/visualizations | Permanent legend + tooltip |
| Notifications | Inline in notification body |

### 2.3 Disclosure Styling

Disclosures MUST be:
- Visually distinct (muted color, smaller text, different background)
- Always visible (no collapse/hide by default)
- Readable (minimum 12px font size, sufficient contrast)
- Non-removable by user

---

## 3. FALSE HOPE PROHIBITION

### 3.1 Prohibited Messaging Patterns

| Prohibited Pattern | Example | Required Alternative |
|--------------------|---------|---------------------|
| Certainty claims | "Your pet has been found!" | "A potential match has been reported. Awaiting verification." |
| Outcome promises | "We'll find your pet!" | "We're coordinating search efforts." |
| Timeline promises | "You'll hear back within 24 hours" | "Response times vary." |
| Success statistics | "90% of pets are found!" | Do not display success rates |
| Emotional manipulation | "Don't give up hope!" | Neutral, factual updates only |
| Confirmation bias | "This is definitely Buddy!" | "This may match Buddy's description." |

### 3.2 Messaging Review Checklist

Before displaying any AI-generated or system-generated message:

```
□ Does the message claim certainty? → BLOCK
□ Does the message promise a specific outcome? → BLOCK
□ Does the message include timeline guarantees? → BLOCK
□ Does the message use emotional manipulation? → REVIEW
□ Does the message include appropriate disclosure? → REQUIRED
□ Does the message align with verified facts only? → REQUIRED
```

### 3.3 Notification Templates

**Match Suggestion (to moderator):**
```
New Match Suggestion

Missing: Buddy (Golden Retriever, Greenbrier)
Found: Dog at Oak St (Golden mix, Greenbrier)

Confidence: 84.7%
Key factors: Species, color, size, proximity (1.2km)

ℹ️ AI-suggested match. Review photos and details before confirming.

[View Details] [Confirm Match] [Reject]
```

**Match Pending (to owner, if moderator escalates):**
```
Potential Match Update

A found animal report may match Buddy's description. 
Our team is reviewing the details.

You will be notified if the match is confirmed.

ℹ️ This is not a confirmation. Verification in progress.
```

**Match Confirmed (to owner):**
```
Confirmed Match - Action Required

A found animal has been confirmed as a likely match for Buddy.

Please contact PigPig to arrange safe reunion.

ℹ️ Final identification should be made in person.
[Contact Moderator]
```

---

## 4. MATCH SUGGESTION ENGINE

### 4.1 Matching Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| `species_match` | Required | Must match exactly (Dog↔Dog) |
| `breed_similarity` | 0.20 | Fuzzy match on breed description |
| `color_match` | 0.15 | Primary/secondary color comparison |
| `size_match` | 0.15 | Weight within ±20% tolerance |
| `location_proximity` | 0.20 | Distance between last seen / found locations |
| `time_gap` | 0.10 | Hours between last seen and found |
| `distinguishing_features` | 0.15 | NLP similarity on descriptions |
| `age_match` | 0.05 | Age category alignment |

### 4.2 Confidence Score Calculation

```python
def calculate_match_confidence(missing: Case, found: Case) -> float:
    # Species must match (hard filter)
    if missing.species != found.species:
        return 0.0
    
    score = 0.0
    
    # Breed similarity (fuzzy)
    breed_sim = fuzzy_match(missing.breed, found.breed_guess)
    score += breed_sim * 0.20
    
    # Color match
    color_sim = color_distance(
        missing.color_primary, missing.color_secondary,
        found.color_primary, found.color_secondary
    )
    score += color_sim * 0.15
    
    # Size match (within tolerance)
    if missing.weight_lbs and found.weight_lbs_estimate:
        weight_diff = abs(missing.weight_lbs - found.weight_lbs_estimate)
        weight_tolerance = missing.weight_lbs * 0.20
        if weight_diff <= weight_tolerance:
            score += (1 - weight_diff / weight_tolerance) * 0.15
    
    # Location proximity (inverse distance)
    distance_km = haversine(
        missing.last_seen_lat, missing.last_seen_lng,
        found.found_lat, found.found_lng
    )
    proximity_score = max(0, 1 - distance_km / 50)  # 50km = 0 score
    score += proximity_score * 0.20
    
    # Time gap (exponential decay)
    hours_gap = (found.found_at - missing.last_seen_at).total_seconds() / 3600
    time_score = math.exp(-hours_gap / 168)  # 1 week half-life
    score += time_score * 0.10
    
    # Distinguishing features (NLP)
    feature_sim = semantic_similarity(
        missing.distinguishing_features,
        found.distinguishing_features
    )
    score += feature_sim * 0.15
    
    # Age match
    age_sim = age_category_match(missing.age_years, found.age_estimate)
    score += age_sim * 0.05
    
    return min(score, 1.0)
```

### 4.3 Match Thresholds

| Threshold | Action |
|-----------|--------|
| `< 0.40` | Do not suggest (too low confidence) |
| `0.40 - 0.60` | Suggest with "Low Confidence" label |
| `0.60 - 0.80` | Suggest with "Moderate Confidence" label |
| `0.80 - 0.95` | Suggest with "High Confidence" label |
| `> 0.95` | Suggest but warn: "Very high match but still requires verification" |

### 4.4 Match Visibility Rules

```
INVARIANT: MATCH_SUGGESTION_PRIVATE
├─ Confidence < 0.40: Not surfaced to anyone
├─ Confidence >= 0.40: Visible to moderators only
├─ After moderator CONFIRMS:
│   ├─ Visible to owner (with reunion instructions)
│   └─ Visible to finder (if contact released)
├─ After moderator REJECTS:
│   └─ Archived; not visible to owner/finder
└─ NEVER visible to public users
```

---

## 5. SIGHTING INTELLIGENCE

### 5.1 Sighting Clustering

Group sightings by spatiotemporal proximity to identify "hot zones."

```python
def cluster_sightings(sightings: List[Sighting]) -> List[Cluster]:
    # DBSCAN clustering
    coords = [(s.lat, s.lng, s.timestamp.timestamp()) for s in sightings]
    
    # Spatial: 500m radius, Temporal: 6 hours
    clusters = dbscan(
        coords,
        eps_spatial=0.5,  # km
        eps_temporal=6 * 3600,  # seconds
        min_samples=2
    )
    
    return [
        Cluster(
            center_lat=mean([s.lat for s in cluster]),
            center_lng=mean([s.lng for s in cluster]),
            sighting_count=len(cluster),
            last_sighting=max(s.timestamp for s in cluster),
            area_name=reverse_geocode(center_lat, center_lng),
            confidence=calculate_cluster_confidence(cluster)
        )
        for cluster in clusters
    ]
```

### 5.2 Cluster Confidence

| Factor | Impact |
|--------|--------|
| Sighting count | More sightings = higher confidence |
| Temporal spread | Clustered in time = higher confidence |
| Reporter diversity | Multiple reporters = higher confidence |
| Verification status | Verified sightings weighted 2x |
| Recency | Recent sightings weighted higher |

### 5.3 Sighting Display Rules

```
INVARIANT: SIGHTING_DISPLAY
├─ Individual sightings:
│   ├─ Public: Show approximate area only (neighborhood level)
│   ├─ Owner: Show street-level location
│   └─ Moderator: Show exact coordinates
├─ Clusters:
│   ├─ Always show with "Approximate area" caveat
│   └─ Never imply certainty ("Pet IS here")
└─ All sighting data includes:
    └─ "Based on unverified reports. Accuracy not guaranteed."
```

---

## 6. TRIAGE RECOMMENDATIONS

### 6.1 Case Prioritization

AI may suggest case priority to moderators based on urgency factors.

| Factor | Priority Impact |
|--------|-----------------|
| Medical emergency flagged | +3 (critical) |
| Young animal (<6 months) | +2 |
| Senior animal (>10 years) | +2 |
| Severe weather conditions | +2 |
| High sighting activity | +1 |
| Owner unresponsive | +1 |
| Case age > 7 days with no activity | +1 |

### 6.2 Priority Labels

| Score | Label | Action Suggestion |
|-------|-------|-------------------|
| 0-2 | Normal | Standard review queue |
| 3-4 | Elevated | Review within 4 hours |
| 5-6 | High | Review within 1 hour |
| 7+ | Critical | Immediate escalation |

### 6.3 Triage Display

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL - Immediate Review Suggested                        │
│                                                                 │
│ Case: GRN-2026-0042 (Buddy, Golden Retriever)                  │
│                                                                 │
│ Factors:                                                        │
│ • Medical concern noted by finder (+3)                         │
│ • Severe cold weather advisory active (+2)                     │
│ • Multiple recent sightings (+1)                               │
│                                                                 │
│ ℹ️ Priority suggestion only. Human moderator makes decisions.   │
│                                                                 │
│ [Review Case] [Dismiss Priority Flag]                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. CONTENT FILTERING

### 7.1 Prohibited Content Patterns

The following patterns MUST be filtered from all AI outputs:

```javascript
const PROHIBITED_PATTERNS = {
  certainty: [
    /\b(definitely|certainly|100%|guaranteed|will be|must be)\b/i,
    /\b(is found|has been found|we found)\b/i,  // unless confirmed by moderator
    /\b(is (at|in|near) (?!the shelter))/i,    // location certainty
  ],
  
  medical: [
    /\b(diagnos(e|is|ed)|treat(ment)?|prescrib(e|ed)|medicat(e|ion))\b/i,
    /\b(you should give|administer|dose)\b/i,
    /\b(disease|infection|condition)\b/i,  // unless quoting user
  ],
  
  legal: [
    /\b(liabl(e|ility)|negligent|negligence|lawsuit|sue|legal action)\b/i,
    /\b(required (by law|to)|must respond|obligat(ed|ion))\b/i,
    /\b(file (a )?complaint|formal record)\b/i,
  ],
  
  emotional: [
    /\b(don't (give up|lose) hope|keep hoping|miracle)\b/i,
    /\b(pray(ing)?|faith|believe)\b/i,
    /\b(worst case|prepare for|unlikely to)\b/i,  // survival predictions
  ],
  
  blame: [
    /\b(fault|blame|responsible for|caused by|because of)\b/i,
    /\b(officer|agency|county) (failed|refused|ignored)\b/i,
  ],
};
```

### 7.2 Filter Pipeline

```
AI Output Generated
    │
    ▼
┌─────────────────────────────────────────┐
│ Pattern Matching Filter                 │
│ (Check all prohibited patterns)         │
└─────────────────────────────────────────┘
    │
    ├─── Match found ────────────────────────────┐
    │                                            ▼
    │                               ┌─────────────────────────┐
    │                               │ Log violation           │
    │                               │ Attempt safe rewrite    │
    │                               │ OR block output         │
    │                               └─────────────────────────┘
    │
    └─── No match ───────────────────────────────┐
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Append disclosure       │
                                    │ Pass to display         │
                                    └─────────────────────────┘
```

### 7.3 Safe Rewrites

| Flagged Pattern | Safe Alternative |
|-----------------|------------------|
| "We found your pet at 123 Main St" | "A potential match was reported near downtown. Verification required." |
| "The dog is definitely Buddy" | "This animal may match Buddy's description." |
| "Give the dog some aspirin" | "Please consult a veterinarian for medical advice." |
| "The county failed to respond" | "Response status: Pending" |
| "Don't give up hope!" | "Search efforts are ongoing." |

---

## 8. AUDIT LOGGING

### 8.1 AI Decision Log

Every AI output MUST be logged for audit purposes.

```typescript
interface AIDecisionLog {
  id: string;
  timestamp: string;
  
  // Context
  case_id: string | null;
  user_id: string | null;
  session_id: string;
  
  // AI operation
  operation_type: 'MATCH' | 'CLUSTER' | 'TRIAGE' | 'SUMMARY' | 'FILTER';
  input_summary: string;         // Hashed/anonymized input
  
  // Output
  raw_output: string;            // Before filtering
  filtered_output: string;       // After filtering
  filters_applied: string[];     // Which patterns matched
  disclosure_added: string;      // Which disclosure
  
  // Scoring (if applicable)
  confidence_score: number | null;
  scoring_factors: object | null;
  
  // Outcome
  displayed_to_user: boolean;
  blocked: boolean;
  block_reason: string | null;
}
```

### 8.2 Retention

| Log Type | Retention |
|----------|-----------|
| AI decision logs | 90 days (pilot) |
| Blocked content logs | 180 days |
| Successful matches | Permanent (anonymized) |

---

## 9. MODEL GOVERNANCE

### 9.1 Approved Models

| Use Case | Approved Model(s) | Version Lock |
|----------|-------------------|--------------|
| Text similarity | sentence-transformers/all-MiniLM-L6-v2 | Yes |
| Breed classification | (TBD - placeholder) | N/A |
| Color extraction | Rule-based + color distance | N/A |
| Clustering | DBSCAN (scikit-learn) | 1.x |

### 9.2 Model Update Protocol

1. Any model change requires CHANGELOG entry
2. New models require pilot testing on synthetic data
3. A/B comparison against baseline required
4. Rollback capability mandatory
5. Founder approval for production deployment

### 9.3 No External AI Services

```
PROHIBITED:
├─ OpenAI API (GPT-4, etc.)
├─ Google Generative AI
├─ Anthropic Claude
├─ Any cloud LLM API
└─ Any model not explicitly approved

RATIONALE:
├─ Unpredictable outputs
├─ External dependency
├─ Cost unpredictability
├─ Privacy concerns (data leaves system)
└─ Cannot guarantee guardrail compliance
```

---

## 10. TESTING REQUIREMENTS

### 10.1 Guardrail Test Cases

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Certainty filter | "We definitely found Buddy" | Blocked or rewritten |
| Medical filter | "Give the dog ibuprofen" | Blocked |
| Legal filter | "The county is liable" | Blocked |
| Disclosure addition | Any match suggestion | Includes disclosure |
| Low confidence suppression | 0.35 match score | Not displayed |
| False hope filter | "Don't give up hope!" | Blocked |

### 10.2 Adversarial Testing

Quarterly review with adversarial prompts:
- Attempt to elicit certainty claims
- Attempt to get medical advice
- Attempt to assign blame
- Attempt to bypass disclosures

---

## 11. INCIDENT RESPONSE

### 11.1 AI Output Incident

If an AI output violates guardrails and reaches users:

1. **Immediate:** Disable AI feature (fail-closed)
2. **Investigate:** Retrieve AI decision logs
3. **Notify:** Inform affected users with correction
4. **Remediate:** Fix filter/model
5. **Document:** Post-incident report

### 11.2 Escalation Path

```
AI Incident Detected
    │
    ├─── Minor (filter gap) ─────► Fix filter, no escalation
    │
    ├─── Moderate (bad output) ──► Disable feature, notify lead
    │
    └─── Severe (harm caused) ───► Full incident response
                                   Notify Founder
                                   Legal review
```

---

**END OF AI GUARDRAILS v1.0.0**
