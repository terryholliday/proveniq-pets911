-- ============================================================
-- ADD MULTIPLE COVERAGE COUNTIES TO VOLUNTEERS
-- Allows volunteers to be assigned to multiple counties
-- ============================================================

-- Add coverage_counties array column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'volunteers' AND column_name = 'coverage_counties'
    ) THEN
        ALTER TABLE volunteers 
        ADD COLUMN coverage_counties TEXT[] DEFAULT '{}';
        
        COMMENT ON COLUMN volunteers.coverage_counties IS 
            'Additional counties this volunteer covers beyond primary_county';
    END IF;
END $$;

-- Create index for coverage county queries
CREATE INDEX IF NOT EXISTS idx_volunteers_coverage_counties 
ON volunteers USING GIN (coverage_counties);

-- Helper function to check if volunteer covers a county
CREATE OR REPLACE FUNCTION volunteer_covers_county(
    p_volunteer_id UUID,
    p_county TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_covers BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM volunteers 
        WHERE id = p_volunteer_id 
        AND (
            primary_county = p_county 
            OR p_county = ANY(coverage_counties)
        )
    ) INTO v_covers;
    
    RETURN v_covers;
END;
$$ LANGUAGE plpgsql;

-- View to get volunteers with all their coverage areas
CREATE OR REPLACE VIEW volunteer_coverage_view AS
SELECT 
    v.id,
    v.user_id,
    v.display_name,
    v.primary_county,
    v.coverage_counties,
    array_cat(ARRAY[v.primary_county], COALESCE(v.coverage_counties, '{}')) as all_counties,
    v.status,
    v.capabilities
FROM volunteers v
WHERE v.status IN ('ACTIVE', 'ON_MISSION');

COMMENT ON VIEW volunteer_coverage_view IS 
    'Volunteers with their complete coverage area (primary + additional counties)';
