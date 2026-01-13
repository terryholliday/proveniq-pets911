-- ============================================================
-- PARTNER USERS & ORGANIZATIONS TABLES
-- Links users with PARTNER capability to their organizations
-- ============================================================

-- Organizations table (approved partners)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'shelter', 'rescue', 'humane_society', 'veterinary', 
        'transport', 'foster_network', 'other'
    )),
    county TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    verified_at TIMESTAMPTZ,
    
    -- Link to original application (if applicable)
    application_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partner users table (links users to organizations)
CREATE TABLE IF NOT EXISTS partner_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Role within organization
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'viewer')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Metadata
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure user can only be linked to one org at a time
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_county ON organizations(county);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_org_id ON partner_users(organization_id);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

CREATE OR REPLACE FUNCTION update_partner_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_users_updated_at
    BEFORE UPDATE ON partner_users
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_users_updated_at();

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;

-- Organizations: viewable by linked users and admins
CREATE POLICY "Users can view their organization"
    ON organizations
    FOR SELECT
    USING (
        id IN (SELECT organization_id FROM partner_users WHERE user_id = auth.uid())
        OR auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'sysop')
        )
    );

-- Partner users: users can view their own record
CREATE POLICY "Users can view their partner link"
    ON partner_users
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can manage partner users
CREATE POLICY "Admins can manage partner users"
    ON partner_users
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'sysop')
        )
    );

-- Comments
COMMENT ON TABLE organizations IS 'Approved partner organizations (shelters, rescues, etc.)';
COMMENT ON TABLE partner_users IS 'Links users to their partner organization';

-- ============================================================
-- HELPER FUNCTION: Assign user as partner
-- Called from sysop admin when approving a partner
-- ============================================================
CREATE OR REPLACE FUNCTION assign_partner_to_organization(
    p_user_id UUID,
    p_organization_id UUID,
    p_role TEXT DEFAULT 'staff'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_volunteer_exists BOOLEAN;
BEGIN
    -- Check if volunteer record exists
    SELECT EXISTS(SELECT 1 FROM volunteers WHERE user_id = p_user_id) INTO v_volunteer_exists;
    
    IF v_volunteer_exists THEN
        -- Add PARTNER capability to existing volunteer
        UPDATE volunteers 
        SET capabilities = array_append(
            COALESCE(capabilities, '{}'), 
            'PARTNER'
        )
        WHERE user_id = p_user_id
        AND NOT ('PARTNER' = ANY(capabilities));
    ELSE
        -- Create volunteer record with PARTNER capability
        INSERT INTO volunteers (user_id, status, capabilities)
        VALUES (p_user_id, 'ACTIVE', ARRAY['PARTNER']::text[]);
    END IF;
    
    -- Link user to organization
    INSERT INTO partner_users (user_id, organization_id, role, status, accepted_at)
    VALUES (p_user_id, p_organization_id, p_role, 'active', NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        organization_id = p_organization_id,
        role = p_role,
        status = 'active',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_partner_to_organization IS 'Assigns a user to a partner organization and grants PARTNER capability';
