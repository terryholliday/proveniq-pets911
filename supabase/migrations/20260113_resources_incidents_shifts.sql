-- ============================================================
-- RESOURCES, INCIDENTS, AND SHIFTS TABLES
-- Core operational tables for Pet911 moderator features
-- ============================================================

-- ============================================================
-- 1. EQUIPMENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('crate', 'carrier', 'trap', 'medical', 'other')),
    size TEXT CHECK (size IN ('small', 'medium', 'large', 'xlarge')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    location TEXT,
    county TEXT,
    
    -- Checkout tracking
    checked_out_to UUID REFERENCES volunteers(id),
    checked_out_at TIMESTAMPTZ,
    expected_return_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_county ON equipment(county);

-- ============================================================
-- 2. FOSTER HOMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS foster_homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    
    -- Capacity
    capacity INTEGER NOT NULL DEFAULT 1,
    current_animals INTEGER NOT NULL DEFAULT 0,
    
    -- Preferences
    species_ok TEXT[] DEFAULT '{}',
    sizes_ok TEXT[] DEFAULT '{}',
    special_needs_ok BOOLEAN DEFAULT FALSE,
    
    -- Availability
    available BOOLEAN DEFAULT TRUE,
    unavailable_until DATE,
    
    -- Location
    county TEXT NOT NULL,
    city TEXT,
    
    -- Stats
    total_placements INTEGER DEFAULT 0,
    last_placement_at TIMESTAMPTZ,
    avg_stay_days INTEGER,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(volunteer_id)
);

CREATE INDEX IF NOT EXISTS idx_foster_homes_available ON foster_homes(available) WHERE available = TRUE;
CREATE INDEX IF NOT EXISTS idx_foster_homes_county ON foster_homes(county);

-- ============================================================
-- 3. EMERGENCY FUND TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    type TEXT NOT NULL CHECK (type IN ('expense', 'donation', 'reimbursement', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    
    -- Approval workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Related records
    volunteer_id UUID REFERENCES volunteers(id),
    case_id UUID,
    
    -- Metadata
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON emergency_fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON emergency_fund_transactions(type);

-- ============================================================
-- 4. INCIDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number TEXT UNIQUE NOT NULL,
    
    -- Classification
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('safety', 'logistics', 'access', 'communication', 'animal_welfare', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    
    -- Location
    county TEXT,
    address TEXT,
    
    -- Details
    description TEXT NOT NULL,
    resolution_notes TEXT,
    
    -- People
    reported_by UUID REFERENCES auth.users(id),
    reporter_name TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Related records
    volunteer_id UUID REFERENCES volunteers(id),
    case_id UUID,
    
    -- Timeline
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_county ON incidents(county);

-- Generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.incident_number := 'INC-' || LPAD(NEXTVAL('incident_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS incident_number_seq START 1;

CREATE TRIGGER set_incident_number
    BEFORE INSERT ON incidents
    FOR EACH ROW
    WHEN (NEW.incident_number IS NULL)
    EXECUTE FUNCTION generate_incident_number();

-- ============================================================
-- 5. INCIDENT TIMELINE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    action TEXT NOT NULL,
    details TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_by_name TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident ON incident_timeline(incident_id);

-- ============================================================
-- 6. SAFETY ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    type TEXT NOT NULL CHECK (type IN ('dangerous_animal', 'weather', 'road_closure', 'property_access', 'other')),
    county TEXT NOT NULL,
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Validity
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    
    -- Related
    incident_id UUID REFERENCES incidents(id),
    created_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_alerts_active ON safety_alerts(active, county) WHERE active = TRUE;

-- ============================================================
-- 7. VOLUNTEER SHIFTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    
    -- Schedule
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Type
    shift_type TEXT NOT NULL DEFAULT 'regular' CHECK (shift_type IN ('regular', 'on_call', 'backup', 'training')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')),
    
    -- Coverage
    county TEXT,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_date ON volunteer_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_volunteer ON volunteer_shifts(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON volunteer_shifts(status);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE foster_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;

-- Moderators can view all records
CREATE POLICY "Moderators can view equipment"
    ON equipment FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

CREATE POLICY "Moderators can manage equipment"
    ON equipment FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Moderators can view incidents"
    ON incidents FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
        OR reported_by = auth.uid()
    );

CREATE POLICY "Volunteers can view their shifts"
    ON volunteer_shifts FOR SELECT
    USING (
        volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
        OR auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

-- ============================================================
-- 9. HELPER VIEWS
-- ============================================================
CREATE OR REPLACE VIEW equipment_summary AS
SELECT 
    type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available,
    COUNT(*) FILTER (WHERE status = 'checked_out') as checked_out,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance
FROM equipment
WHERE status != 'retired'
GROUP BY type;

CREATE OR REPLACE VIEW foster_capacity_summary AS
SELECT 
    county,
    COUNT(*) as total_homes,
    SUM(capacity) as total_capacity,
    SUM(current_animals) as current_animals,
    SUM(capacity - current_animals) FILTER (WHERE available = TRUE) as available_slots
FROM foster_homes
GROUP BY county;

CREATE OR REPLACE VIEW fund_balance AS
SELECT 
    COALESCE(SUM(CASE WHEN type = 'donation' THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type IN ('expense', 'reimbursement') AND status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) as balance,
    COALESCE(SUM(CASE WHEN type IN ('expense', 'reimbursement') AND status = 'pending' THEN amount ELSE 0 END), 0) as pending
FROM emergency_fund_transactions;

-- ============================================================
-- 10. SHIFT SWAP REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
    requesting_volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    target_volunteer_id UUID REFERENCES volunteers(id),
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
    reason TEXT,
    
    -- Response
    responded_at TIMESTAMPTZ,
    response_notes TEXT,
    
    -- Approval (if required)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_original ON shift_swap_requests(original_shift_id);

-- ============================================================
-- 11. EQUIPMENT CHECKOUT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_checkout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    
    checked_out_at TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    expected_return_at TIMESTAMPTZ,
    
    condition_out TEXT CHECK (condition_out IN ('excellent', 'good', 'fair', 'poor')),
    condition_in TEXT CHECK (condition_in IN ('excellent', 'good', 'fair', 'poor')),
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_history_equipment ON equipment_checkout_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_checkout_history_volunteer ON equipment_checkout_history(volunteer_id);

-- ============================================================
-- 12. SHIFT REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS shift_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24hr', '1hr', 'custom')),
    send_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    
    channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms', 'email', 'push', 'all')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_reminders_pending ON shift_reminders(send_at) WHERE status = 'pending';

-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foster_homes_updated_at BEFORE UPDATE ON foster_homes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at BEFORE UPDATE ON emergency_fund_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_alerts_updated_at BEFORE UPDATE ON safety_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_shifts_updated_at BEFORE UPDATE ON volunteer_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at BEFORE UPDATE ON shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. COMPLETE RLS POLICIES
-- ============================================================
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checkout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reminders ENABLE ROW LEVEL SECURITY;

-- Foster homes policies
CREATE POLICY "Moderators can view foster homes"
    ON foster_homes FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

CREATE POLICY "Volunteers can view own foster home"
    ON foster_homes FOR SELECT
    USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

-- Emergency fund policies
CREATE POLICY "Moderators can view fund transactions"
    ON emergency_fund_transactions FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
        OR requested_by = auth.uid()
    );

-- Safety alerts policies
CREATE POLICY "Anyone can view active alerts"
    ON safety_alerts FOR SELECT
    USING (active = TRUE);

CREATE POLICY "Moderators can manage alerts"
    ON safety_alerts FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

-- Incident timeline policies
CREATE POLICY "Moderators can view incident timeline"
    ON incident_timeline FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

-- Shift swap policies
CREATE POLICY "Volunteers can view own swap requests"
    ON shift_swap_requests FOR SELECT
    USING (
        requesting_volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
        OR target_volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
        OR auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
    );

-- Equipment checkout history policies
CREATE POLICY "Moderators can view checkout history"
    ON equipment_checkout_history FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM volunteers 
            WHERE 'MODERATOR' = ANY(capabilities) OR 'SYSOP' = ANY(capabilities)
        )
        OR volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
    );

-- Shift reminders policies
CREATE POLICY "Volunteers can view own reminders"
    ON shift_reminders FOR SELECT
    USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

-- ============================================================
-- 15. COVERAGE ANALYSIS VIEW
-- ============================================================
CREATE OR REPLACE VIEW shift_coverage_analysis AS
SELECT 
    shift_date,
    county,
    COUNT(*) as total_shifts,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_shifts,
    COUNT(*) FILTER (WHERE status = 'scheduled') as pending_shifts,
    COUNT(DISTINCT volunteer_id) as unique_volunteers,
    MIN(start_time) as earliest_start,
    MAX(end_time) as latest_end
FROM volunteer_shifts
WHERE shift_date >= CURRENT_DATE
GROUP BY shift_date, county
ORDER BY shift_date, county;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE equipment IS 'Transport crates, carriers, traps, and medical supplies';
COMMENT ON TABLE foster_homes IS 'Foster home capacity and availability tracking';
COMMENT ON TABLE emergency_fund_transactions IS 'Emergency fund expenses, donations, and reimbursements';
COMMENT ON TABLE incidents IS 'Operational incidents and safety concerns';
COMMENT ON TABLE safety_alerts IS 'Active safety warnings for specific locations';
COMMENT ON TABLE volunteer_shifts IS 'Volunteer scheduling and shift management';
COMMENT ON TABLE shift_swap_requests IS 'Shift trade requests between volunteers';
COMMENT ON TABLE equipment_checkout_history IS 'Audit trail of equipment checkouts';
COMMENT ON TABLE shift_reminders IS 'Automated shift reminder notifications';
