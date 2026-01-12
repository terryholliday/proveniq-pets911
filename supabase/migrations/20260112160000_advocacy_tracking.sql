-- Advocacy Contact Tracking for BARK Act Campaign
-- Tracks contacts made to legislators without storing PII

-- Contact log table (anonymized)
CREATE TABLE IF NOT EXISTS advocacy_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- What type of contact
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'phone', 'resistbot', 'social_twitter', 'social_facebook', 'letter')),
  
  -- Which legislator (optional - for aggregate stats)
  legislator_chamber TEXT CHECK (legislator_chamber IN ('Senate', 'House')),
  legislator_district TEXT,
  legislator_party TEXT CHECK (legislator_party IN ('R', 'D', 'I')),
  
  -- Geographic (county only, no address)
  county TEXT,
  
  -- Session tracking (anonymous)
  session_id TEXT, -- Browser fingerprint hash, not PII
  
  -- Referral source
  referral_source TEXT DEFAULT 'direct'
);

-- Monthly aggregates for dashboard (pre-computed for performance)
CREATE TABLE IF NOT EXISTS advocacy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stat_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'total'
  
  -- Counts by type
  email_count INTEGER DEFAULT 0,
  phone_count INTEGER DEFAULT 0,
  resistbot_count INTEGER DEFAULT 0,
  social_count INTEGER DEFAULT 0,
  letter_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  
  -- Counts by chamber
  senate_contacts INTEGER DEFAULT 0,
  house_contacts INTEGER DEFAULT 0,
  
  -- Unique sessions (approximate unique users)
  unique_sessions INTEGER DEFAULT 0,
  
  -- Top counties
  top_counties JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(stat_date, stat_type)
);

-- Create indexes
CREATE INDEX idx_advocacy_contacts_created ON advocacy_contacts(created_at);
CREATE INDEX idx_advocacy_contacts_type ON advocacy_contacts(contact_type);
CREATE INDEX idx_advocacy_contacts_county ON advocacy_contacts(county);
CREATE INDEX idx_advocacy_stats_date ON advocacy_stats(stat_date, stat_type);

-- RLS Policies
ALTER TABLE advocacy_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocacy_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a contact (public action)
CREATE POLICY "Anyone can log advocacy contact"
  ON advocacy_contacts FOR INSERT
  TO public
  WITH CHECK (true);

-- Only service role can read individual contacts (for admin analysis)
CREATE POLICY "Service role can read contacts"
  ON advocacy_contacts FOR SELECT
  TO service_role
  USING (true);

-- Anyone can read aggregate stats (public dashboard)
CREATE POLICY "Anyone can read advocacy stats"
  ON advocacy_stats FOR SELECT
  TO public
  USING (true);

-- Only service role can update stats
CREATE POLICY "Service role can manage stats"
  ON advocacy_stats FOR ALL
  TO service_role
  USING (true);

-- Function to increment stats when contact is logged
CREATE OR REPLACE FUNCTION update_advocacy_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily stats
  INSERT INTO advocacy_stats (stat_date, stat_type, total_count, 
    email_count, phone_count, resistbot_count, social_count, letter_count,
    senate_contacts, house_contacts, unique_sessions)
  VALUES (
    CURRENT_DATE, 
    'daily', 
    1,
    CASE WHEN NEW.contact_type = 'email' THEN 1 ELSE 0 END,
    CASE WHEN NEW.contact_type = 'phone' THEN 1 ELSE 0 END,
    CASE WHEN NEW.contact_type = 'resistbot' THEN 1 ELSE 0 END,
    CASE WHEN NEW.contact_type IN ('social_twitter', 'social_facebook') THEN 1 ELSE 0 END,
    CASE WHEN NEW.contact_type = 'letter' THEN 1 ELSE 0 END,
    CASE WHEN NEW.legislator_chamber = 'Senate' THEN 1 ELSE 0 END,
    CASE WHEN NEW.legislator_chamber = 'House' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (stat_date, stat_type) DO UPDATE SET
    total_count = advocacy_stats.total_count + 1,
    email_count = advocacy_stats.email_count + CASE WHEN NEW.contact_type = 'email' THEN 1 ELSE 0 END,
    phone_count = advocacy_stats.phone_count + CASE WHEN NEW.contact_type = 'phone' THEN 1 ELSE 0 END,
    resistbot_count = advocacy_stats.resistbot_count + CASE WHEN NEW.contact_type = 'resistbot' THEN 1 ELSE 0 END,
    social_count = advocacy_stats.social_count + CASE WHEN NEW.contact_type IN ('social_twitter', 'social_facebook') THEN 1 ELSE 0 END,
    letter_count = advocacy_stats.letter_count + CASE WHEN NEW.contact_type = 'letter' THEN 1 ELSE 0 END,
    senate_contacts = advocacy_stats.senate_contacts + CASE WHEN NEW.legislator_chamber = 'Senate' THEN 1 ELSE 0 END,
    house_contacts = advocacy_stats.house_contacts + CASE WHEN NEW.legislator_chamber = 'House' THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stats
CREATE TRIGGER trg_advocacy_contact_stats
  AFTER INSERT ON advocacy_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_advocacy_stats();

-- Function to get total contacts (for public counter)
CREATE OR REPLACE FUNCTION get_advocacy_total()
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(total_count), 0)::INTEGER 
  FROM advocacy_stats 
  WHERE stat_type = 'daily';
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute to public for the counter
GRANT EXECUTE ON FUNCTION get_advocacy_total() TO public;

-- Insert initial seed data for demo
INSERT INTO advocacy_stats (stat_date, stat_type, total_count, email_count, phone_count, resistbot_count, social_count)
VALUES 
  (CURRENT_DATE - INTERVAL '7 days', 'daily', 45, 20, 15, 5, 5),
  (CURRENT_DATE - INTERVAL '6 days', 'daily', 52, 25, 17, 6, 4),
  (CURRENT_DATE - INTERVAL '5 days', 'daily', 38, 18, 12, 4, 4),
  (CURRENT_DATE - INTERVAL '4 days', 'daily', 61, 30, 20, 7, 4),
  (CURRENT_DATE - INTERVAL '3 days', 'daily', 48, 22, 16, 6, 4),
  (CURRENT_DATE - INTERVAL '2 days', 'daily', 55, 28, 18, 5, 4),
  (CURRENT_DATE - INTERVAL '1 day', 'daily', 42, 20, 14, 5, 3),
  (CURRENT_DATE, 'daily', 12, 6, 4, 1, 1)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE advocacy_contacts IS 'Anonymized log of advocacy contacts for BARK Act campaign';
COMMENT ON TABLE advocacy_stats IS 'Aggregated daily stats for advocacy dashboard';
