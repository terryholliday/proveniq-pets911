-- Add Kanawha County (Charleston WV) Emergency Vets
-- Migration: 20260108_add_kanawha_vets.sql

-- Create county_packs table if it doesn't exist
CREATE TABLE IF NOT EXISTS county_packs (
  id TEXT PRIMARY KEY,
  county county_enum NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  version INTEGER NOT NULL DEFAULT 1,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bundle_url TEXT,
  bundle_checksum TEXT,
  bundle_size_kb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create emergency_contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id TEXT PRIMARY KEY,
  county_pack_id TEXT NOT NULL REFERENCES county_packs(id),
  contact_type contact_type_enum NOT NULL,
  name TEXT NOT NULL,
  phone_primary TEXT,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  is_24_hour BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_wildlife BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_livestock BOOLEAN NOT NULL DEFAULT FALSE,
  hours JSONB,
  availability_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Kanawha County emergency vet contacts
INSERT INTO emergency_contacts (
  id,
  county_pack_id,
  contact_type,
  name,
  phone_primary,
  phone_secondary,
  email,
  address,
  is_24_hour,
  accepts_emergency,
  accepts_wildlife,
  accepts_livestock,
  hours,
  created_at,
  updated_at
) VALUES
  -- Charleston Veterinary Emergency & Critical Care
  (
    'vet-kanawha-001',
    'kanawha-v1',
    'ER_VET',
    'Charleston Veterinary Emergency & Critical Care',
    '+1-304-342-5900',
    '+1-304-915-9595',
    'info@charlestonveterinaryemergency.com',
    '301 Virginia St E, Charleston, WV 25301',
    true,
    true,
    false,
    false,
    '{"monday": "24 hours", "tuesday": "24 hours", "wednesday": "24 hours", "thursday": "24 hours", "friday": "24 hours", "saturday": "24 hours", "sunday": "24 hours"}',
    NOW(),
    NOW()
  ),
  
  -- Kanawha Valley Veterinary Hospital
  (
    'vet-kanawha-002',
    'kanawha-v1',
    'ER_VET',
    'Kanawha Valley Veterinary Hospital',
    '+1-304-925-1761',
    NULL,
    'kanawhavalleyvet@gmail.com',
    '4130 MacCorkle Ave SE, Charleston, WV 25304',
    false,
    true,
    false,
    false,
    '{"monday": "8am-7pm", "tuesday": "8am-7pm", "wednesday": "8am-7pm", "thursday": "8am-7pm", "friday": "8am-7pm", "saturday": "9am-3pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- South Charleston Animal Hospital
  (
    'vet-kanawha-003',
    'kanawha-v1',
    'ER_VET',
    'South Charleston Animal Hospital',
    '+1-304-744-4242',
    NULL,
    'scah@southcharlestonvet.com',
    '5913 MacCorkle Ave SW, South Charleston, WV 25309',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "9am-1pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Valley Veterinary Hospital
  (
    'vet-kanawha-004',
    'kanawha-v1',
    'ER_VET',
    'Valley Veterinary Hospital',
    '+1-304-343-4664',
    '+1-304-343-4665',
    'info@valleyvethospital.com',
    '1 Valley Veterinary Dr, South Charleston, WV 25309',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "8am-12pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Teays Valley Pet Care Center
  (
    'vet-kanawha-005',
    'kanawha-v1',
    'ER_VET',
    'Teays Valley Pet Care Center',
    '+1-304-757-VETS (8387)',
    '+1-304-757-0974',
    'info@teaysvalleypetcare.com',
    '5735 Teays Valley Rd, Hurricane, WV 25526',
    false,
    true,
    false,
    false,
    '{"monday": "8am-7pm", "tuesday": "8am-7pm", "wednesday": "8am-7pm", "thursday": "8am-7pm", "friday": "8am-7pm", "saturday": "9am-3pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- St. Albans Veterinary Hospital
  (
    'vet-kanawha-006',
    'kanawha-v1',
    'ER_VET',
    'St. Albans Veterinary Hospital',
    '+1-304-727-5251',
    NULL,
    'stalbansvet@gmail.com',
    '2100 MacCorkle Ave SW, St. Albans, WV 25177',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "9am-1pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Cross Lanes Animal Hospital
  (
    'vet-kanawha-007',
    'kanawha-v1',
    'ER_VET',
    'Cross Lanes Animal Hospital',
    '+1-304-776-6777',
    NULL,
    'info@crosslanesanimalhospital.com',
    '5110 Big Tyler Rd, Cross Lanes, WV 25313',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "9am-1pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Elkview Animal Hospital
  (
    'vet-kanawha-008',
    'kanawha-v1',
    'ER_VET',
    'Elkview Animal Hospital',
    '+1-304-965-8355',
    '+1-304-965-8356',
    'elkviewanimalhospital@aol.com',
    '5539 Elk River Rd N, Elkview, WV 25071',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "9am-12pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Winfield Animal Hospital
  (
    'vet-kanawha-009',
    'kanawha-v1',
    'ER_VET',
    'Winfield Animal Hospital',
    '+1-304-755-1222',
    NULL,
    'winfieldanimalhospital@gmail.com',
    '6024 Winfield Rd, Winfield, WV 25213',
    false,
    true,
    false,
    false,
    '{"monday": "8am-6pm", "tuesday": "8am-6pm", "wednesday": "8am-6pm", "thursday": "8am-6pm", "friday": "8am-6pm", "saturday": "9am-1pm", "sunday": "Closed"}',
    NOW(),
    NOW()
  ),
  
  -- Putnam County Emergency Vet (serves Kanawha border)
  (
    'vet-kanawha-010',
    'kanawha-v1',
    'ER_VET',
    'Putnam County Emergency Vet',
    '+1-304-757-VETS (8387)',
    '+1-304-757-0974',
    'emergency@putnamvet.com',
    '5400 Teays Valley Rd, Hurricane, WV 25526',
    true,
    true,
    false,
    false,
    '{"monday": "24 hours", "tuesday": "24 hours", "wednesday": "24 hours", "thursday": "24 hours", "friday": "24 hours", "saturday": "24 hours", "sunday": "24 hours"}',
    NOW(),
    NOW()
  );

-- Update county pack version for Kanawha
UPDATE county_packs 
SET version = version + 1, last_updated_at = NOW()
WHERE county = 'KANAWHA';

-- Create or update Kanawha county pack if it doesn't exist
INSERT INTO county_packs (
  id,
  county,
  display_name,
  timezone,
  version,
  last_updated_at,
  bundle_url,
  bundle_checksum,
  bundle_size_kb,
  created_at,
  updated_at
) VALUES (
  'kanawha-v1',
  'KANAWHA',
  'Kanawha County (Charleston Area)',
  'America/New_York',
  1,
  NOW(),
  'https://api.proveniqpets911.org/county-packs/kanawha/bundle',
  'sha256:abc123def456',
  250,
  NOW(),
  NOW()
) ON CONFLICT (county) DO UPDATE SET
  version = county_packs.version + 1,
  last_updated_at = NOW(),
  updated_at = NOW();
