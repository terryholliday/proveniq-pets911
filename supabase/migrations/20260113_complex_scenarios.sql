-- ============================================================
-- COMPLEX SCENARIO SUPPORT
-- Handles: Litters, Seizures, Hoarding, Technical Rescues,
-- Capacity Crisis, Hotspots, Transport Relays
-- ============================================================

-- ===================
-- 1. INCIDENT CASES (Master Container)
-- ===================
-- A single "case" can contain multiple animals from one event
CREATE TABLE IF NOT EXISTS incident_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case identification
    case_number TEXT UNIQUE NOT NULL,  -- e.g., "KCHA-2026-0142"
    case_type TEXT NOT NULL CHECK (case_type IN (
        'STRAY_SINGLE',           -- Normal single animal
        'STRAY_LITTER',           -- Group found together (14 puppies)
        'ABANDONMENT',            -- Intentional dump
        'DECEASED_OWNER',         -- Animals from deceased owner
        'COMMUNITY_CAT_COLONY',   -- Feral colony for TNR
        'SEIZURE',                -- Legal seizure (Sissonville)
        'HOARDING',               -- Hoarding situation
        'TECHNICAL_RESCUE',       -- Trapped/inaccessible
        'CRUELTY',                -- Abuse/neglect
        'SURRENDER',              -- Owner surrender
        'TRANSPORT_RELAY'         -- Multi-leg transport
    )),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'IN_PROGRESS', 'PENDING_RESOURCES', 
        'RESOLVED', 'CLOSED', 'LEGAL_HOLD'
    )),
    
    -- Location (where event occurred)
    location_address TEXT,
    location_city TEXT,
    location_county TEXT NOT NULL,
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),
    location_notes TEXT,  -- "Patrick St. Bridge, trapped in hole"
    
    -- For repeat abandonment tracking
    location_hash TEXT GENERATED ALWAYS AS (
        md5(COALESCE(location_lat::TEXT, '') || ',' || COALESCE(location_lng::TEXT, ''))
    ) STORED,
    
    -- Animal counts (for quick reference)
    total_animals INT NOT NULL DEFAULT 1,
    species_breakdown JSONB,  -- {"DOG": 4, "CAT": 2, "WALLABY": 3, ...}
    
    -- Legal/External references
    legal_case_number TEXT,      -- Court case number for seizures
    law_enforcement_agency TEXT, -- "Kanawha County Sheriff"
    law_enforcement_contact TEXT,
    
    -- Special flags
    requires_equipment BOOLEAN DEFAULT FALSE,
    equipment_needed TEXT[],  -- ['LADDER', 'TRAP', 'HEAVY_LIFT']
    is_multi_species BOOLEAN DEFAULT FALSE,
    is_capacity_crisis BOOLEAN DEFAULT FALSE,
    shelter_refused_intake BOOLEAN DEFAULT FALSE,
    shelter_refusal_reason TEXT,
    
    -- Timestamps
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Reporter
    reporter_id UUID,
    reporter_name TEXT,
    reporter_phone TEXT,
    reporter_email TEXT
);

-- ===================
-- 2. CASE ANIMALS (Individual animals in a case)
-- ===================
CREATE TABLE IF NOT EXISTS case_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
    
    -- Animal identity
    animal_id TEXT,  -- Assigned later: "A-2026-0142-01"
    temp_id TEXT,    -- Before processing: "Puppy #1 of 14"
    
    -- Species (expanded for exotics)
    species TEXT NOT NULL CHECK (species IN (
        'DOG', 'CAT', 'RABBIT', 'BIRD', 
        'REPTILE', 'SMALL_MAMMAL',  -- hamster, guinea pig, etc.
        'LIVESTOCK',   -- donkey, llama, goat, pig
        'EXOTIC',      -- wallaby, etc.
        'OTHER'
    )),
    species_detail TEXT,  -- "Wallaby", "Llama", "Bearded Dragon"
    
    -- Description
    description TEXT,
    breed TEXT,
    color TEXT,
    size TEXT CHECK (size IN ('TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XLARGE')),
    sex TEXT CHECK (sex IN ('MALE', 'FEMALE', 'UNKNOWN')),
    age_estimate TEXT,  -- "~8 weeks", "Adult", "Senior"
    weight_lbs DECIMAL(6, 2),
    
    -- Condition
    condition TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (condition IN (
        'HEALTHY', 'MINOR_INJURY', 'INJURED', 'CRITICAL',
        'MALNOURISHED', 'SCARED_SELF_HARMING', 'DECEASED', 'UNKNOWN'
    )),
    condition_notes TEXT,
    requires_immediate_medical BOOLEAN DEFAULT FALSE,
    
    -- Special flags
    is_litter_member BOOLEAN DEFAULT FALSE,
    litter_id UUID,  -- Links siblings
    suspected_breeder_release BOOLEAN DEFAULT FALSE,  -- Breeding dump flag
    breeder_release_signs TEXT[],  -- ['C_SECTION_SCAR', 'MAMMARY_TUMORS', 'MULTIPLE_LITTERS']
    
    -- Identification
    microchip_id TEXT,
    microchip_scanned BOOLEAN DEFAULT FALSE,
    has_collar BOOLEAN DEFAULT FALSE,
    collar_description TEXT,
    
    -- Disposition
    disposition TEXT CHECK (disposition IN (
        'PENDING',
        'SHELTER_INTAKE',
        'FOSTER_PLACEMENT',
        'RESCUE_TRANSFER',
        'SANCTUARY',          -- For exotics like wallabies
        'SPECIALIST_CARE',    -- Exotic vet, wildlife rehab
        'RETURNED_TO_OWNER',
        'COMMUNITY_CAT',      -- TNR'd and released
        'EUTHANIZED',
        'DECEASED_ON_ARRIVAL'
    )),
    disposition_org_id UUID REFERENCES organizations(id),
    disposition_notes TEXT,
    
    -- Photos
    photo_urls TEXT[],
    is_group_photo BOOLEAN DEFAULT FALSE,  -- One photo of 14 puppies
    
    -- Timestamps
    intake_at TIMESTAMPTZ,
    disposition_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 3. LITTERS (Group entity for batch processing)
-- ===================
CREATE TABLE IF NOT EXISTS litters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
    
    -- Quick entry data
    count INT NOT NULL,
    species TEXT NOT NULL,
    description TEXT,  -- "Mixed breed puppies, ~8 weeks"
    group_photo_url TEXT,
    
    -- Status
    processed BOOLEAN DEFAULT FALSE,  -- False = single entry, True = split into individuals
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 4. ABANDONMENT HOTSPOTS (Auto-generated from patterns)
-- ===================
CREATE TABLE IF NOT EXISTS abandonment_hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    location_hash TEXT NOT NULL,
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    location_address TEXT,
    location_description TEXT,  -- "KCHA back door", "Clendenin ball field"
    county TEXT NOT NULL,
    
    -- Stats
    incident_count INT NOT NULL DEFAULT 1,
    first_incident_at TIMESTAMPTZ NOT NULL,
    last_incident_at TIMESTAMPTZ NOT NULL,
    
    -- Alert threshold
    is_flagged BOOLEAN DEFAULT FALSE,  -- Auto-set when count >= 3
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(location_hash)
);

-- ===================
-- 5. TRANSPORT RELAYS (Multi-leg transport coordination)
-- ===================
CREATE TABLE IF NOT EXISTS transport_relays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES incident_cases(id),
    animal_id UUID REFERENCES case_animals(id),
    
    -- Route
    origin_address TEXT NOT NULL,
    origin_city TEXT,
    origin_state TEXT,
    origin_lat DECIMAL(10, 7),
    origin_lng DECIMAL(10, 7),
    
    destination_address TEXT NOT NULL,
    destination_city TEXT,
    destination_state TEXT,
    destination_lat DECIMAL(10, 7),
    destination_lng DECIMAL(10, 7),
    
    total_distance_miles INT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'PLANNING' CHECK (status IN (
        'PLANNING', 'SEEKING_DRIVERS', 'CONFIRMED', 
        'IN_TRANSIT', 'COMPLETED', 'CANCELLED'
    )),
    
    -- Timing
    target_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transport relay legs (individual driver segments)
CREATE TABLE IF NOT EXISTS transport_relay_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relay_id UUID NOT NULL REFERENCES transport_relays(id) ON DELETE CASCADE,
    leg_number INT NOT NULL,
    
    -- Segment
    start_address TEXT NOT NULL,
    start_lat DECIMAL(10, 7),
    start_lng DECIMAL(10, 7),
    end_address TEXT NOT NULL,
    end_lat DECIMAL(10, 7),
    end_lng DECIMAL(10, 7),
    distance_miles INT,
    
    -- Driver (store ID without FK to avoid constraint issues)
    volunteer_id UUID,
    volunteer_name TEXT,
    volunteer_phone TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'CLAIMED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    
    -- Timing
    scheduled_pickup TIMESTAMPTZ,
    actual_pickup TIMESTAMPTZ,
    actual_dropoff TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- 6. EQUIPMENT REGISTRY (For technical rescues)
-- ===================
CREATE TABLE IF NOT EXISTS volunteer_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,  -- References volunteers but no FK due to missing unique constraint
    
    equipment_type TEXT NOT NULL CHECK (equipment_type IN (
        'LADDER', 'EXTENSION_LADDER', 
        'LIVE_TRAP_SMALL', 'LIVE_TRAP_LARGE',
        'CATCH_POLE', 'NET',
        'CRATE_SMALL', 'CRATE_MEDIUM', 'CRATE_LARGE', 'CRATE_XLARGE',
        'VEHICLE_TRAILER',
        'BOAT', 'KAYAK',
        'DRONE',
        'THERMAL_CAMERA',
        'OTHER'
    )),
    equipment_detail TEXT,
    
    is_available BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_incident_cases_county ON incident_cases(location_county);
CREATE INDEX IF NOT EXISTS idx_incident_cases_status ON incident_cases(status);
CREATE INDEX IF NOT EXISTS idx_incident_cases_type ON incident_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_incident_cases_location_hash ON incident_cases(location_hash);

CREATE INDEX IF NOT EXISTS idx_case_animals_case ON case_animals(case_id);
CREATE INDEX IF NOT EXISTS idx_case_animals_species ON case_animals(species);
CREATE INDEX IF NOT EXISTS idx_case_animals_litter ON case_animals(litter_id);
CREATE INDEX IF NOT EXISTS idx_case_animals_disposition ON case_animals(disposition);

CREATE INDEX IF NOT EXISTS idx_hotspots_location ON abandonment_hotspots(location_hash);
CREATE INDEX IF NOT EXISTS idx_hotspots_county ON abandonment_hotspots(county);

CREATE INDEX IF NOT EXISTS idx_transport_relays_status ON transport_relays(status);
CREATE INDEX IF NOT EXISTS idx_relay_legs_relay ON transport_relay_legs(relay_id);
CREATE INDEX IF NOT EXISTS idx_relay_legs_volunteer ON transport_relay_legs(volunteer_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_equipment_type ON volunteer_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_equipment_volunteer ON volunteer_equipment(volunteer_id);

-- ===================
-- TRIGGERS
-- ===================

-- Auto-update hotspot when case created at same location
CREATE OR REPLACE FUNCTION update_abandonment_hotspot()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_hash IS NOT NULL AND NEW.case_type IN ('ABANDONMENT', 'STRAY_LITTER') THEN
        INSERT INTO abandonment_hotspots (
            location_hash, location_lat, location_lng, 
            location_address, county, 
            first_incident_at, last_incident_at
        )
        VALUES (
            NEW.location_hash, NEW.location_lat, NEW.location_lng,
            NEW.location_address, NEW.location_county,
            NEW.reported_at, NEW.reported_at
        )
        ON CONFLICT (location_hash) DO UPDATE SET
            incident_count = abandonment_hotspots.incident_count + 1,
            last_incident_at = NEW.reported_at,
            is_flagged = (abandonment_hotspots.incident_count + 1) >= 3,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hotspot
    AFTER INSERT ON incident_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_abandonment_hotspot();

-- Auto-generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INT;
BEGIN
    year_part := to_char(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(case_number FROM '-(\d+)$') AS INT)
    ), 0) + 1
    INTO seq_num
    FROM incident_cases
    WHERE case_number LIKE 'PetMayday-' || year_part || '-%';
    
    NEW.case_number := 'PetMayday-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_case_number
    BEFORE INSERT ON incident_cases
    FOR EACH ROW
    WHEN (NEW.case_number IS NULL)
    EXECUTE FUNCTION generate_case_number();

-- Updated at triggers
CREATE TRIGGER incident_cases_updated_at
    BEFORE UPDATE ON incident_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

CREATE TRIGGER case_animals_updated_at
    BEFORE UPDATE ON case_animals
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- ===================
-- RLS POLICIES
-- ===================
ALTER TABLE incident_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE litters ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandonment_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_relays ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_relay_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_equipment ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view cases in their county
CREATE POLICY "View cases in county" ON incident_cases
    FOR SELECT USING (TRUE);  -- Public for now, restrict later

CREATE POLICY "View case animals" ON case_animals
    FOR SELECT USING (TRUE);

CREATE POLICY "View hotspots" ON abandonment_hotspots
    FOR SELECT USING (TRUE);

CREATE POLICY "View transport relays" ON transport_relays
    FOR SELECT USING (TRUE);

CREATE POLICY "View relay legs" ON transport_relay_legs
    FOR SELECT USING (TRUE);

CREATE POLICY "Volunteers manage own equipment" ON volunteer_equipment
    FOR ALL USING (volunteer_id = auth.uid());

-- ===================
-- COMMENTS
-- ===================
COMMENT ON TABLE incident_cases IS 'Master container for all animal incidents (single, litter, seizure, etc.)';
COMMENT ON TABLE case_animals IS 'Individual animals linked to an incident case';
COMMENT ON TABLE litters IS 'Quick-entry groups that can be split into individuals later';
COMMENT ON TABLE abandonment_hotspots IS 'Auto-tracked locations with repeat abandonment';
COMMENT ON TABLE transport_relays IS 'Long-distance transport coordination with multiple drivers';
COMMENT ON TABLE volunteer_equipment IS 'Equipment volunteers have for technical rescues';
