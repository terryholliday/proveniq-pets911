-- ============================================================
-- RENAME organizations → partner_organizations
-- Standardizes table naming for partner-related entities
-- ============================================================

-- 1. Rename the table
ALTER TABLE IF EXISTS organizations RENAME TO partner_organizations;

-- 2. Rename the trigger function to match
ALTER FUNCTION IF EXISTS update_organizations_updated_at() RENAME TO update_partner_organizations_updated_at;

-- 3. Drop old trigger and recreate with new name
DROP TRIGGER IF EXISTS organizations_updated_at ON partner_organizations;

CREATE TRIGGER partner_organizations_updated_at
    BEFORE UPDATE ON partner_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_organizations_updated_at();

-- 4. Rename indexes
ALTER INDEX IF EXISTS idx_organizations_county RENAME TO idx_partner_organizations_county;
ALTER INDEX IF EXISTS idx_organizations_status RENAME TO idx_partner_organizations_status;

-- 5. Update RLS policy names (drop and recreate)
DROP POLICY IF EXISTS "Users can view their organization" ON partner_organizations;

CREATE POLICY "Users can view their partner organization"
    ON partner_organizations
    FOR SELECT
    USING (
        id IN (SELECT organization_id FROM partner_users WHERE user_id = auth.uid())
        OR auth.uid() IN (
            SELECT v.user_id FROM volunteers v 
            WHERE 'SYSOP' = ANY(v.capabilities) OR 'MODERATOR' = ANY(v.capabilities)
        )
    );

-- 6. Update comments
COMMENT ON TABLE partner_organizations IS 'Approved partner organizations (shelters, rescues, etc.)';

-- Note: partner_users.organization_id foreign key automatically follows the rename
