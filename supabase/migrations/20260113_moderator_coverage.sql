-- Moderator Coverage Area System
-- Allows SYSOP to assign moderators to geographic coverage areas

-- Coverage Areas table (counties, states, regions)
CREATE TABLE IF NOT EXISTS coverage_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_type text NOT NULL CHECK (area_type IN ('state', 'county', 'region')),
  state_code text NOT NULL,
  county_name text,
  region_name text,
  display_name text NOT NULL,
  population int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for coverage_areas
CREATE INDEX IF NOT EXISTS idx_coverage_areas_state ON coverage_areas(state_code);
CREATE INDEX IF NOT EXISTS idx_coverage_areas_type ON coverage_areas(area_type);
CREATE INDEX IF NOT EXISTS idx_coverage_areas_active ON coverage_areas(is_active);

-- Moderator Coverage Assignments
CREATE TABLE IF NOT EXISTS moderator_coverage_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coverage_area_id uuid NOT NULL REFERENCES coverage_areas(id) ON DELETE CASCADE,
  assignment_type text NOT NULL CHECK (assignment_type IN ('primary', 'backup', 'overflow')),
  priority int DEFAULT 1,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  notes text,
  
  UNIQUE(moderator_id, coverage_area_id)
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_mod_coverage_moderator ON moderator_coverage_assignments(moderator_id);
CREATE INDEX IF NOT EXISTS idx_mod_coverage_area ON moderator_coverage_assignments(coverage_area_id);
CREATE INDEX IF NOT EXISTS idx_mod_coverage_active ON moderator_coverage_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_coverage_type ON moderator_coverage_assignments(assignment_type);

-- Seed West Virginia Counties
INSERT INTO coverage_areas (area_type, state_code, county_name, display_name) VALUES
  ('county', 'WV', 'BARBOUR', 'Barbour County'),
  ('county', 'WV', 'BERKELEY', 'Berkeley County'),
  ('county', 'WV', 'BOONE', 'Boone County'),
  ('county', 'WV', 'BRAXTON', 'Braxton County'),
  ('county', 'WV', 'BROOKE', 'Brooke County'),
  ('county', 'WV', 'CABELL', 'Cabell County'),
  ('county', 'WV', 'CALHOUN', 'Calhoun County'),
  ('county', 'WV', 'CLAY', 'Clay County'),
  ('county', 'WV', 'DODDRIDGE', 'Doddridge County'),
  ('county', 'WV', 'FAYETTE', 'Fayette County'),
  ('county', 'WV', 'GILMER', 'Gilmer County'),
  ('county', 'WV', 'GRANT', 'Grant County'),
  ('county', 'WV', 'GREENBRIER', 'Greenbrier County'),
  ('county', 'WV', 'HAMPSHIRE', 'Hampshire County'),
  ('county', 'WV', 'HANCOCK', 'Hancock County'),
  ('county', 'WV', 'HARDY', 'Hardy County'),
  ('county', 'WV', 'HARRISON', 'Harrison County'),
  ('county', 'WV', 'JACKSON', 'Jackson County'),
  ('county', 'WV', 'JEFFERSON', 'Jefferson County'),
  ('county', 'WV', 'KANAWHA', 'Kanawha County'),
  ('county', 'WV', 'LEWIS', 'Lewis County'),
  ('county', 'WV', 'LINCOLN', 'Lincoln County'),
  ('county', 'WV', 'LOGAN', 'Logan County'),
  ('county', 'WV', 'MARION', 'Marion County'),
  ('county', 'WV', 'MARSHALL', 'Marshall County'),
  ('county', 'WV', 'MASON', 'Mason County'),
  ('county', 'WV', 'MCDOWELL', 'McDowell County'),
  ('county', 'WV', 'MERCER', 'Mercer County'),
  ('county', 'WV', 'MINERAL', 'Mineral County'),
  ('county', 'WV', 'MINGO', 'Mingo County'),
  ('county', 'WV', 'MONONGALIA', 'Monongalia County'),
  ('county', 'WV', 'MONROE', 'Monroe County'),
  ('county', 'WV', 'MORGAN', 'Morgan County'),
  ('county', 'WV', 'NICHOLAS', 'Nicholas County'),
  ('county', 'WV', 'OHIO', 'Ohio County'),
  ('county', 'WV', 'PENDLETON', 'Pendleton County'),
  ('county', 'WV', 'PLEASANTS', 'Pleasants County'),
  ('county', 'WV', 'POCAHONTAS', 'Pocahontas County'),
  ('county', 'WV', 'PRESTON', 'Preston County'),
  ('county', 'WV', 'PUTNAM', 'Putnam County'),
  ('county', 'WV', 'RALEIGH', 'Raleigh County'),
  ('county', 'WV', 'RANDOLPH', 'Randolph County'),
  ('county', 'WV', 'RITCHIE', 'Ritchie County'),
  ('county', 'WV', 'ROANE', 'Roane County'),
  ('county', 'WV', 'SUMMERS', 'Summers County'),
  ('county', 'WV', 'TAYLOR', 'Taylor County'),
  ('county', 'WV', 'TUCKER', 'Tucker County'),
  ('county', 'WV', 'TYLER', 'Tyler County'),
  ('county', 'WV', 'UPSHUR', 'Upshur County'),
  ('county', 'WV', 'WAYNE', 'Wayne County'),
  ('county', 'WV', 'WEBSTER', 'Webster County'),
  ('county', 'WV', 'WETZEL', 'Wetzel County'),
  ('county', 'WV', 'WIRT', 'Wirt County'),
  ('county', 'WV', 'WOOD', 'Wood County'),
  ('county', 'WV', 'WYOMING', 'Wyoming County')
ON CONFLICT DO NOTHING;

-- Add state-level coverage area for WV (for lead moderators)
INSERT INTO coverage_areas (area_type, state_code, county_name, display_name) VALUES
  ('state', 'WV', NULL, 'West Virginia (Statewide)')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_coverage_assignments ENABLE ROW LEVEL SECURITY;

-- Coverage areas are readable by authenticated users
CREATE POLICY "Coverage areas are viewable by authenticated users"
  ON coverage_areas FOR SELECT
  TO authenticated
  USING (true);

-- Assignments are viewable by the moderator or admins
CREATE POLICY "Assignments viewable by owner or admin"
  ON moderator_coverage_assignments FOR SELECT
  TO authenticated
  USING (
    moderator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'sysop')
    )
  );

-- Only admins/sysops can modify assignments
CREATE POLICY "Assignments modifiable by admin"
  ON moderator_coverage_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'sysop')
    )
  );

-- Function to get moderators for a county
CREATE OR REPLACE FUNCTION get_moderators_for_county(p_state_code text, p_county_name text)
RETURNS TABLE (
  moderator_id uuid,
  assignment_type text,
  priority int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mca.moderator_id,
    mca.assignment_type,
    mca.priority
  FROM moderator_coverage_assignments mca
  JOIN coverage_areas ca ON ca.id = mca.coverage_area_id
  WHERE ca.state_code = p_state_code
    AND (ca.county_name = p_county_name OR ca.area_type = 'state')
    AND mca.is_active = true
    AND ca.is_active = true
  ORDER BY 
    CASE mca.assignment_type 
      WHEN 'primary' THEN 1 
      WHEN 'backup' THEN 2 
      WHEN 'overflow' THEN 3 
    END,
    mca.priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
