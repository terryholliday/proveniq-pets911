# Moderator Coverage Area System

## Overview
System for SYSOP to assign moderators to geographic coverage areas, designed to scale from county-level (WV) to national deployment.

---

## Data Model

### Hierarchy (Scalable)
```
Region (future) → State → County
```

### Tables

#### `coverage_areas`
Master list of geographic areas available for assignment.

```sql
CREATE TABLE coverage_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_type text NOT NULL CHECK (area_type IN ('state', 'county', 'region')),
  state_code text NOT NULL,           -- 'WV', 'VA', etc.
  county_name text,                   -- NULL for state-level coverage
  region_name text,                   -- Future: 'Appalachian', 'Southeast', etc.
  display_name text NOT NULL,         -- 'Kanawha County, WV' or 'West Virginia'
  population int,                     -- For workload balancing
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coverage_areas_state ON coverage_areas(state_code);
CREATE INDEX idx_coverage_areas_type ON coverage_areas(area_type);
```

#### `moderator_coverage_assignments`
Links moderators to their assigned coverage areas.

```sql
CREATE TABLE moderator_coverage_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coverage_area_id uuid REFERENCES coverage_areas(id) ON DELETE CASCADE,
  assignment_type text NOT NULL CHECK (assignment_type IN ('primary', 'backup', 'overflow')),
  priority int DEFAULT 1,             -- Lower = higher priority within type
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  notes text,
  
  UNIQUE(moderator_id, coverage_area_id)  -- One assignment per mod per area
);

-- Indexes
CREATE INDEX idx_mod_coverage_moderator ON moderator_coverage_assignments(moderator_id);
CREATE INDEX idx_mod_coverage_area ON moderator_coverage_assignments(coverage_area_id);
```

---

## Assignment Types

| Type | Description | Use Case |
|------|-------------|----------|
| `primary` | Main moderator for this area | Day-to-day operations |
| `backup` | Covers when primary unavailable | Shift gaps, vacations |
| `overflow` | Assists during high volume | Critical incidents, disasters |

---

## Scaling Strategy

### Phase 1: West Virginia (Current)
- 55 counties as individual coverage areas
- Moderators assigned to 1-10 counties each
- State-wide "WV" area for lead moderators

### Phase 2: Multi-State Expansion
- Add new states as they onboard
- Same county structure per state
- Cross-state backup assignments possible

### Phase 3: Regional Operations
- Group states into regions
- Regional lead moderators
- Cross-state resource sharing during emergencies

### Phase 4: National
- National operations center
- Regional → State → County hierarchy
- Automatic load balancing

---

## SYSOP UI Features

### Assignment Management
- View all moderators and their current assignments
- Drag-and-drop county assignment
- Bulk assign (all counties in state)
- Assignment history/audit log

### Coverage Map
- Visual map showing coverage by county
- Color coding: covered (green), partial (yellow), uncovered (red)
- Click county to see assigned moderators

### Reports
- Coverage gaps (counties without primary mod)
- Workload distribution (tickets per moderator)
- Response time by coverage area

---

## API Endpoints

```
GET    /api/admin/sysop/coverage-areas          - List all areas
GET    /api/admin/sysop/coverage-areas/:id      - Get area details
POST   /api/admin/sysop/moderators/:id/coverage - Assign mod to area
DELETE /api/admin/sysop/moderators/:id/coverage/:areaId - Remove assignment
GET    /api/admin/sysop/coverage-map            - Coverage status summary
GET    /api/admin/sysop/moderators/:id/coverage - Get mod's assignments
```

---

## West Virginia Counties (Seed Data)

```typescript
const WV_COUNTIES = [
  'BARBOUR', 'BERKELEY', 'BOONE', 'BRAXTON', 'BROOKE', 'CABELL', 'CALHOUN',
  'CLAY', 'DODDRIDGE', 'FAYETTE', 'GILMER', 'GRANT', 'GREENBRIER', 'HAMPSHIRE',
  'HANCOCK', 'HARDY', 'HARRISON', 'JACKSON', 'JEFFERSON', 'KANAWHA', 'LEWIS',
  'LINCOLN', 'LOGAN', 'MARION', 'MARSHALL', 'MASON', 'MCDOWELL', 'MERCER',
  'MINERAL', 'MINGO', 'MONONGALIA', 'MONROE', 'MORGAN', 'NICHOLAS', 'OHIO',
  'PENDLETON', 'PLEASANTS', 'POCAHONTAS', 'PRESTON', 'PUTNAM', 'RALEIGH',
  'RANDOLPH', 'RITCHIE', 'ROANE', 'SUMMERS', 'TAYLOR', 'TUCKER', 'TYLER',
  'UPSHUR', 'WAYNE', 'WEBSTER', 'WETZEL', 'WIRT', 'WOOD', 'WYOMING'
];
```

---

## Access Control

- **SYSOP only**: Can assign/remove moderator coverage
- **Lead Moderators**: Can view coverage map, request changes
- **Moderators**: Can view their own assignments

---

*Last Updated: January 13, 2026*
