-- ============================================================
-- ACO ACCOUNTABILITY SYSTEM
-- Purpose: Law-triggered ACO notification + outcome tracking
-- Legal Basis: WV §7-1-14, §7-10-4, §19-20-20, local ordinances
-- ============================================================

-- 1. ADD ACO_OFFICER TO USER ROLE ENUM
-- ============================================================
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ACO_OFFICER';

-- 2. ACO OFFICERS REGISTRY
-- ============================================================
CREATE TABLE IF NOT EXISTS aco_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Identity & Assignment
    county county_enum NOT NULL,
    agency_name TEXT NOT NULL DEFAULT 'Sheriff Department',
    badge_id TEXT,
    title TEXT DEFAULT 'Animal Control Officer',
    
    -- Contact (for notifications)
    phone TEXT,
    email TEXT,
    notification_preference TEXT NOT NULL DEFAULT 'SMS' CHECK (notification_preference IN ('SMS', 'EMAIL', 'BOTH', 'NONE')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED')),
    
    -- Shift/availability (optional for routing)
    available_shifts TEXT[] DEFAULT ARRAY['DAY', 'EVENING', 'NIGHT'],
    
    -- Metadata
    appointed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_aco_officers_county ON aco_officers(county);
CREATE INDEX IF NOT EXISTS idx_aco_officers_status ON aco_officers(status);
CREATE INDEX IF NOT EXISTS idx_aco_officers_user ON aco_officers(user_id);

-- 3. LAW TRIGGER CATEGORIES (intake checkboxes)
-- ============================================================
CREATE TYPE law_trigger_category_enum AS ENUM (
    -- Cruelty & Neglect (§7-10-4)
    'CRUELTY_SUSPECTED',
    'NEGLECT_SUSPECTED',
    'ABANDONMENT',
    'HOARDING_SITUATION',
    'INADEQUATE_SHELTER',
    'NO_FOOD_WATER',
    'MEDICAL_NEGLECT',
    
    -- Dangerous Animals (§19-20-20)
    'BITE_INCIDENT',
    'ATTACK_ON_HUMAN',
    'ATTACK_ON_ANIMAL',
    'AGGRESSIVE_BEHAVIOR',
    'VICIOUS_ANIMAL',
    'UNPROVOKED_AGGRESSION',
    
    -- Public Safety & Nuisance (§7-1-14)
    'AT_LARGE_HAZARD',
    'PUBLIC_NUISANCE',
    'TRAFFIC_HAZARD',
    'PACK_BEHAVIOR',
    'REPEATED_ESCAPE',
    
    -- Health & Welfare
    'INJURED_SEVERE',
    'INJURED_MODERATE',
    'SICK_CONTAGIOUS',
    'DECEASED_ANIMAL',
    'RABIES_EXPOSURE',
    
    -- Tethering & Confinement
    'TETHERING_VIOLATION',
    'INADEQUATE_CONFINEMENT',
    'EXTREME_WEATHER_EXPOSURE',
    
    -- Other
    'ILLEGAL_BREEDING',
    'EXOTIC_ANIMAL',
    'LIVESTOCK_AT_LARGE',
    'WILDLIFE_CONFLICT',
    'OTHER_LAW_CONCERN'
);

-- 4. LAW TRIGGER RULES (STATE defaults + COUNTY overrides)
-- ============================================================
CREATE TABLE IF NOT EXISTS law_trigger_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Identity
    rule_code TEXT NOT NULL UNIQUE,
    rule_name TEXT NOT NULL,
    description TEXT,
    
    -- Scope
    legal_basis TEXT NOT NULL CHECK (legal_basis IN ('STATE_LAW', 'COUNTY_ORDINANCE')),
    county county_enum, -- NULL = statewide (STATE_LAW default)
    
    -- Trigger conditions (which categories fire this rule)
    trigger_categories law_trigger_category_enum[] NOT NULL,
    
    -- Response requirements
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    response_sla_minutes INTEGER, -- NULL = no SLA
    requires_aco_dispatch BOOLEAN NOT NULL DEFAULT true,
    requires_immediate_response BOOLEAN NOT NULL DEFAULT false,
    
    -- Legal citations
    statute_citations TEXT[] NOT NULL DEFAULT '{}',
    ordinance_reference TEXT,
    
    -- Override logic
    is_stronger_than_state BOOLEAN NOT NULL DEFAULT false, -- For county rules that override state
    supersedes_rule_code TEXT, -- Which state rule this overrides
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_law_rules_county ON law_trigger_rules(county);
CREATE INDEX IF NOT EXISTS idx_law_rules_basis ON law_trigger_rules(legal_basis);
CREATE INDEX IF NOT EXISTS idx_law_rules_active ON law_trigger_rules(is_active) WHERE is_active = true;

-- 5. ADD TRIGGER FIELDS TO CASE TABLES
-- ============================================================

-- Missing pet case: add law trigger flags
ALTER TABLE missing_pet_case 
ADD COLUMN IF NOT EXISTS law_triggers law_trigger_category_enum[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aco_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aco_dispatch_id UUID;

-- Found animal case: add law trigger flags
ALTER TABLE found_animal_case
ADD COLUMN IF NOT EXISTS law_triggers law_trigger_category_enum[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aco_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aco_dispatch_id UUID;

-- Sighting: add law trigger flags
ALTER TABLE sighting
ADD COLUMN IF NOT EXISTS law_triggers law_trigger_category_enum[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aco_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aco_dispatch_id UUID;

-- 6. ACO DISPATCH REQUESTS (extends dispatch_requests)
-- ============================================================
-- Add ACO-specific fields to dispatch_requests
ALTER TABLE dispatch_requests
ADD COLUMN IF NOT EXISTS is_aco_dispatch BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS aco_officer_id UUID REFERENCES aco_officers(id),
ADD COLUMN IF NOT EXISTS legal_basis TEXT CHECK (legal_basis IN ('STATE_LAW', 'COUNTY_ORDINANCE')),
ADD COLUMN IF NOT EXISTS statute_citations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS law_triggers law_trigger_category_enum[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES law_trigger_rules(id),
ADD COLUMN IF NOT EXISTS source_case_type TEXT CHECK (source_case_type IN ('MISSING', 'FOUND', 'SIGHTING', 'EMERGENCY', 'DIRECT_REPORT')),
ADD COLUMN IF NOT EXISTS source_case_id UUID,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_code TEXT CHECK (resolution_code IN (
    'RESOLVED_ON_SCENE',
    'ANIMAL_SEIZED',
    'ANIMAL_IMPOUNDED',
    'OWNER_WARNED',
    'CITATION_ISSUED',
    'REFERRED_TO_PROSECUTOR',
    'NO_VIOLATION_FOUND',
    'UNABLE_TO_LOCATE',
    'OWNER_COMPLIED',
    'UNFOUNDED',
    'OTHER'
)),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_dispatch_aco ON dispatch_requests(is_aco_dispatch) WHERE is_aco_dispatch = true;
CREATE INDEX IF NOT EXISTS idx_dispatch_aco_officer ON dispatch_requests(aco_officer_id);

-- 7. ACO NOTIFICATION LOG (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS aco_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links
    dispatch_request_id UUID NOT NULL REFERENCES dispatch_requests(id) ON DELETE CASCADE,
    aco_officer_id UUID NOT NULL REFERENCES aco_officers(id),
    
    -- Notification details
    notification_type TEXT NOT NULL CHECK (notification_type IN ('SMS', 'EMAIL', 'PUSH', 'PHONE_CALL')),
    message_content TEXT,
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    
    -- Response
    response_action TEXT CHECK (response_action IN ('ACKNOWLEDGED', 'DISPATCHING', 'DECLINED', 'REASSIGNED')),
    response_notes TEXT,
    
    -- Provider tracking
    provider_message_id TEXT,
    provider_status TEXT,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aco_notifications_dispatch ON aco_notifications(dispatch_request_id);
CREATE INDEX IF NOT EXISTS idx_aco_notifications_officer ON aco_notifications(aco_officer_id);
CREATE INDEX IF NOT EXISTS idx_aco_notifications_sent ON aco_notifications(sent_at DESC);

-- 8. SEED STATE LAW RULES (WV defaults)
-- ============================================================
INSERT INTO law_trigger_rules (rule_code, rule_name, description, legal_basis, county, trigger_categories, priority, response_sla_minutes, requires_immediate_response, statute_citations) VALUES

-- Cruelty & Neglect (§7-10-4)
('WV_CRUELTY_001', 'Animal Cruelty - Magistrate Authority', 
 'Suspected cruelty, neglect, or abandonment requiring magistrate custody determination',
 'STATE_LAW', NULL,
 ARRAY['CRUELTY_SUSPECTED', 'NEGLECT_SUSPECTED', 'ABANDONMENT', 'HOARDING_SITUATION', 'MEDICAL_NEGLECT']::law_trigger_category_enum[],
 'HIGH', 240, false,
 ARRAY['§7-10-4']),

('WV_NEGLECT_001', 'Basic Needs Violation',
 'Animal lacking food, water, or adequate shelter',
 'STATE_LAW', NULL,
 ARRAY['NO_FOOD_WATER', 'INADEQUATE_SHELTER', 'EXTREME_WEATHER_EXPOSURE']::law_trigger_category_enum[],
 'HIGH', 120, false,
 ARRAY['§7-10-4', '§7-1-14']),

-- Dangerous Animals (§19-20-20)
('WV_VICIOUS_001', 'Vicious Dog - Immediate Response',
 'Vicious animal posing immediate threat to public safety',
 'STATE_LAW', NULL,
 ARRAY['VICIOUS_ANIMAL', 'ATTACK_ON_HUMAN', 'UNPROVOKED_AGGRESSION']::law_trigger_category_enum[],
 'CRITICAL', 30, true,
 ARRAY['§19-20-20']),

('WV_BITE_001', 'Bite Incident Investigation',
 'Animal bite requiring documentation and potential quarantine',
 'STATE_LAW', NULL,
 ARRAY['BITE_INCIDENT', 'RABIES_EXPOSURE']::law_trigger_category_enum[],
 'HIGH', 60, false,
 ARRAY['§19-20-20', '§19-20-22']),

('WV_AGGRESSION_001', 'Aggressive Animal Report',
 'Animal displaying aggressive behavior or attacking other animals',
 'STATE_LAW', NULL,
 ARRAY['AGGRESSIVE_BEHAVIOR', 'ATTACK_ON_ANIMAL', 'PACK_BEHAVIOR']::law_trigger_category_enum[],
 'MEDIUM', 240, false,
 ARRAY['§19-20-20']),

-- Public Safety & Nuisance (§7-1-14)
('WV_NUISANCE_001', 'Public Nuisance - County Authority',
 'Animal creating public nuisance or health/safety risk',
 'STATE_LAW', NULL,
 ARRAY['PUBLIC_NUISANCE', 'AT_LARGE_HAZARD', 'TRAFFIC_HAZARD', 'REPEATED_ESCAPE']::law_trigger_category_enum[],
 'MEDIUM', 480, false,
 ARRAY['§7-1-14']),

('WV_ATLARGE_001', 'Animal At Large',
 'Uncontrolled animal posing risk to public',
 'STATE_LAW', NULL,
 ARRAY['AT_LARGE_HAZARD', 'LIVESTOCK_AT_LARGE']::law_trigger_category_enum[],
 'MEDIUM', 240, false,
 ARRAY['§7-1-14', '§19-20-6']),

-- Health & Welfare
('WV_INJURED_001', 'Severely Injured Animal',
 'Animal requiring immediate veterinary intervention',
 'STATE_LAW', NULL,
 ARRAY['INJURED_SEVERE']::law_trigger_category_enum[],
 'CRITICAL', 30, true,
 ARRAY['§7-1-14']),

('WV_DECEASED_001', 'Deceased Animal - Public Health',
 'Deceased animal requiring removal for public health',
 'STATE_LAW', NULL,
 ARRAY['DECEASED_ANIMAL']::law_trigger_category_enum[],
 'LOW', 1440, false,
 ARRAY['§7-1-14']),

-- Tethering
('WV_TETHER_001', 'Tethering Violation',
 'Animal tethered in violation of local ordinance',
 'STATE_LAW', NULL,
 ARRAY['TETHERING_VIOLATION', 'INADEQUATE_CONFINEMENT']::law_trigger_category_enum[],
 'MEDIUM', 480, false,
 ARRAY['§7-1-14']),

-- Other
('WV_EXOTIC_001', 'Exotic/Wildlife Animal',
 'Exotic animal or wildlife conflict requiring specialized response',
 'STATE_LAW', NULL,
 ARRAY['EXOTIC_ANIMAL', 'WILDLIFE_CONFLICT']::law_trigger_category_enum[],
 'MEDIUM', 240, false,
 ARRAY['§7-1-14', '§20-2-4'])

ON CONFLICT (rule_code) DO NOTHING;

-- 9. SEED COUNTY-SPECIFIC OVERRIDES (stronger than state)
-- ============================================================

-- Kanawha County - Anti-tethering ordinance (stronger)
INSERT INTO law_trigger_rules (rule_code, rule_name, description, legal_basis, county, trigger_categories, priority, response_sla_minutes, is_stronger_than_state, supersedes_rule_code, statute_citations, ordinance_reference) VALUES
('KANAWHA_TETHER_001', 'Kanawha Anti-Tethering Ordinance',
 'Kanawha County has specific anti-tethering rules with shorter response requirements',
 'COUNTY_ORDINANCE', 'KANAWHA',
 ARRAY['TETHERING_VIOLATION', 'EXTREME_WEATHER_EXPOSURE']::law_trigger_category_enum[],
 'HIGH', 120, true, 'WV_TETHER_001',
 ARRAY['§7-1-14'],
 'Kanawha County Anti-Tethering Ordinance')
ON CONFLICT (rule_code) DO NOTHING;

-- Mercer County - 15-day harboring (finder immunity is stronger)
INSERT INTO law_trigger_rules (rule_code, rule_name, description, legal_basis, county, trigger_categories, priority, response_sla_minutes, is_stronger_than_state, statute_citations, ordinance_reference) VALUES
('MERCER_HARBOR_001', 'Mercer 15-Day Harboring Rule',
 'Mercer County allows 15-day finder harboring before ACO involvement required',
 'COUNTY_ORDINANCE', 'MERCER',
 ARRAY['AT_LARGE_HAZARD']::law_trigger_category_enum[],
 'LOW', 1440, true,
 ARRAY['§7-1-14'],
 'Mercer County 15-Day Harboring Ordinance')
ON CONFLICT (rule_code) DO NOTHING;

-- Monongalia County - Weather tethering (30 min max, stricter)
INSERT INTO law_trigger_rules (rule_code, rule_name, description, legal_basis, county, trigger_categories, priority, response_sla_minutes, is_stronger_than_state, supersedes_rule_code, statute_citations, ordinance_reference) VALUES
('MONONGALIA_WEATHER_001', 'Monongalia Adverse Weather Tethering',
 'Monongalia County: 30 minute max tethering in adverse weather',
 'COUNTY_ORDINANCE', 'MONONGALIA',
 ARRAY['TETHERING_VIOLATION', 'EXTREME_WEATHER_EXPOSURE']::law_trigger_category_enum[],
 'CRITICAL', 30, true, 'WV_TETHER_001',
 ARRAY['§7-1-14'],
 'Monongalia County Weather Tethering Ban')
ON CONFLICT (rule_code) DO NOTHING;

-- 10. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE aco_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_trigger_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE aco_notifications ENABLE ROW LEVEL SECURITY;

-- ACO officers can view their own record
CREATE POLICY "ACO officers view own profile" ON aco_officers
    FOR SELECT USING (user_id IN (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT));

-- Moderators/admins can manage all ACO officers
CREATE POLICY "Moderators manage ACO officers" ON aco_officers
    FOR ALL USING (is_moderator());

-- Public can read active law rules
CREATE POLICY "Public read law rules" ON law_trigger_rules
    FOR SELECT USING (is_active = true);

-- ACO officers can view their notifications
CREATE POLICY "ACO view own notifications" ON aco_notifications
    FOR SELECT USING (aco_officer_id IN (
        SELECT id FROM aco_officers WHERE user_id IN (
            SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT
        )
    ));

-- Moderators can view all notifications
CREATE POLICY "Moderators view all ACO notifications" ON aco_notifications
    FOR SELECT USING (is_moderator());

-- 11. HELPER FUNCTION: Evaluate law triggers
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_law_triggers(
    p_county county_enum,
    p_triggers law_trigger_category_enum[]
)
RETURNS TABLE (
    rule_id UUID,
    rule_code TEXT,
    rule_name TEXT,
    legal_basis TEXT,
    priority TEXT,
    response_sla_minutes INTEGER,
    requires_immediate_response BOOLEAN,
    statute_citations TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH county_rules AS (
        -- Get county-specific rules that match triggers
        SELECT r.*, 1 as precedence
        FROM law_trigger_rules r
        WHERE r.county = p_county
          AND r.is_active = true
          AND r.legal_basis = 'COUNTY_ORDINANCE'
          AND r.trigger_categories && p_triggers
          AND (r.effective_until IS NULL OR r.effective_until > NOW())
    ),
    state_rules AS (
        -- Get state rules that match triggers (not superseded by county rules)
        SELECT r.*, 2 as precedence
        FROM law_trigger_rules r
        WHERE r.county IS NULL
          AND r.is_active = true
          AND r.legal_basis = 'STATE_LAW'
          AND r.trigger_categories && p_triggers
          AND (r.effective_until IS NULL OR r.effective_until > NOW())
          AND NOT EXISTS (
              SELECT 1 FROM county_rules cr
              WHERE cr.is_stronger_than_state = true
                AND cr.supersedes_rule_code = r.rule_code
          )
    ),
    all_rules AS (
        SELECT * FROM county_rules
        UNION ALL
        SELECT * FROM state_rules
    )
    SELECT 
        ar.id,
        ar.rule_code,
        ar.rule_name,
        ar.legal_basis,
        ar.priority,
        ar.response_sla_minutes,
        ar.requires_immediate_response,
        ar.statute_citations
    FROM all_rules ar
    ORDER BY 
        CASE ar.priority 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
        END,
        ar.precedence;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER aco_officers_updated_at
    BEFORE UPDATE ON aco_officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER law_trigger_rules_updated_at
    BEFORE UPDATE ON law_trigger_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. GRANTS
-- ============================================================
GRANT ALL ON aco_officers TO service_role;
GRANT ALL ON law_trigger_rules TO service_role;
GRANT ALL ON aco_notifications TO service_role;

-- Documentation
COMMENT ON TABLE aco_officers IS 'Registry of Animal Control Officers by county. Part of Sheriff Department - full PII access.';
COMMENT ON TABLE law_trigger_rules IS 'Deterministic rules for ACO notification. STATE_LAW defaults, COUNTY_ORDINANCE can override when stronger.';
COMMENT ON TABLE aco_notifications IS 'Audit trail of all ACO notifications sent and responses received.';
COMMENT ON FUNCTION evaluate_law_triggers IS 'Evaluates which law rules apply given a county and set of trigger categories. Returns applicable rules in priority order.';
