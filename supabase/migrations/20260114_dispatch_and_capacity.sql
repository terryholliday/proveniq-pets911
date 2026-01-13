-- ===========================================
-- DISPATCH REQUESTS & CAPACITY ALERTS SYSTEM
-- Migration: 20260114_dispatch_and_capacity.sql
-- ===========================================

-- ===================
-- 1. DISPATCH REQUESTS (Volunteer dispatch tracking)
-- ===================
CREATE TABLE IF NOT EXISTS dispatch_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,
    case_id UUID REFERENCES incident_cases(id),
    
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'COMPLETED', 'CANCELLED'
    )),
    
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 2. CASE TIMELINE (Event log for cases)
-- ===================
CREATE TABLE IF NOT EXISTS case_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL CHECK (event_type IN (
        'CASE_CREATED', 'STATUS_CHANGED', 'VOLUNTEER_ASSIGNED', 'VOLUNTEER_DISPATCHED',
        'ANIMAL_ADDED', 'ANIMAL_UPDATED', 'PHOTO_ADDED', 'NOTE_ADDED',
        'TRANSPORT_STARTED', 'TRANSPORT_COMPLETED', 'PARTNER_NOTIFIED',
        'DISPOSITION_SET', 'ESCALATED', 'CLOSED'
    )),
    
    description TEXT NOT NULL,
    actor_name TEXT,
    actor_type TEXT CHECK (actor_type IN ('SYSTEM', 'VOLUNTEER', 'MODERATOR', 'PARTNER', 'REPORTER')),
    
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 3. CAPACITY ALERTS (Shelter capacity notifications)
-- ===================
CREATE TABLE IF NOT EXISTS capacity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID,
    shelter_name TEXT NOT NULL,
    
    alert_type TEXT NOT NULL CHECK (alert_type IN ('ELEVATED', 'CRITICAL', 'OVERFLOW')),
    species TEXT CHECK (species IN ('DOG', 'CAT', 'BOTH')),
    current_percentage INT,
    
    volunteers_notified INT DEFAULT 0,
    responses_received INT DEFAULT 0,
    
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 4. PARTNER INTAKES (Shelter intake records)
-- ===================
CREATE TABLE IF NOT EXISTS partner_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    intake_type TEXT NOT NULL CHECK (intake_type IN (
        'STRAY', 'SURRENDER', 'TRANSFER', 'SEIZED', 'RETURN'
    )),
    
    linked_case_number TEXT,
    
    source_name TEXT,
    source_phone TEXT,
    source_address TEXT,
    source_county TEXT,
    source_notes TEXT,
    
    animal_count INT DEFAULT 0,
    
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 5. INTAKE ANIMALS (Individual animals from intake)
-- ===================
CREATE TABLE IF NOT EXISTS intake_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES partner_intakes(id) ON DELETE CASCADE,
    organization_id UUID,
    
    temp_id TEXT,
    species TEXT NOT NULL,
    breed TEXT,
    color TEXT,
    sex TEXT CHECK (sex IN ('MALE', 'FEMALE', 'UNKNOWN')),
    
    age_estimate TEXT,
    weight_estimate TEXT,
    
    microchip_number TEXT,
    has_collar BOOLEAN DEFAULT FALSE,
    collar_description TEXT,
    
    medical_notes TEXT,
    behavioral_notes TEXT,
    
    disposition TEXT,
    disposition_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 6. ADD COLUMNS TO EXISTING TABLES
-- ===================

-- Add capacity tracking to partner_organizations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partner_organizations' AND column_name = 'current_dogs') THEN
        ALTER TABLE partner_organizations ADD COLUMN current_dogs INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partner_organizations' AND column_name = 'max_dogs') THEN
        ALTER TABLE partner_organizations ADD COLUMN max_dogs INT DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partner_organizations' AND column_name = 'current_cats') THEN
        ALTER TABLE partner_organizations ADD COLUMN current_cats INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partner_organizations' AND column_name = 'max_cats') THEN
        ALTER TABLE partner_organizations ADD COLUMN max_cats INT DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partner_organizations' AND column_name = 'capacity_updated_at') THEN
        ALTER TABLE partner_organizations ADD COLUMN capacity_updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add dispatch stats to volunteers if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'volunteers' AND column_name = 'total_dispatches') THEN
        ALTER TABLE volunteers ADD COLUMN total_dispatches INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'volunteers' AND column_name = 'completed_dispatches') THEN
        ALTER TABLE volunteers ADD COLUMN completed_dispatches INT DEFAULT 0;
    END IF;
END $$;

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_volunteer ON dispatch_requests(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_case ON dispatch_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_status ON dispatch_requests(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_requests_expires ON dispatch_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_case_timeline_case ON case_timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_type ON case_timeline(event_type);

CREATE INDEX IF NOT EXISTS idx_capacity_alerts_shelter ON capacity_alerts(shelter_id);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_sent ON capacity_alerts(sent_at);

CREATE INDEX IF NOT EXISTS idx_partner_intakes_org ON partner_intakes(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_intakes_type ON partner_intakes(intake_type);

CREATE INDEX IF NOT EXISTS idx_intake_animals_intake ON intake_animals(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_animals_species ON intake_animals(species);
CREATE INDEX IF NOT EXISTS idx_intake_animals_microchip ON intake_animals(microchip_number);

-- ===================
-- TRIGGERS
-- ===================

-- Auto-create timeline entry when case status changes
CREATE OR REPLACE FUNCTION fn_case_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO case_timeline (case_id, event_type, description, actor_type)
        VALUES (NEW.id, 'STATUS_CHANGED', 
                'Status changed from ' || COALESCE(OLD.status, 'NEW') || ' to ' || NEW.status,
                'SYSTEM');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_case_status_timeline ON incident_cases;
CREATE TRIGGER trg_case_status_timeline
    AFTER UPDATE ON incident_cases
    FOR EACH ROW
    EXECUTE FUNCTION fn_case_status_timeline();

-- Auto-expire dispatch requests
CREATE OR REPLACE FUNCTION fn_expire_dispatch_requests()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE dispatch_requests
    SET status = 'EXPIRED'
    WHERE status = 'PENDING' AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
