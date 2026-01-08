-- Volunteer System Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
  checkr_report_id TEXT,
  
  -- Stats
  total_dispatches INTEGER DEFAULT 0,
  completed_dispatches INTEGER DEFAULT 0,
  declined_dispatches INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER,
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for volunteers
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_county ON volunteers(primary_county);

-- Dispatch requests table
CREATE TABLE IF NOT EXISTS dispatch_requests (
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
  requester_id TEXT NOT NULL,
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

-- Indexes for dispatch_requests
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_status ON dispatch_requests(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_county ON dispatch_requests(county);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_volunteer ON dispatch_requests(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_requester ON dispatch_requests(requester_id);

-- Dispatch notifications table
CREATE TABLE IF NOT EXISTS dispatch_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_request_id UUID NOT NULL REFERENCES dispatch_requests(id),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('SMS', 'PUSH', 'EMAIL')),
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  response_action TEXT CHECK (response_action IN ('ACCEPTED', 'DECLINED')),
  message_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dispatch_notifications
CREATE INDEX IF NOT EXISTS idx_dispatch_notifications_dispatch ON dispatch_notifications(dispatch_request_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_notifications_volunteer ON dispatch_notifications(volunteer_id);

-- Volunteer moderation log table
CREATE TABLE IF NOT EXISTS volunteer_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id),
  action TEXT NOT NULL CHECK (action IN ('APPROVED', 'SUSPENDED', 'REACTIVATED', 'BACKGROUND_CHECK_INITIATED', 'BACKGROUND_CHECK_COMPLETED')),
  reason TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for moderation log
CREATE INDEX IF NOT EXISTS idx_volunteer_moderation_log_volunteer ON volunteer_moderation_log(volunteer_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_moderation_log ENABLE ROW LEVEL SECURITY;

-- Volunteers: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own volunteer profile" ON volunteers
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update own volunteer profile" ON volunteers
  FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own volunteer profile" ON volunteers
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Dispatch requests: Volunteers can see their assigned requests, requesters can see their own
CREATE POLICY "Users can view own dispatch requests" ON dispatch_requests
  FOR SELECT USING (
    auth.uid()::text = requester_id OR 
    volunteer_id IN (SELECT id FROM volunteers WHERE user_id::uuid = auth.uid())
  );

CREATE POLICY "Users can create dispatch requests" ON dispatch_requests
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

CREATE POLICY "Volunteers can update assigned dispatches" ON dispatch_requests
  FOR UPDATE USING (
    volunteer_id IN (SELECT id FROM volunteers WHERE user_id::uuid = auth.uid())
  );

-- Notifications: Volunteers can see their own notifications
CREATE POLICY "Volunteers can view own notifications" ON dispatch_notifications
  FOR SELECT USING (
    volunteer_id IN (SELECT id FROM volunteers WHERE user_id::uuid = auth.uid())
  );

-- Moderation log: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view moderation log" ON volunteer_moderation_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant service role full access (for API routes)
GRANT ALL ON volunteers TO service_role;
GRANT ALL ON dispatch_requests TO service_role;
GRANT ALL ON dispatch_notifications TO service_role;
GRANT ALL ON volunteer_moderation_log TO service_role;
