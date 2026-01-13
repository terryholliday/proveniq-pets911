-- ============================================================
-- COUNTY COMPLIANCE DATA MIGRATION
-- Source: "State of the Stray" Research Document (2026)
-- All 55 West Virginia Counties with Pet911 Compliance Scores
-- ============================================================

-- Create county compliance table
CREATE TABLE IF NOT EXISTS county_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    
    -- Enforcement Structure
    enforcement_agency TEXT NOT NULL CHECK (enforcement_agency IN (
        'DEDICATED_ANIMAL_CONTROL',
        'HUMANE_SOCIETY_CONTRACT', 
        'SHERIFF_WARDEN',
        'JOINT_AUTHORITY',
        'PRIVATIZED'
    )),
    enforcement_agency_name TEXT NOT NULL,
    shelter_facility TEXT,
    has_dedicated_shelter BOOLEAN NOT NULL DEFAULT true,
    shared_facility_with TEXT[], -- Array of county names
    
    -- Legal Framework
    harboring_days INTEGER NOT NULL DEFAULT 5,
    stray_hold_days INTEGER NOT NULL DEFAULT 5,
    has_anti_tethering BOOLEAN NOT NULL DEFAULT false,
    has_mandatory_microchip BOOLEAN NOT NULL DEFAULT false,
    has_spay_neuter_mandate BOOLEAN NOT NULL DEFAULT false,
    has_tnr_program BOOLEAN NOT NULL DEFAULT false,
    
    -- Pet911 Compliance Pillars
    compliance_tier TEXT NOT NULL CHECK (compliance_tier IN ('GOLD', 'SILVER', 'BRONZE', 'NON_COMPLIANT')),
    pillar_universal_scanning BOOLEAN NOT NULL DEFAULT false,
    pillar_digital_transparency BOOLEAN NOT NULL DEFAULT false,
    pillar_extended_holding BOOLEAN NOT NULL DEFAULT false,
    pillar_finder_immunity BOOLEAN NOT NULL DEFAULT false,
    
    -- Operational Notes
    ordinance_notes TEXT,
    special_programs TEXT[],
    
    -- Contact Info
    primary_phone TEXT,
    website_url TEXT,
    
    -- Metadata
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source TEXT NOT NULL DEFAULT 'State of the Stray Research 2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for compliance tier queries
CREATE INDEX IF NOT EXISTS idx_county_compliance_tier ON county_compliance(compliance_tier);
CREATE INDEX IF NOT EXISTS idx_county_compliance_county ON county_compliance(county);

-- Insert all 55 WV counties

-- GOLD TIER COUNTIES
INSERT INTO county_compliance (county, display_name, enforcement_agency, enforcement_agency_name, shelter_facility, has_dedicated_shelter, harboring_days, stray_hold_days, has_anti_tethering, has_mandatory_microchip, has_spay_neuter_mandate, has_tnr_program, compliance_tier, pillar_universal_scanning, pillar_digital_transparency, pillar_extended_holding, pillar_finder_immunity, ordinance_notes, special_programs)
VALUES
('KANAWHA', 'Kanawha County', 'HUMANE_SOCIETY_CONTRACT', 'Kanawha Charleston Humane Association (KCHA)', 'KCHA Shelter', true, 5, 5, true, false, false, true, 'GOLD', true, true, true, false, 'Anti-tethering ordinance; high Pet911 compliance. Adoption reservation system. PILOT COUNTY.', ARRAY['Adoption Reservation System', 'Anti-Tethering Ordinance', 'Pet911 Pilot Program']),

('CABELL', 'Cabell County', 'JOINT_AUTHORITY', 'Huntington Cabell Wayne Animal Control', 'Huntington Cabell Wayne Shelter', true, 5, 5, true, false, false, false, 'GOLD', true, true, true, false, 'Joint Authority with Wayne; Zero unnecessary euthanasia since 2018. $50 reclaim fee.', ARRAY['No-Kill Initiative', 'Joint Authority Model']),

('HARRISON', 'Harrison County', 'SHERIFF_WARDEN', 'Dog Warden', 'Harrison County Animal Control', true, 5, 5, false, true, true, false, 'GOLD', true, true, false, false, 'MANDATORY Microchipping for reclaims ($5); Spay/neuter on 3rd impound; 3-year vax recognized.', ARRAY['Mandatory Chip Program', 'Commercial Dog Breeding Ordinance']),

('MERCER', 'Mercer County', 'DEDICATED_ANIMAL_CONTROL', 'Animal Control', 'Mercer County Animal Shelter', true, 15, 5, false, false, true, false, 'GOLD', false, true, false, true, '15-DAY HARBORING RULE (Gold Standard for finder immunity); Spay/Neuter ordinance with intact permit option.', ARRAY['15-Day Finder Immunity', 'Spay/Neuter Mandate']);

-- SILVER TIER COUNTIES
INSERT INTO county_compliance (county, display_name, enforcement_agency, enforcement_agency_name, shelter_facility, has_dedicated_shelter, harboring_days, stray_hold_days, has_anti_tethering, has_mandatory_microchip, has_spay_neuter_mandate, has_tnr_program, compliance_tier, pillar_universal_scanning, pillar_digital_transparency, pillar_extended_holding, pillar_finder_immunity, ordinance_notes, special_programs, shared_facility_with)
VALUES
('GREENBRIER', 'Greenbrier County', 'HUMANE_SOCIETY_CONTRACT', 'Greenbrier Humane Society', 'Greenbrier Humane Society', true, 5, 5, false, false, false, false, 'SILVER', true, true, false, false, 'Strong partnership with private humane society. PILOT COUNTY.', ARRAY['Pet911 Pilot Program'], NULL),

('MONONGALIA', 'Monongalia County', 'DEDICATED_ANIMAL_CONTROL', 'Monongalia County Canine Adoption Center', 'Monongalia County Canine Adoption Center (MCCAC)', true, 3, 5, true, false, false, false, 'SILVER', true, true, false, false, '3-day harboring rule; strict weather tethering bans (30 min max adverse weather). 24/5 coverage with 6 wardens.', ARRAY['Weather Tethering Ban', 'Dangerous Dog Ordinance'], NULL),

('BERKELEY', 'Berkeley County', 'DEDICATED_ANIMAL_CONTROL', 'Animal Control (County)', 'Berkeley County Animal Shelter', true, 3, 5, false, false, false, true, 'SILVER', false, true, false, false, '3-day harboring rule; progressive TNR policy (Free Roaming Cat Program).', ARRAY['Free Roaming Cat Program (TNR)'], NULL),

('BROOKE', 'Brooke County', 'SHERIFF_WARDEN', 'Dog Warden', 'Brooke County Animal Shelter', true, 5, 5, false, false, false, false, 'SILVER', false, true, false, false, 'Strict leash law enforcement; zero tolerance cruelty policy.', ARRAY['Zero Tolerance Cruelty Policy'], NULL),

('JEFFERSON', 'Jefferson County', 'HUMANE_SOCIETY_CONTRACT', 'Animal Welfare Society (Contract)', 'Briggs Animal Adoption Center', true, 5, 5, false, false, false, false, 'SILVER', true, true, false, false, 'High compliance; strong licensing enforcement ($3/$6). National Humane Education Society presence.', ARRAY['Strong Licensing Program'], NULL),

('MARION', 'Marion County', 'HUMANE_SOCIETY_CONTRACT', 'Marion County Humane Society', 'Marion County Humane Society', true, 5, 5, false, false, false, false, 'SILVER', false, true, true, false, 'No-Kill facility; strong adoption and rescue transfer focus.', ARRAY['No-Kill Facility'], NULL),

('WOOD', 'Wood County', 'PRIVATIZED', 'Humane Society of Parkersburg', 'Humane Society of Parkersburg', true, 5, 5, false, false, false, false, 'SILVER', true, true, false, false, 'PRIVATIZED enforcement; Shelter officers have police powers. 24-hour emergency response. Noisy dog fines up to $100.', ARRAY['24-Hour Emergency Response', 'Privatized Enforcement Model'], NULL),

('WAYNE', 'Wayne County', 'JOINT_AUTHORITY', 'HCW Control Board', 'Huntington Cabell Wayne Shelter', true, 5, 5, true, false, false, false, 'SILVER', true, true, true, false, 'Joint Authority with Cabell; see Cabell notes.', ARRAY['Joint Authority Model'], ARRAY['CABELL']);

-- BRONZE TIER COUNTIES
INSERT INTO county_compliance (county, display_name, enforcement_agency, enforcement_agency_name, shelter_facility, has_dedicated_shelter, harboring_days, stray_hold_days, has_anti_tethering, has_mandatory_microchip, has_spay_neuter_mandate, has_tnr_program, compliance_tier, pillar_universal_scanning, pillar_digital_transparency, pillar_extended_holding, pillar_finder_immunity, ordinance_notes, special_programs, website_url)
VALUES
('BARBOUR', 'Barbour County', 'SHERIFF_WARDEN', 'Dog Warden', 'Barbour County Animal Control', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Follows state code; 5-day hold.', ARRAY[]::TEXT[], 'https://barbourcountywv.gov/animal-control/'),

('FAYETTE', 'Fayette County', 'DEDICATED_ANIMAL_CONTROL', 'Animal Control', 'County Shelter', true, 3, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Oak Hill has specific "fed or sheltered" 3-day definitions.', ARRAY[]::TEXT[], NULL),

('GRANT', 'Grant County', 'SHERIFF_WARDEN', 'Assessor/Warden', 'County Pound', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Strict license tax collection ($3 county/$6 city).', ARRAY[]::TEXT[], NULL),

('HANCOCK', 'Hancock County', 'SHERIFF_WARDEN', 'Dog Warden/Humane Officer', 'Hancock County Animal Shelter', true, 5, 5, false, false, false, false, 'BRONZE', false, true, false, false, 'Emergency service available; focus on cruelty/neglect. Enforces estrus confinement (§ 19-20-22).', ARRAY['Emergency Response Service'], NULL),

('MORGAN', 'Morgan County', 'DEDICATED_ANIMAL_CONTROL', 'Animal Control', 'County Shelter', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Focus on outdoor enclosure standards.', ARRAY['Outdoor Enclosure Standards'], NULL),

('OHIO', 'Ohio County', 'HUMANE_SOCIETY_CONTRACT', 'Ohio County SPCA', 'Ohio County SPCA', true, 5, 5, false, false, false, false, 'BRONZE', false, true, false, false, 'Specific "vicious dog" and noise ordinances.', ARRAY['Vicious Dog Ordinance'], NULL),

('POCAHONTAS', 'Pocahontas County', 'SHERIFF_WARDEN', 'Sheriff (Designee)', 'Pocahontas County Animal Shelter', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Sheriff designates wardens; focus on leash laws. Exempts hunting and farm dogs.', ARRAY[]::TEXT[], NULL),

('PUTNAM', 'Putnam County', 'DEDICATED_ANIMAL_CONTROL', 'Animal Services', 'Putnam County Animal Shelter', true, 5, 5, false, false, false, false, 'BRONZE', false, true, false, false, '"Adopt a Kennel" program; focus on sustainable care.', ARRAY['Adopt a Kennel Program'], NULL),

('RALEIGH', 'Raleigh County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'Raleigh County Humane Society', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, '"One dog at large per 12hr" rule prevents stacked fines. Nuisance barking ordinance.', ARRAY['12-Hour Escape Rule'], NULL),

('RITCHIE', 'Ritchie County', 'HUMANE_SOCIETY_CONTRACT', 'Ritchie County Humane Society', 'Ritchie County Humane Society', true, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'Contracted shelter services.', ARRAY[]::TEXT[], NULL),

('WIRT', 'Wirt County', 'SHERIFF_WARDEN', 'Sheriff / Warden', NULL, false, 5, 5, false, false, false, false, 'BRONZE', false, false, false, false, 'New leash law (2025); reliance on Sheriff for enforcement. No dedicated shelter.', ARRAY['Updated Leash Law 2025'], NULL);

-- NON-COMPLIANT COUNTIES (State Code Defaults)
INSERT INTO county_compliance (county, display_name, enforcement_agency, enforcement_agency_name, shelter_facility, has_dedicated_shelter, harboring_days, stray_hold_days, compliance_tier, ordinance_notes, shared_facility_with)
VALUES
('BOONE', 'Boone County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('BRAXTON', 'Braxton County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('CALHOUN', 'Calhoun County', 'SHERIFF_WARDEN', 'Sheriff Dept', NULL, false, 5, 5, 'NON_COMPLIANT', 'No dedicated shelter. Relies on State Code § 19-20-6; transport to neighboring facilities often required.', NULL),
('CLAY', 'Clay County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('DODDRIDGE', 'Doddridge County', 'HUMANE_SOCIETY_CONTRACT', 'Humane Officer', NULL, false, 5, 5, 'NON_COMPLIANT', 'Roles often consolidated with law enforcement.', NULL),
('GILMER', 'Gilmer County', 'SHERIFF_WARDEN', 'Sheriff / Warden', NULL, false, 5, 5, 'NON_COMPLIANT', 'No dedicated shelter. City of Glenville has specific "chaining/tying" transport laws.', NULL),
('HAMPSHIRE', 'Hampshire County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('HARDY', 'Hardy County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('JACKSON', 'Jackson County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('LEWIS', 'Lewis County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'Lewis-Upshur Control Facility', true, 5, 5, 'NON_COMPLIANT', 'Shared facility with Upshur; standard state hours.', ARRAY['UPSHUR']),
('LINCOLN', 'Lincoln County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('LOGAN', 'Logan County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MARSHALL', 'Marshall County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MASON', 'Mason County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MCDOWELL', 'McDowell County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MINERAL', 'Mineral County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MINGO', 'Mingo County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('MONROE', 'Monroe County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('NICHOLAS', 'Nicholas County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('PENDLETON', 'Pendleton County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('PLEASANTS', 'Pleasants County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('PRESTON', 'Preston County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('RANDOLPH', 'Randolph County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('ROANE', 'Roane County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('SUMMERS', 'Summers County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('TAYLOR', 'Taylor County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('TUCKER', 'Tucker County', 'SHERIFF_WARDEN', 'Dog Warden', 'Tucker County Dog Pound', true, 5, 5, 'NON_COMPLIANT', 'Basic pound services; limited hours.', NULL),
('TYLER', 'Tyler County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code.', NULL),
('UPSHUR', 'Upshur County', 'SHERIFF_WARDEN', 'Warden', 'Lewis-Upshur Control Facility', true, 5, 5, 'NON_COMPLIANT', 'Shared facility with Lewis; efficient resource pooling.', ARRAY['LEWIS']),
('WEBSTER', 'Webster County', 'SHERIFF_WARDEN', 'City Control', 'County Shelter', true, 3, 5, 'NON_COMPLIANT', 'City-level control dominates; 3-day harboring implied. $50 pickup fee.', NULL),
('WETZEL', 'Wetzel County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'Wetzel County Animal Shelter', true, 5, 5, 'NON_COMPLIANT', 'Basic shelter operations.', NULL),
('WYOMING', 'Wyoming County', 'SHERIFF_WARDEN', 'Sheriff / Warden', 'County Shelter', true, 5, 5, 'NON_COMPLIANT', 'Defaults to State Code; nuisance animal focus.', NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_county_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER county_compliance_updated_at
    BEFORE UPDATE ON county_compliance
    FOR EACH ROW
    EXECUTE FUNCTION update_county_compliance_updated_at();

-- Create view for compliance summary statistics
CREATE OR REPLACE VIEW county_compliance_summary AS
SELECT 
    compliance_tier,
    COUNT(*) as county_count,
    COUNT(*) FILTER (WHERE has_dedicated_shelter) as with_shelter,
    COUNT(*) FILTER (WHERE has_anti_tethering) as with_anti_tethering,
    COUNT(*) FILTER (WHERE has_mandatory_microchip) as with_mandatory_chip,
    COUNT(*) FILTER (WHERE pillar_finder_immunity) as with_finder_immunity,
    COUNT(*) FILTER (WHERE pillar_universal_scanning) as with_scanning
FROM county_compliance
GROUP BY compliance_tier
ORDER BY 
    CASE compliance_tier 
        WHEN 'GOLD' THEN 1 
        WHEN 'SILVER' THEN 2 
        WHEN 'BRONZE' THEN 3 
        ELSE 4 
    END;

-- Add comment for documentation
COMMENT ON TABLE county_compliance IS 'Pet911 compliance data for all 55 WV counties. Source: State of the Stray Research Document (2026).';
