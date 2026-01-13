-- ============================================================
-- PARTNER APPLICATIONS TABLE
-- Stores applications from shelters, rescues, and NGOs
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Info
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN (
        'shelter', 'rescue', 'humane_society', 'veterinary', 
        'transport', 'foster_network', 'other'
    )),
    county TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    
    -- Contact Info
    contact_name TEXT NOT NULL,
    contact_title TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    website TEXT,
    ein TEXT,
    
    -- Operations
    year_established TEXT,
    annual_intake TEXT,
    services TEXT[] DEFAULT '{}',
    has_physical_location BOOLEAN DEFAULT true,
    operating_hours TEXT,
    staff_count TEXT,
    volunteer_count TEXT,
    
    -- Goals
    current_challenges TEXT,
    partnership_goals TEXT NOT NULL,
    how_did_you_hear TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'approved', 'rejected', 'onboarded'
    )),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_county ON partner_applications(county);
CREATE INDEX IF NOT EXISTS idx_partner_applications_submitted ON partner_applications(submitted_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_partner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_applications_updated_at
    BEFORE UPDATE ON partner_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_applications_updated_at();

-- RLS Policies
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (insert)
CREATE POLICY "Anyone can submit partner application"
    ON partner_applications
    FOR INSERT
    WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view partner applications"
    ON partner_applications
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'sysop', 'moderator')
        )
    );

-- Only admins can update applications
CREATE POLICY "Admins can update partner applications"
    ON partner_applications
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'sysop')
        )
    );

COMMENT ON TABLE partner_applications IS 'Applications from shelters, rescues, and NGOs to partner with PetMayday';
