-- ============================================================
-- DISPATCH_911 ROLE + SHIFT HANDOFF SYSTEM
-- Purpose: After-hours routing + accountability for who's on duty
-- ============================================================

-- 1. ADD DISPATCH_911 TO USER ROLE ENUM
-- ============================================================
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'DISPATCH_911';

-- 2. 911 DISPATCH CENTERS REGISTRY
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_911_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    county county_enum NOT NULL,
    center_name TEXT NOT NULL,
    
    -- Contact
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    
    -- Operating hours (when ACO routes to 911)
    after_hours_start TIME NOT NULL DEFAULT '17:00', -- 5pm
    after_hours_end TIME NOT NULL DEFAULT '08:00',   -- 8am
    handles_weekends BOOLEAN NOT NULL DEFAULT true,
    handles_holidays BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(county)
);

-- 3. 911 DISPATCHER ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_911_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES dispatch_911_centers(id) ON DELETE CASCADE,
    
    -- Identity
    display_name TEXT NOT NULL,
    badge_id TEXT,
    
    -- Contact (for system notifications)
    phone TEXT,
    email TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_911_operators_center ON dispatch_911_operators(center_id);
CREATE INDEX IF NOT EXISTS idx_911_operators_status ON dispatch_911_operators(status);

-- 4. SHIFT HANDOFF LOG (append-only audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS aco_shift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county county_enum NOT NULL,
    
    -- Who handed off
    from_officer_id UUID REFERENCES aco_officers(id),
    from_911_operator_id UUID REFERENCES dispatch_911_operators(id),
    from_role TEXT NOT NULL CHECK (from_role IN ('ACO_OFFICER', 'DISPATCH_911', 'SHERIFF', 'SYSTEM')),
    
    -- Who received responsibility
    to_officer_id UUID REFERENCES aco_officers(id),
    to_911_operator_id UUID REFERENCES dispatch_911_operators(id),
    to_role TEXT NOT NULL CHECK (to_role IN ('ACO_OFFICER', 'DISPATCH_911', 'SHERIFF')),
    
    -- Timing
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Reason
    reason TEXT NOT NULL CHECK (reason IN (
        'END_OF_SHIFT',
        'START_OF_SHIFT', 
        'AFTER_HOURS_AUTO',
        'BUSINESS_HOURS_AUTO',
        'EMERGENCY_COVERAGE',
        'VACATION',
        'SICK_LEAVE',
        'MANUAL_OVERRIDE'
    )),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: no updates or deletes
CREATE RULE no_update_shift_log AS ON UPDATE TO aco_shift_log DO INSTEAD NOTHING;
CREATE RULE no_delete_shift_log AS ON DELETE TO aco_shift_log DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_shift_log_county ON aco_shift_log(county);
CREATE INDEX IF NOT EXISTS idx_shift_log_effective ON aco_shift_log(effective_at DESC);

-- 5. CURRENT ON-DUTY VIEW
-- ============================================================
CREATE OR REPLACE VIEW current_on_duty AS
SELECT DISTINCT ON (county)
    county,
    to_role as current_role,
    to_officer_id as aco_officer_id,
    to_911_operator_id as dispatcher_id,
    effective_at as on_duty_since,
    reason as last_handoff_reason
FROM aco_shift_log
ORDER BY county, effective_at DESC;

-- 6. HELPER FUNCTION: Get current on-duty for county
-- ============================================================
CREATE OR REPLACE FUNCTION get_on_duty(p_county county_enum)
RETURNS TABLE (
    current_role TEXT,
    aco_officer_id UUID,
    dispatcher_id UUID,
    on_duty_since TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.to_role,
        sl.to_officer_id,
        sl.to_911_operator_id,
        sl.effective_at
    FROM aco_shift_log sl
    WHERE sl.county = p_county
    ORDER BY sl.effective_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. HELPER FUNCTION: Check if currently after-hours
-- ============================================================
CREATE OR REPLACE FUNCTION is_after_hours(p_county county_enum)
RETURNS BOOLEAN AS $$
DECLARE
    v_center dispatch_911_centers%ROWTYPE;
    v_current_time TIME;
    v_current_dow INTEGER;
BEGIN
    SELECT * INTO v_center FROM dispatch_911_centers WHERE county = p_county;
    
    IF NOT FOUND THEN
        RETURN false; -- No 911 center configured, assume business hours
    END IF;
    
    v_current_time := LOCALTIME;
    v_current_dow := EXTRACT(DOW FROM CURRENT_DATE); -- 0=Sunday, 6=Saturday
    
    -- Check weekends
    IF v_current_dow IN (0, 6) AND v_center.handles_weekends THEN
        RETURN true;
    END IF;
    
    -- Check after-hours (handles overnight spans)
    IF v_center.after_hours_start > v_center.after_hours_end THEN
        -- Overnight span (e.g., 17:00 to 08:00)
        IF v_current_time >= v_center.after_hours_start OR v_current_time < v_center.after_hours_end THEN
            RETURN true;
        END IF;
    ELSE
        -- Same-day span
        IF v_current_time >= v_center.after_hours_start AND v_current_time < v_center.after_hours_end THEN
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. HELPER FUNCTION: Record shift handoff
-- ============================================================
CREATE OR REPLACE FUNCTION record_shift_handoff(
    p_county county_enum,
    p_from_role TEXT,
    p_from_officer_id UUID,
    p_from_911_id UUID,
    p_to_role TEXT,
    p_to_officer_id UUID,
    p_to_911_id UUID,
    p_reason TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO aco_shift_log (
        county,
        from_role, from_officer_id, from_911_operator_id,
        to_role, to_officer_id, to_911_operator_id,
        reason, notes
    ) VALUES (
        p_county,
        p_from_role, p_from_officer_id, p_from_911_id,
        p_to_role, p_to_officer_id, p_to_911_id,
        p_reason, p_notes
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 9. SEED 911 CENTERS FOR PILOT COUNTIES
-- ============================================================
INSERT INTO dispatch_911_centers (county, center_name, phone) VALUES
('GREENBRIER', 'Greenbrier County 911 Center', '304-647-7911'),
('KANAWHA', 'Kanawha County Metro 911', '304-348-8111')
ON CONFLICT (county) DO NOTHING;

-- 10. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE dispatch_911_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_911_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE aco_shift_log ENABLE ROW LEVEL SECURITY;

-- Public can read 911 centers
CREATE POLICY "Public read 911 centers" ON dispatch_911_centers
    FOR SELECT USING (is_active = true);

-- 911 operators can view their own record
CREATE POLICY "911 operators view own profile" ON dispatch_911_operators
    FOR SELECT USING (user_id IN (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT));

-- Moderators manage all
CREATE POLICY "Moderators manage 911 centers" ON dispatch_911_centers
    FOR ALL USING (is_moderator());

CREATE POLICY "Moderators manage 911 operators" ON dispatch_911_operators
    FOR ALL USING (is_moderator());

-- Shift log readable by moderators and ACO/911 roles
CREATE POLICY "Authorized read shift log" ON aco_shift_log
    FOR SELECT USING (
        is_moderator() OR
        EXISTS (SELECT 1 FROM aco_officers WHERE user_id IN (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT)) OR
        EXISTS (SELECT 1 FROM dispatch_911_operators WHERE user_id IN (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT))
    );

-- Only service role can insert shift logs (via API)
CREATE POLICY "Service insert shift log" ON aco_shift_log
    FOR INSERT WITH CHECK (true); -- Controlled via service role

-- 11. GRANTS
-- ============================================================
GRANT ALL ON dispatch_911_centers TO service_role;
GRANT ALL ON dispatch_911_operators TO service_role;
GRANT ALL ON aco_shift_log TO service_role;

-- 12. TRIGGERS
-- ============================================================
CREATE TRIGGER dispatch_911_centers_updated_at
    BEFORE UPDATE ON dispatch_911_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER dispatch_911_operators_updated_at
    BEFORE UPDATE ON dispatch_911_operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Documentation
COMMENT ON TABLE dispatch_911_centers IS '911 dispatch centers that handle after-hours ACO calls by county.';
COMMENT ON TABLE dispatch_911_operators IS '911 dispatchers who can acknowledge/route ACO dispatches after hours.';
COMMENT ON TABLE aco_shift_log IS 'Append-only audit trail of ACO/911 shift handoffs. Proves who was on duty at any given time.';
COMMENT ON VIEW current_on_duty IS 'Shows who is currently on duty for each county.';
COMMENT ON FUNCTION is_after_hours IS 'Returns true if current time falls within after-hours for the given county.';
