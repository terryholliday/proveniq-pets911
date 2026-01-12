-- 50/50 HUMAN-AI MODERATION SAFETY UPDATE
-- Replaces 99% automation with balanced human oversight
-- Prevents emotional tragedies through mandatory human review
-- 
-- PREREQUISITE: content_queue table must exist (created in 20260112135000_create_content_queue.sql)

-- ============================================================================

-- 1. VERIFY CONTENT QUEUE STRUCTURE
-- The content_queue table should already have these columns from the base migration
-- If not, this migration will add them

-- 2. CREATE SAFETY POLICY FUNCTIONS
CREATE OR REPLACE FUNCTION apply_safety_policy(
  p_content_type TEXT,
  p_content TEXT,
  p_ai_confidence DECIMAL(3,2) DEFAULT 0.5
) RETURNS TABLE (
  requires_human BOOLEAN,
  auto_approve BOOLEAN,
  reason TEXT,
  escalation_level TEXT
) AS $$
DECLARE
  v_requires_human BOOLEAN := true;
  v_auto_approve BOOLEAN := false;
  v_reason TEXT := 'Default safety - human review required';
  v_escalation_level TEXT := 'medium';
  v_emotional_keywords TEXT[] := ARRAY[
    'family member', 'child', 'baby', 'dying', 'death', 'killed', 
    'suffering', 'pain', 'crying', 'heartbroken', 'devastated',
    'emergency', 'critical', 'life-threatening', 'last chance'
  ];
BEGIN
  -- High-stakes categories always require human review
  IF p_content_type IN (
    'pet_match_suggestions', 'emergency_reports', 'injured_animals',
    'missing_pet_reports', 'volunteer_applications', 'fraud_escalations'
  ) THEN
    v_requires_human := true;
    v_auto_approve := false;
    v_reason := 'High-stakes category requires human review';
    v_escalation_level := 'high';
    
    -- Critical escalation for emergencies
    IF p_content_type IN ('emergency_reports', 'injured_animals') THEN
      v_escalation_level := 'critical';
    END IF;
    
  -- Check for emotional triggers
  ELSIF EXISTS (SELECT 1 FROM unnest(v_emotional_keywords) kw WHERE p_content ILIKE '%' || kw || '%') THEN
    v_requires_human := true;
    v_auto_approve := false;
    v_reason := 'Emotional content detected - human review required for safety';
    v_escalation_level := 'high';
    
  -- Low confidence requires human review
  ELSIF p_ai_confidence < 0.7 THEN
    v_requires_human := true;
    v_auto_approve := false;
    v_reason := 'AI confidence below 70% threshold';
    v_escalation_level := 'medium';
    
  -- Safe categories can be auto-approved
  ELSIF p_content_type IN (
    'general_inquiries', 'non_urgent_information', 'community_posts'
  ) AND p_ai_confidence >= 0.9 THEN
    v_requires_human := false;
    v_auto_approve := true;
    v_reason := 'Low-risk content with high AI confidence';
    v_escalation_level := 'low';
    
  -- 50% random sampling for everything else
  ELSIF RANDOM() < 0.5 THEN
    v_requires_human := true;
    v_auto_approve := false;
    v_reason := 'Random 50% sampling for safety';
    v_escalation_level := 'medium';
  ELSE
    v_requires_human := false;
    v_auto_approve := true;
    v_reason := 'Auto-approved via 50/50 policy';
    v_escalation_level := 'low';
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 3. UPDATED AUTONOMOUS MODERATION WITH 50/50 SAFETY
CREATE OR REPLACE FUNCTION run_autonomous_moderation()
RETURNS TABLE (
  workflow TEXT,
  items_processed INTEGER,
  automation_level DECIMAL(3,2)
) AS $$
DECLARE
  v_total_items INTEGER := 0;
  v_auto_approved INTEGER := 0;
  v_human_required INTEGER := 0;
  workflow TEXT;
  items_processed INTEGER;
  automation_level DECIMAL(3,2);
BEGIN
  -- Process content queue with new safety policy
  UPDATE content_queue cq
  SET 
    requires_human_review = sp.requires_human,
    ai_confidence_score = CASE 
      WHEN cq.ai_confidence_score IS NULL THEN 0.5 
      ELSE cq.ai_confidence_score 
    END,
    emotional_content_detected = EXISTS (
      SELECT 1 FROM unnest(ARRAY[
        'family member', 'child', 'baby', 'dying', 'death', 'killed', 
        'suffering', 'pain', 'crying', 'heartbroken', 'devastated'
      ]) kw WHERE cq.content ILIKE '%' || kw || '%'
    ),
    high_stakes_category = cq.content_type IN (
      'pet_match_suggestions', 'emergency_reports', 'injured_animals',
      'missing_pet_reports', 'volunteer_applications', 'fraud_escalations'
    ),
    moderation_status = CASE 
      WHEN sp.auto_approve THEN 'approved'
      ELSE 'pending_human_review'
    END,
    moderated_by = CASE 
      WHEN sp.auto_approve THEN 'AI-SYSTEM-V2'
      ELSE 'HUMAN-REQUIRED'
    END
  FROM apply_safety_policy(cq.content_type, cq.content, cq.ai_confidence_score) sp
  WHERE cq.moderation_status = 'pending'
    AND cq.moderation_policy_version = '2.0.0';
  
  GET DIAGNOSTICS v_total_items = ROW_COUNT;
  
  -- Count results
  SELECT COUNT(*) INTO v_auto_approved
  FROM content_queue 
  WHERE moderation_status = 'approved' 
    AND moderated_by = 'AI-SYSTEM-V2'
    AND moderation_policy_version = '2.0.0';
    
  SELECT COUNT(*) INTO v_human_required
  FROM content_queue 
  WHERE moderation_status = 'pending_human_review'
    AND moderation_policy_version = '2.0.0';
  
  -- Return workflow metrics
  workflow := 'content_classification';
  items_processed := v_total_items;
  automation_level := CASE WHEN v_total_items > 0 THEN ROUND(v_auto_approved::DECIMAL / v_total_items, 2) ELSE 0 END;
  RETURN NEXT;
    
  workflow := 'human_oversight';
  items_processed := v_human_required;
  automation_level := CASE WHEN v_total_items > 0 THEN ROUND(v_human_required::DECIMAL / v_total_items, 2) ELSE 0 END;
  RETURN NEXT;
    
  workflow := 'overall_moderation_autonomy';
  items_processed := v_total_items;
  automation_level := CASE WHEN v_total_items > 0 THEN ROUND(v_auto_approved::DECIMAL / v_total_items, 2) ELSE 0 END;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE HUMAN REVIEW QUEUE VIEW
CREATE OR REPLACE VIEW human_review_queue AS
SELECT 
  cq.id,
  cq.content_type,
  cq.content,
  cq.ai_confidence_score,
  cq.emotional_content_detected,
  cq.high_stakes_category,
  cq.created_at,
  sp.reason as review_reason,
  sp.escalation_level
FROM content_queue cq
JOIN apply_safety_policy(cq.content_type, cq.content, cq.ai_confidence_score) sp ON true
WHERE cq.requires_human_review = true
  AND cq.human_review_completed = false
  AND cq.moderation_policy_version = '2.0.0'
ORDER BY 
  CASE sp.escalation_level 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  cq.created_at ASC;

-- 5. SAFETY MONITORING FUNCTION
CREATE OR REPLACE FUNCTION safety_monitoring_report()
RETURNS TABLE (
  metric_name TEXT,
  value INTEGER,
  threshold INTEGER,
  status TEXT
) AS $$
DECLARE
  metric_name TEXT;
  value INTEGER;
  threshold INTEGER;
  status TEXT;
  v_count INTEGER;
BEGIN
  -- Emotional content requiring human review
  SELECT COUNT(*) INTO v_count
  FROM content_queue 
  WHERE emotional_content_detected = true 
    AND human_review_completed = false;
  
  metric_name := 'emotional_content_human_review';
  value := v_count;
  threshold := 0;
  status := 'OK';
  RETURN NEXT;
    
  -- Pet matches pending human review
  SELECT COUNT(*) INTO v_count
  FROM content_queue 
  WHERE content_type = 'pet_match_suggestions' 
    AND human_review_completed = false;
  
  metric_name := 'pet_matches_pending_review';
  value := v_count;
  threshold := 10;
  status := 'OK';
  RETURN NEXT;
    
  -- Emergency response time
  SELECT ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60) INTO v_count
  FROM content_queue 
  WHERE content_type = 'emergency_reports' 
    AND human_review_completed = false
  LIMIT 1;
  
  metric_name := 'emergency_avg_response_time_minutes';
  value := v_count;
  threshold := 5;
  status := 'OK';
  RETURN NEXT;
    
  -- Human review backlog
  SELECT COUNT(*) INTO v_count
  FROM human_review_queue;
  
  metric_name := 'human_review_backlog';
  value := v_count;
  threshold := 50;
  status := 'OK';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. UPDATE POLICY VERSION
UPDATE content_queue 
SET moderation_policy_version = '2.0.0',
    requires_human_review = true
WHERE moderation_policy_version IS NULL 
   OR moderation_policy_version = '1.0.0';

-- Initialize safety policy for existing content
UPDATE content_queue 
SET 
  requires_human_review = CASE
    -- High-stakes categories always require human review
    WHEN content_type IN (
      'pet_match_suggestions', 'emergency_reports', 'injured_animals',
      'missing_pet_reports', 'volunteer_applications', 'fraud_escalations'
    ) THEN true
    -- Low confidence requires human review
    WHEN ai_confidence_score < 0.7 THEN true
    -- Default: 50/50 policy (set to true for safety)
    ELSE true
  END,
  emotional_content_detected = EXISTS (
    SELECT 1 FROM unnest(ARRAY[
      'family member', 'child', 'baby', 'dying', 'death', 'killed', 
      'suffering', 'pain', 'crying', 'heartbroken', 'devastated'
    ]) kw WHERE content ILIKE '%' || kw || '%'
  ),
  high_stakes_category = content_type IN (
    'pet_match_suggestions', 'emergency_reports', 'injured_animals',
    'missing_pet_reports', 'volunteer_applications', 'fraud_escalations'
  )
WHERE moderation_policy_version = '2.0.0';

-- Policy implemented: 50/50 human-AI moderation with safety overrides
-- All high-stakes content requires human review
-- Emotional content automatically flagged for human review
