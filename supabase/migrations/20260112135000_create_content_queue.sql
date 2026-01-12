-- CREATE CONTENT QUEUE TABLE
-- Base table for 50/50 human-AI moderation system

CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'pending_human_review', 'escalated')),
  moderated_by TEXT,
  moderator_id UUID REFERENCES auth.users(id),
  ai_confidence_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- 50/50 Policy Fields
  requires_human_review BOOLEAN DEFAULT true,
  human_review_completed BOOLEAN DEFAULT false,
  emotional_content_detected BOOLEAN DEFAULT false,
  high_stakes_category BOOLEAN DEFAULT false,
  moderation_policy_version VARCHAR(20) DEFAULT '2.0.0',
  review_reason TEXT,
  escalation_level TEXT DEFAULT 'medium' CHECK (escalation_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Content metadata
  submitter_id UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  tags TEXT[],
  
  -- Audit trail
  audit_log JSONB DEFAULT '[]'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(moderation_status);
CREATE INDEX IF NOT EXISTS idx_content_queue_type ON content_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_content_queue_human_review ON content_queue(requires_human_review, human_review_completed);
CREATE INDEX IF NOT EXISTS idx_content_queue_created ON content_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_content_queue_priority ON content_queue(priority DESC, created_at ASC);

-- Row Level Security
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Content queue visible to moderators" ON content_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      WHERE v.user_id = auth.uid()
      AND v.status = 'ACTIVE'
      AND (v.capabilities @> ARRAY['MODERATOR'] OR v.capabilities @> ARRAY['SYSOP'])
    )
  );

CREATE POLICY "Content queue updatable by moderators" ON content_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      WHERE v.user_id = auth.uid()
      AND v.status = 'ACTIVE'
      AND (v.capabilities @> ARRAY['MODERATOR'] OR v.capabilities @> ARRAY['SYSOP'])
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_content_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_queue_updated_at
  BEFORE UPDATE ON content_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_content_queue_updated_at();

-- Insert some sample data for testing
INSERT INTO content_queue (content_type, content, metadata, priority) VALUES
('pet_match_suggestions', 'Potential match found for missing Golden Retriever', '{"match_id": "match-001", "confidence": 0.85}', 2),
('emergency_reports', 'Injured dog found on highway', '{"location": "I-95 mile 42", "injury_type": "hit_by_car"}', 1),
('general_inquiries', 'Question about volunteer requirements', '{"category": "volunteer_info"}', 5);

COMMIT;
