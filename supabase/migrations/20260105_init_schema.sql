-- PROVENIQ PETS (WV) — INITIALIZATION SCHEMA (v1.0.0)
-- Authoritatively synchronized with CANONICAL_LAW.md and RETENTION_ACCESS.md
-- Target: Supabase (Postgres 15+)

-- #############################################################################
-- # 1. ENUMS
-- #############################################################################

CREATE TYPE county_enum AS ENUM (
  'GREENBRIER',
  'KANAWHA'
);

CREATE TYPE species_enum AS ENUM (
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'REPTILE',
  'SMALL_MAMMAL',
  'LIVESTOCK',
  'OTHER'
);

CREATE TYPE case_status_enum AS ENUM (
  'ACTIVE',
  'PENDING_VERIFY',
  'MATCHED',
  'CLOSED_REUNITED',
  'CLOSED_ADOPTED',
  'CLOSED_DECEASED',
  'CLOSED_EXPIRED',
  'CLOSED_DUPLICATE',
  'LOCKED'
);

CREATE TYPE contact_type_enum AS ENUM (
  'ER_VET',
  'SHELTER',
  'ANIMAL_CONTROL',
  'DISPATCH',
  'RESCUE_ORG',
  'OTHER'
);

CREATE TYPE notification_status_enum AS ENUM (
  'QUEUED',
  'ATTEMPTED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'EXPIRED'
);

CREATE TYPE mod_action_type_enum AS ENUM (
  'LOCK_CASE',
  'UNLOCK_CASE',
  'ESCALATE_TO_SHELTER',
  'CONFIRM_MATCH',
  'REJECT_MATCH',
  'RELEASE_CONTACT',
  'MERGE_CASES',
  'ADD_NOTE',
  'FLAG_ABUSE',
  'CLOSE_CASE'
);

CREATE TYPE municipal_outcome_enum AS ENUM (
  'OFFICER_DISPATCHED',
  'CALLBACK_PROMISED',
  'NO_ANSWER',
  'REFERRED_ELSEWHERE',
  'DECLINED',
  'UNKNOWN'
);

CREATE TYPE user_role_enum AS ENUM (
  'PUBLIC_USER',
  'OWNER',
  'FINDER',
  'PIGPIG_MODERATOR',
  'SHELTER_MODERATOR',
  'SYSTEM_ADMIN'
);

CREATE TYPE custodian_type_enum AS ENUM (
  'OWNER',
  'SHELTER',
  'RESCUER',
  'VET'
);

CREATE TYPE reward_entry_type_enum AS ENUM (
  'REGISTRATION',
  'ANNUAL_SCAN',
  'REUNIFICATION'
);

CREATE TYPE metrics_action_enum AS ENUM (
  'CASE_CREATED_MISSING',
  'CASE_CREATED_FOUND',
  'SIGHTING_REPORTED',
  'ER_VET_NOTIFY_SENT',
  'MUNICIPAL_CALL_LOGGED',
  'MATCH_CONFIRMED',
  'MATCH_REJECTED',
  'CASE_CLOSED'
);

CREATE TYPE sync_status_enum AS ENUM (
  'PENDING',
  'SYNCING',
  'SYNCED',
  'FAILED',
  'CONFLICT'
);

-- #############################################################################
-- # 2. FUNCTIONS & TRIGGERS
-- #############################################################################

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- #############################################################################
-- # 3. INFRASTRUCTURE LAYER
-- #############################################################################

CREATE TABLE county_pack (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county          county_enum NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  version         INTEGER NOT NULL DEFAULT 1,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bundle_url      TEXT,
  bundle_checksum TEXT,
  bundle_size_kb  INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_contact (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_pack_id  UUID NOT NULL REFERENCES county_pack(id),
  contact_type    contact_type_enum NOT NULL,
  name            TEXT NOT NULL,
  phone_primary   TEXT,
  phone_secondary TEXT,
  email           TEXT,
  address         TEXT,
  is_24_hour      BOOLEAN NOT NULL DEFAULT FALSE,
  hours_json      JSONB,
  accepts_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_wildlife  BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_livestock BOOLEAN NOT NULL DEFAULT FALSE,
  opted_in_email_notify BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_emergency_contact_updated_at
BEFORE UPDATE ON emergency_contact
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE aco_availability_override (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_pack_id  UUID NOT NULL REFERENCES county_pack(id),
  override_type   TEXT NOT NULL,
  reason          TEXT,
  alternate_phone TEXT,
  alternate_name  TEXT,
  effective_from  TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ NOT NULL,
  created_by      UUID, -- Corresponds to user_profile.id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- #############################################################################
-- # 4. USER LAYER
-- #############################################################################

CREATE TABLE user_profile (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid        TEXT NOT NULL UNIQUE,
  display_name        TEXT,
  email               TEXT,
  phone               TEXT,
  role                user_role_enum NOT NULL DEFAULT 'PUBLIC_USER',
  sms_opt_in          BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  primary_county      county_enum,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ
);

CREATE TRIGGER update_user_profile_updated_at
BEFORE UPDATE ON user_profile
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- #############################################################################
-- # 5. REGISTRY LAYER
-- #############################################################################

CREATE TABLE pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species         species_enum NOT NULL,
  name            TEXT NOT NULL,
  dob             DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE microchips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code        TEXT NOT NULL UNIQUE,
  manufacturer    TEXT,
  activated_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE pet_chip_link (
  pet_id          UUID NOT NULL REFERENCES pets(id),
  chip_id         UUID NOT NULL REFERENCES microchips(id),
  linked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_immutable    BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (pet_id, chip_id)
);

-- Safeguard: Prevent updating or deleting pet_chip_link if is_immutable is true
CREATE RULE no_update_immutable_link AS ON UPDATE TO pet_chip_link 
  WHERE OLD.is_immutable = TRUE DO INSTEAD NOTHING;
CREATE RULE no_delete_immutable_link AS ON DELETE TO pet_chip_link 
  WHERE OLD.is_immutable = TRUE DO INSTEAD NOTHING;

CREATE TABLE custodians (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            custodian_type_enum NOT NULL,
  user_id         UUID REFERENCES user_profile(id),
  hashed_identity_ref TEXT,
  name            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custody_history (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets(id),
  custodian_id    UUID NOT NULL REFERENCES custodians(id),
  role            TEXT NOT NULL,
  effective_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to    TIMESTAMPTZ,
  notes           TEXT
);

CREATE TABLE verification_events (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id         UUID NOT NULL REFERENCES microchips(id),
  verified_by     UUID NOT NULL REFERENCES custodians(id),
  method          TEXT NOT NULL,
  verified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only safeguards for verification_events
CREATE RULE no_update_verification AS ON UPDATE TO verification_events DO INSTEAD NOTHING;
CREATE RULE no_delete_verification AS ON DELETE TO verification_events DO INSTEAD NOTHING;

CREATE TABLE lost_found_events (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets(id),
  status          TEXT NOT NULL,
  reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- #############################################################################
-- # 5.5 HOMEWARD REWARDS
-- #############################################################################

CREATE TABLE homeward_entries (
  entry_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id         UUID NOT NULL REFERENCES microchips(id),
  entry_type      reward_entry_type_enum NOT NULL,
  period          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drawings (
  drawing_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period          TEXT NOT NULL,
  conducted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method_hash     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prizes (
  prize_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL,
  value_cap       DECIMAL(10,2) NOT NULL CHECK (value_cap <= 250),
  restricted_use  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE winners (
  winner_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id      UUID NOT NULL REFERENCES drawings(drawing_id),
  entry_id        UUID NOT NULL REFERENCES homeward_entries(entry_id),
  notified_at     TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- #############################################################################
-- # 6. CASE LAYER
-- #############################################################################

CREATE TABLE missing_pet_case (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES user_profile(id),
  pet_name          TEXT NOT NULL,
  species           species_enum NOT NULL,
  breed             TEXT,
  color_primary     TEXT,
  color_secondary   TEXT,
  distinguishing_features TEXT,
  weight_lbs        DECIMAL(5,1),
  age_years         DECIMAL(3,1),
  sex               TEXT,
  is_neutered       BOOLEAN,
  microchip_id      TEXT,
  photo_urls        TEXT[],
  last_seen_at      TIMESTAMPTZ NOT NULL,
  last_seen_lat     DECIMAL(9,6),
  last_seen_lng     DECIMAL(9,6),
  last_seen_address TEXT,
  last_seen_notes   TEXT,
  county            county_enum NOT NULL,
  status            case_status_enum NOT NULL DEFAULT 'ACTIVE',
  assigned_moderator_id UUID REFERENCES user_profile(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER update_missing_pet_case_updated_at
BEFORE UPDATE ON missing_pet_case
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE found_animal_case (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id         UUID NOT NULL REFERENCES user_profile(id),
  species           species_enum NOT NULL,
  breed_guess       TEXT,
  color_primary     TEXT,
  color_secondary   TEXT,
  distinguishing_features TEXT,
  weight_lbs_estimate DECIMAL(5,1),
  age_estimate      TEXT,
  sex               TEXT,
  has_collar        BOOLEAN,
  collar_description TEXT,
  microchip_scanned BOOLEAN NOT NULL DEFAULT FALSE,
  microchip_id      TEXT,
  condition_notes   TEXT,
  needs_immediate_vet BOOLEAN NOT NULL DEFAULT FALSE,
  photo_urls        TEXT[],
  found_at          TIMESTAMPTZ NOT NULL,
  found_lat         DECIMAL(9,6),
  found_lng         DECIMAL(9,6),
  found_address     TEXT,
  found_notes       TEXT,
  current_location_type TEXT,
  current_location_id UUID REFERENCES emergency_contact(id),
  current_location_notes TEXT,
  county            county_enum NOT NULL,
  status            case_status_enum NOT NULL DEFAULT 'ACTIVE',
  shelter_intake_id TEXT,
  shelter_intake_at TIMESTAMPTZ,
  assigned_moderator_id UUID REFERENCES user_profile(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER update_found_animal_case_updated_at
BEFORE UPDATE ON found_animal_case
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE sighting (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID REFERENCES user_profile(id),
  reporter_name     TEXT,
  reporter_phone    TEXT,
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  sighting_at       TIMESTAMPTZ NOT NULL,
  sighting_lat      DECIMAL(9,6),
  sighting_lng      DECIMAL(9,6),
  sighting_address  TEXT,
  description       TEXT,
  direction_heading TEXT,
  animal_behavior   TEXT,
  confidence_level  TEXT NOT NULL DEFAULT 'UNSURE',
  photo_url         TEXT,
  county            county_enum NOT NULL,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by       UUID REFERENCES user_profile(id),
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE match_suggestion (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  missing_case_id     UUID NOT NULL REFERENCES missing_pet_case(id),
  found_case_id       UUID NOT NULL REFERENCES found_animal_case(id),
  confidence_score    DECIMAL(4,3) NOT NULL,
  scoring_factors     JSONB,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  resolved_by         UUID REFERENCES user_profile(id),
  resolved_at         TIMESTAMPTZ,
  resolution_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(missing_case_id, found_case_id)
);

-- #############################################################################
-- # 6. ACTION LAYER
-- #############################################################################

CREATE TABLE moderator_action (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id    UUID NOT NULL REFERENCES user_profile(id),
  missing_case_id UUID REFERENCES missing_pet_case(id),
  found_case_id   UUID REFERENCES found_animal_case(id),
  match_id        UUID REFERENCES match_suggestion(id),
  target_user_id  UUID REFERENCES user_profile(id),
  action_type     mod_action_type_enum NOT NULL,
  action_data     JSONB,
  notes           TEXT,
  consent_method  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_mod_action_target CHECK (
    missing_case_id IS NOT NULL OR 
    found_case_id IS NOT NULL OR 
    match_id IS NOT NULL OR 
    target_user_id IS NOT NULL
  )
);

CREATE TABLE emergency_vet_notify_attempt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  found_case_id     UUID REFERENCES found_animal_case(id),
  initiated_by      UUID NOT NULL REFERENCES user_profile(id),
  contact_id        UUID NOT NULL REFERENCES emergency_contact(id),
  email_status      notification_status_enum,
  email_provider_id TEXT,
  email_sent_at     TIMESTAMPTZ,
  email_error       TEXT,
  voice_status      notification_status_enum,
  voice_provider_id TEXT,
  voice_initiated_at TIMESTAMPTZ,
  voice_duration_sec INTEGER,
  voice_answered    BOOLEAN,
  voice_error       TEXT,
  message_summary   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_emergency_vet_notify_attempt_updated_at
BEFORE UPDATE ON emergency_vet_notify_attempt
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE municipal_interaction_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  missing_case_id   UUID REFERENCES missing_pet_case(id),
  found_case_id     UUID REFERENCES found_animal_case(id),
  initiated_by      UUID NOT NULL REFERENCES user_profile(id),
  contact_id        UUID REFERENCES emergency_contact(id),
  contact_name      TEXT NOT NULL,
  contact_phone     TEXT NOT NULL,
  dialer_initiated_at TIMESTAMPTZ NOT NULL,
  call_duration_sec   INTEGER,
  outcome           municipal_outcome_enum NOT NULL,
  outcome_notes     TEXT,
  outcome_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_notify_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_provider_id TEXT,
  email_status      notification_status_enum,
  script_version    TEXT,
  county            county_enum NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- #############################################################################
-- # 7. TELEMETRY LAYER
-- #############################################################################

CREATE TABLE pilot_metrics_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_taken    metrics_action_enum NOT NULL,
  case_id         UUID,
  case_type       TEXT,
  contact_id      UUID,
  match_id        UUID,
  county          county_enum NOT NULL,
  outcome         TEXT,
  metadata        JSONB,
  actor_role      user_role_enum,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent any updates or deletes to the metrics log
CREATE RULE no_update_pilot_metrics AS ON UPDATE TO pilot_metrics_log DO INSTEAD NOTHING;
CREATE RULE no_delete_pilot_metrics AS ON DELETE TO pilot_metrics_log DO INSTEAD NOTHING;

CREATE TABLE offline_queued_action (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key     UUID NOT NULL UNIQUE,
  action_type         TEXT NOT NULL,
  payload             JSONB NOT NULL,
  user_id             UUID NOT NULL REFERENCES user_profile(id),
  device_id           TEXT,
  sync_status         sync_status_enum NOT NULL DEFAULT 'PENDING',
  sync_attempts       INTEGER NOT NULL DEFAULT 0,
  last_sync_attempt   TIMESTAMPTZ,
  sync_error          TEXT,
  resolved_entity_id  UUID,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- #############################################################################
-- # 8. INDEXES
-- #############################################################################

CREATE INDEX idx_county_pack_county ON county_pack(county);
CREATE INDEX idx_emergency_contact_county ON emergency_contact(county_pack_id);
CREATE INDEX idx_emergency_contact_type ON emergency_contact(contact_type);
CREATE INDEX idx_emergency_contact_active ON emergency_contact(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_aco_override_active ON aco_availability_override(effective_from, effective_until);
CREATE UNIQUE INDEX idx_user_firebase ON user_profile(firebase_uid);
CREATE INDEX idx_user_role ON user_profile(role);
CREATE INDEX idx_missing_case_owner ON missing_pet_case(owner_id);
CREATE INDEX idx_missing_case_county ON missing_pet_case(county);
CREATE INDEX idx_missing_case_status ON missing_pet_case(status);
CREATE INDEX idx_missing_case_active ON missing_pet_case(status, county) WHERE status = 'ACTIVE';
CREATE INDEX idx_found_case_finder ON found_animal_case(finder_id);
CREATE INDEX idx_found_case_county ON found_animal_case(county);
CREATE INDEX idx_found_case_status ON found_animal_case(status);
CREATE INDEX idx_found_case_active ON found_animal_case(status, county) WHERE status = 'ACTIVE';
CREATE INDEX idx_sighting_case ON sighting(missing_case_id);
CREATE INDEX idx_sighting_unlinked ON sighting(county, created_at) WHERE missing_case_id IS NULL;
CREATE INDEX idx_match_pending ON match_suggestion(status) WHERE status = 'PENDING';
CREATE INDEX idx_mod_action_time ON moderator_action(created_at DESC);
CREATE INDEX idx_er_notify_time ON emergency_vet_notify_attempt(created_at DESC);
CREATE INDEX idx_municipal_time ON municipal_interaction_log(created_at DESC);
CREATE INDEX idx_metrics_time ON pilot_metrics_log(timestamp DESC);
CREATE INDEX idx_offline_pending ON offline_queued_action(sync_status) WHERE sync_status = 'PENDING';

-- Registry Indexes
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_custodian_user ON custodians(user_id);
CREATE INDEX idx_custody_pet ON custody_history(pet_id);
CREATE INDEX idx_custody_current ON custody_history(pet_id) WHERE effective_to IS NULL;
CREATE INDEX idx_verification_chip ON verification_events(chip_id);
CREATE INDEX idx_lf_pet_status ON lost_found_events(pet_id, status);

-- Homeward Rewards Indexes
CREATE INDEX idx_reward_entry_chip ON homeward_entries(chip_id);
CREATE INDEX idx_winner_drawing ON winners(drawing_id);
CREATE UNIQUE INDEX idx_winner_entry ON winners(entry_id);

-- #############################################################################
-- # 9. ROW-LEVEL SECURITY (RLS)
-- #############################################################################

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE county_pack ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE aco_availability_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_pet_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_animal_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_suggestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_vet_notify_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_metrics_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queued_action ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Registry Tables
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE microchips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_chip_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE custodians ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Rewards Tables
ALTER TABLE homeward_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Help function to get current user ID from firebase_uid
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID AS $$
    SELECT id FROM user_profile WHERE firebase_uid = auth.uid()::TEXT;
$$ LANGUAGE sql STABLE;

-- Help function to check if user has admin/moderator role
CREATE OR REPLACE FUNCTION is_moderator() 
RETURNS BOOLEAN AS $$
    SELECT role IN ('PIGPIG_MODERATOR', 'SHELTER_MODERATOR', 'SYSTEM_ADMIN') 
    FROM user_profile WHERE firebase_uid = auth.uid()::TEXT;
$$ LANGUAGE sql STABLE;

-- ## 9.1 county_pack policies
CREATE POLICY "public_read_county_pack" ON county_pack FOR SELECT USING (true);

-- ## 9.2 emergency_contact policies
CREATE POLICY "public_read_emergency_contact" ON emergency_contact FOR SELECT USING (true);
CREATE POLICY "moderator_manage_emergency_contact" ON emergency_contact FOR ALL 
USING (is_moderator()) WITH CHECK (is_moderator());

-- ## 9.3 user_profile policies
CREATE POLICY "users_read_own_profile" ON user_profile FOR SELECT USING (firebase_uid = auth.uid()::TEXT);
CREATE POLICY "users_update_own_profile" ON user_profile FOR UPDATE 
USING (firebase_uid = auth.uid()::TEXT) WITH CHECK (firebase_uid = auth.uid()::TEXT);
CREATE POLICY "moderators_read_all_profiles" ON user_profile FOR SELECT USING (is_moderator());

-- ## 9.4 missing_pet_case policies
-- Public can read limited fields (redaction handled via API, but basic visibility for active cases)
CREATE POLICY "public_read_active_missing_cases" ON missing_pet_case FOR SELECT 
USING (status = 'ACTIVE' AND is_deleted = false);

CREATE POLICY "owners_manage_own_missing_cases" ON missing_pet_case FOR ALL 
USING (owner_id = get_current_user_id()) WITH CHECK (owner_id = get_current_user_id());

CREATE POLICY "moderators_manage_all_missing_cases" ON missing_pet_case FOR ALL 
USING (is_moderator()) WITH CHECK (is_moderator());

-- ## 9.5 found_animal_case policies
CREATE POLICY "public_read_active_found_cases" ON found_animal_case FOR SELECT 
USING (status = 'ACTIVE' AND is_deleted = false);

CREATE POLICY "finders_manage_own_found_cases" ON found_animal_case FOR ALL 
USING (finder_id = get_current_user_id()) WITH CHECK (finder_id = get_current_user_id());

CREATE POLICY "moderators_manage_all_found_cases" ON found_animal_case FOR ALL 
USING (is_moderator()) WITH CHECK (is_moderator());

-- ## 9.6 sighting policies
CREATE POLICY "public_read_active_sightings" ON sighting FOR SELECT 
USING (is_deleted = false);

CREATE POLICY "reporters_manage_own_sightings" ON sighting FOR ALL 
USING (reporter_id = get_current_user_id()) WITH CHECK (reporter_id = get_current_user_id());

CREATE POLICY "moderators_manage_all_sightings" ON sighting FOR ALL 
USING (is_moderator()) WITH CHECK (is_moderator());

-- ## 9.7 match_suggestion policies
CREATE POLICY "moderators_manage_match_suggestions" ON match_suggestion FOR ALL 
USING (is_moderator()) WITH CHECK (is_moderator());

-- ## 9.8 moderator_action policies
CREATE POLICY "moderators_read_mod_actions" ON moderator_action FOR SELECT USING (is_moderator());
CREATE POLICY "moderators_record_mod_actions" ON moderator_action FOR INSERT WITH CHECK (is_moderator());

-- ## 9.9 emergency_vet_notify_attempt policies
CREATE POLICY "users_read_own_vet_notifies" ON emergency_vet_notify_attempt FOR SELECT 
USING (initiated_by = get_current_user_id());

CREATE POLICY "users_create_vet_notifies" ON emergency_vet_notify_attempt FOR INSERT 
WITH CHECK (initiated_by = get_current_user_id());

CREATE POLICY "moderators_read_all_vet_notifies" ON emergency_vet_notify_attempt FOR SELECT 
USING (is_moderator());

-- ## 9.10 municipal_interaction_log policies
CREATE POLICY "users_read_own_municipal_logs" ON municipal_interaction_log FOR SELECT 
USING (initiated_by = get_current_user_id());

CREATE POLICY "users_create_municipal_logs" ON municipal_interaction_log FOR INSERT 
WITH CHECK (initiated_by = get_current_user_id());

CREATE POLICY "moderators_read_all_municipal_logs" ON municipal_interaction_log FOR SELECT 
USING (is_moderator());

-- ## 9.11 pilot_metrics_log policies
CREATE POLICY "admin_read_metrics" ON pilot_metrics_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profile WHERE firebase_uid = auth.uid()::TEXT AND role = 'SYSTEM_ADMIN'));

-- ## 9.12 offline_queued_action policies
CREATE POLICY "users_manage_own_offline_actions" ON offline_queued_action FOR ALL 
USING (user_id = get_current_user_id()) WITH CHECK (user_id = get_current_user_id());

-- ## 9.13 Registry Policies

CREATE POLICY "public_read_pets" ON pets FOR SELECT USING (true);
CREATE POLICY "public_read_microchips" ON microchips FOR SELECT USING (true);
CREATE POLICY "public_read_links" ON pet_chip_link FOR SELECT USING (true);

CREATE POLICY "custodians_read_own_data" ON custodians FOR SELECT 
USING (user_id = get_current_user_id() OR is_moderator());

CREATE POLICY "custodians_read_history" ON custody_history FOR SELECT 
USING (EXISTS (SELECT 1 FROM custodians WHERE id = custodian_id AND user_id = get_current_user_id()) OR is_moderator());

CREATE POLICY "public_read_verification_events" ON verification_events FOR SELECT USING (true);
CREATE POLICY "public_read_lost_found_events" ON lost_found_events FOR SELECT USING (true);

-- Moderators can manage all registry data
CREATE POLICY "moderators_manage_registry" ON pets FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_chips" ON microchips FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_links" ON pet_chip_link FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_custodians" ON custodians FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_history" ON custody_history FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_verifications" ON verification_events FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_lf_events" ON lost_found_events FOR ALL USING (is_moderator());

-- ## 9.14 Homeward Rewards Policies

CREATE POLICY "public_read_drawings" ON drawings FOR SELECT USING (true);
CREATE POLICY "public_read_prizes" ON prizes FOR SELECT USING (true);

CREATE POLICY "custodians_read_own_entries" ON homeward_entries FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pet_chip_link pcl
    JOIN custody_history ch ON pcl.pet_id = ch.pet_id
    JOIN custodians c ON ch.custodian_id = c.id
    WHERE pcl.chip_id = homeward_entries.chip_id 
      AND c.user_id = get_current_user_id()
      AND ch.effective_to IS NULL
  ) OR is_moderator()
);

CREATE POLICY "custodians_read_own_wins" ON winners FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM homeward_entries he
    JOIN pet_chip_link pcl ON he.chip_id = pcl.chip_id
    JOIN custody_history ch ON pcl.pet_id = ch.pet_id
    JOIN custodians c ON ch.custodian_id = c.id
    WHERE he.entry_id = winners.entry_id
      AND c.user_id = get_current_user_id()
      AND ch.effective_to IS NULL
  ) OR is_moderator()
);

-- Moderators manage rewards (conducting drawings, assigning prizes)
CREATE POLICY "moderators_manage_entries" ON homeward_entries FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_drawings" ON drawings FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_prizes" ON prizes FOR ALL USING (is_moderator());
CREATE POLICY "moderators_manage_winners" ON winners FOR ALL USING (is_moderator());
