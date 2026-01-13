-- ============================================================
-- RENAME organizations → partner_organizations
-- Standardizes table naming for partner-related entities
-- ============================================================

-- 1. Rename the table (only if it exists and hasn't been renamed yet)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        ALTER TABLE organizations RENAME TO partner_organizations;
    END IF;
END $$;

-- 2. Rename the trigger function to match (only if old name exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_organizations_updated_at') THEN
        ALTER FUNCTION update_organizations_updated_at() RENAME TO update_partner_organizations_updated_at;
    END IF;
END $$;

-- 3. Drop old trigger and recreate with new name
DROP TRIGGER IF EXISTS organizations_updated_at ON partner_organizations;

-- Only create if the function exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_partner_organizations_updated_at') THEN
        DROP TRIGGER IF EXISTS partner_organizations_updated_at ON partner_organizations;
        CREATE TRIGGER partner_organizations_updated_at
            BEFORE UPDATE ON partner_organizations
            FOR EACH ROW
            EXECUTE FUNCTION update_partner_organizations_updated_at();
    END IF;
END $$;

-- 4. Rename indexes (only if old names exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_county') THEN
        ALTER INDEX idx_organizations_county RENAME TO idx_partner_organizations_county;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_status') THEN
        ALTER INDEX idx_organizations_status RENAME TO idx_partner_organizations_status;
    END IF;
END $$;

-- 5. Update RLS policy names (drop and recreate)
DROP POLICY IF EXISTS "Users can view their organization" ON partner_organizations;

-- Only create policy if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_organizations' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view their partner organization" ON partner_organizations;
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
    END IF;
END $$;

-- 6. Update comments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_organizations' AND table_schema = 'public') THEN
        COMMENT ON TABLE partner_organizations IS 'Approved partner organizations (shelters, rescues, etc.)';
    END IF;
END $$;

-- Note: partner_users.organization_id foreign key automatically follows the rename
