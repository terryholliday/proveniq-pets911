# Emergency Helper / Volunteer Network System

## Overview

The volunteer network enables pre-registered helpers to provide transport, foster care, and emergency response when finders cannot transport animals themselves.

## Database Schema Required

### `volunteers` table

```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'TEMPORARILY_UNAVAILABLE', 'SUSPENDED')),
  
  -- Contact & Location
  display_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  primary_county TEXT NOT NULL CHECK (primary_county IN ('GREENBRIER', 'KANAWHA')),
  address_city TEXT NOT NULL,
  address_zip TEXT NOT NULL,
  home_lat DECIMAL(10, 8),
  home_lng DECIMAL(11, 8),
  
  -- Capabilities
  capabilities TEXT[] NOT NULL,
  max_response_radius_miles INTEGER NOT NULL DEFAULT 10,
  
  -- Transport capacity
  has_vehicle BOOLEAN DEFAULT false,
  vehicle_type TEXT,
  can_transport_crate BOOLEAN DEFAULT false,
  max_animal_size TEXT CHECK (max_animal_size IN ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE')),
  
  -- Foster capacity
  can_foster_species TEXT[] DEFAULT '{}',
  max_foster_count INTEGER DEFAULT 1,
  has_fenced_yard BOOLEAN DEFAULT false,
  has_other_pets BOOLEAN DEFAULT false,
  other_pets_description TEXT,
  
  -- Availability
  available_weekdays BOOLEAN DEFAULT false,
  available_weekends BOOLEAN DEFAULT false,
  available_nights BOOLEAN DEFAULT false,
  available_immediately BOOLEAN DEFAULT false,
  
  -- Verification
  background_check_completed BOOLEAN DEFAULT false,
  background_check_date TIMESTAMPTZ,
  references_verified BOOLEAN DEFAULT false,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Stats
  total_dispatches INTEGER DEFAULT 0,
  completed_dispatches INTEGER DEFAULT 0,
  declined_dispatches INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER,
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_county ON volunteers(primary_county);
CREATE INDEX idx_volunteers_location ON volunteers USING gist(ll_to_earth(home_lat, home_lng));
```

### `dispatch_requests` table

```sql
CREATE TABLE dispatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('TRANSPORT', 'FOSTER', 'EMERGENCY_ASSIST')),
  priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  
  -- Animal details
  species TEXT NOT NULL,
  animal_size TEXT NOT NULL CHECK (animal_size IN ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE')),
  animal_condition TEXT,
  needs_crate BOOLEAN DEFAULT false,
  
  -- Location
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  dropoff_address TEXT,
  county TEXT NOT NULL CHECK (county IN ('GREENBRIER', 'KANAWHA')),
  
  -- Requester (finder)
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  
  -- Assignment
  volunteer_id UUID REFERENCES volunteers(id),
  volunteer_name TEXT,
  volunteer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
  
  -- Timing
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Outcome
  outcome_notes TEXT,
  distance_miles DECIMAL(5, 2),
  duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dispatch_requests_status ON dispatch_requests(status);
CREATE INDEX idx_dispatch_requests_county ON dispatch_requests(county);
CREATE INDEX idx_dispatch_requests_volunteer ON dispatch_requests(volunteer_id);
CREATE INDEX idx_dispatch_requests_requester ON dispatch_requests(requester_id);
```

## User Flow

### 1. Volunteer Registration (`/helpers/join`)

- Multi-step form collects:
  - Contact info (name, phone, email, county, city, zip)
  - Capabilities (transport, foster short/long-term, emergency response)
  - Max response radius
  - Transport details (vehicle type, crate capacity, max animal size)
  - Foster details (species, capacity, yard, other pets)
  - Availability (weekdays, weekends, nights, immediate)
  - Emergency contact

- Creates record in `volunteers` table with status `ACTIVE`
- Background check marked as pending

### 2. Emergency Dispatch Request

When a finder reports an injured animal but **cannot transport**:

1. **Finder clicks "Find Available Helpers"** in emergency routing card
2. **System queries volunteers** matching:
   - Same county
   - Has required capability (TRANSPORT)
   - Within max response radius
   - Vehicle capacity matches animal size
   - Status = ACTIVE
3. **Calculates match scores** based on:
   - Distance (closer = higher score)
   - Availability (immediate response = bonus)
   - Recent activity
4. **Returns top 5 matches** sorted by score
5. **Creates dispatch_request** with status `PENDING` and 30-min expiry

### 3. Volunteer Notification (Future: Twilio SMS)

- Top matches receive SMS: "Emergency transport needed: [species] [size] at [address]. Respond Y to accept."
- Volunteer responds or clicks link to accept
- First acceptance updates dispatch_request to `ACCEPTED`
- Other volunteers notified request is filled

### 4. Coordination

- Finder sees volunteer name, phone, ETA
- Volunteer gets pickup/dropoff details
- Status updates: EN_ROUTE → ARRIVED → COMPLETED
- Outcome logged with distance/duration

## API Endpoints

### `POST /api/volunteers/register`
Register new volunteer profile

### `GET /api/volunteers/profile?user_id={id}`
Get volunteer profile

### `PATCH /api/volunteers/profile`
Update volunteer profile (availability, status, etc.)

### `POST /api/dispatch/request`
Create dispatch request and find matching volunteers

### `PATCH /api/dispatch/request`
Update dispatch status (accept, decline, complete)

## Integration Points

### Emergency Routing Cards
`src/components/emergency/routing-cards.tsx`
- Shows `VolunteerDispatchCard` when finder cannot transport
- Only visible to authenticated users
- Requires location data

### Volunteer Dispatch Card
`src/components/emergency/VolunteerDispatchCard.tsx`
- "Find Available Helpers" button
- Shows matched volunteers with distance/ETA
- "Request This Helper" notifies volunteer
- Fallback to Animal Control if no matches

## Missing Pieces (To Implement)

1. **Geocoding for volunteer addresses**
   - Convert city/zip to lat/lng on registration
   - Use Google Geocoding API or similar

2. **SMS notifications via Twilio**
   - Send dispatch requests to volunteers
   - Receive acceptance/decline responses
   - Status updates to finder

3. **Background check integration**
   - Third-party service (Checkr, etc.)
   - Mark `background_check_completed` when verified

4. **Volunteer dashboard** (`/helpers/dashboard`)
   - View active/past dispatches
   - Update availability status
   - View stats (response time, completion rate)

5. **Admin moderation**
   - Review/approve new volunteers
   - Suspend problematic volunteers
   - View dispatch analytics

## Security & Trust

- All volunteers require emergency contact
- Background checks before activation (manual for now)
- Phone verification on signup
- Dispatch requests expire after 30 minutes
- Finders can see volunteer ratings/stats (future)
- All interactions logged in Impact Ledger

## Metrics (Lives Saved)

Track in Impact Ledger:
- Animals transported by volunteers (vs. would have been euthanized)
- Average response time reduction (volunteer vs. Animal Control)
- Foster placements preventing shelter intake
- Reunification velocity increase from faster transport
