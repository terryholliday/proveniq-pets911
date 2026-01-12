-- Expand volunteer counties to all WV counties for statewide onboarding
-- Dispatch operations remain limited to ACTIVE_DISPATCH_COUNTIES in application code

-- Drop existing constraint on volunteers table
ALTER TABLE volunteers DROP CONSTRAINT IF EXISTS volunteers_primary_county_check;

-- Add new constraint with all WV counties
ALTER TABLE volunteers ADD CONSTRAINT volunteers_primary_county_check 
CHECK (primary_county IN (
  'BARBOUR', 'BERKELEY', 'BOONE', 'BRAXTON', 'BROOKE',
  'CABELL', 'CALHOUN', 'CLAY', 'DODDRIDGE', 'FAYETTE',
  'GILMER', 'GRANT', 'GREENBRIER', 'HAMPSHIRE', 'HANCOCK',
  'HARDY', 'HARRISON', 'JACKSON', 'JEFFERSON', 'KANAWHA',
  'LEWIS', 'LINCOLN', 'LOGAN', 'MARION', 'MARSHALL',
  'MASON', 'MCDOWELL', 'MERCER', 'MINERAL', 'MINGO',
  'MONONGALIA', 'MONROE', 'MORGAN', 'NICHOLAS', 'OHIO',
  'PENDLETON', 'PLEASANTS', 'POCAHONTAS', 'PRESTON', 'PUTNAM',
  'RALEIGH', 'RANDOLPH', 'RITCHIE', 'ROANE', 'SUMMERS',
  'TAYLOR', 'TUCKER', 'TYLER', 'UPSHUR', 'WAYNE',
  'WEBSTER', 'WETZEL', 'WIRT', 'WOOD', 'WYOMING'
));

-- Also update dispatch_requests county constraint
ALTER TABLE dispatch_requests DROP CONSTRAINT IF EXISTS dispatch_requests_county_check;

ALTER TABLE dispatch_requests ADD CONSTRAINT dispatch_requests_county_check 
CHECK (county IN (
  'BARBOUR', 'BERKELEY', 'BOONE', 'BRAXTON', 'BROOKE',
  'CABELL', 'CALHOUN', 'CLAY', 'DODDRIDGE', 'FAYETTE',
  'GILMER', 'GRANT', 'GREENBRIER', 'HAMPSHIRE', 'HANCOCK',
  'HARDY', 'HARRISON', 'JACKSON', 'JEFFERSON', 'KANAWHA',
  'LEWIS', 'LINCOLN', 'LOGAN', 'MARION', 'MARSHALL',
  'MASON', 'MCDOWELL', 'MERCER', 'MINERAL', 'MINGO',
  'MONONGALIA', 'MONROE', 'MORGAN', 'NICHOLAS', 'OHIO',
  'PENDLETON', 'PLEASANTS', 'POCAHONTAS', 'PRESTON', 'PUTNAM',
  'RALEIGH', 'RANDOLPH', 'RITCHIE', 'ROANE', 'SUMMERS',
  'TAYLOR', 'TUCKER', 'TYLER', 'UPSHUR', 'WAYNE',
  'WEBSTER', 'WETZEL', 'WIRT', 'WOOD', 'WYOMING'
));

-- Add comment for operational clarity
COMMENT ON COLUMN volunteers.primary_county IS 'Volunteer primary county (all WV counties allowed). Active dispatch areas controlled in application code.';
