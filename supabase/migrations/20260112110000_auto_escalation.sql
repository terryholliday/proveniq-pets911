-- Auto-Escalation System
-- Automatically expand volunteer search and notify supervisors for unassigned cases

-- ============================================================================

-- Function to check for unassigned cases and trigger escalation
CREATE OR REPLACE FUNCTION check_case_escalation()
RETURNS TABLE (
  case_id UUID,
  escalation_level TEXT,
  action_taken TEXT
) AS $$
DECLARE
  v_case RECORD;
  v_escalation_count INTEGER := 0;
BEGIN
  -- Find cases unassigned for more than 15 minutes
  FOR v_case IN
    SELECT 
      id as case_id,
      triage_tier,
      county,
      created_at,
      extract(epoch from (NOW() - created_at)) as seconds_unassigned
    FROM dispatch_requests
    WHERE assigned_to IS NULL
      AND status = 'pending'
      AND created_at < NOW() - INTERVAL '15 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts
        WHERE alert_type = 'case_escalation'
          AND metadata->>'case_id' = dispatch_requests.id::text
          AND created_at > NOW() - INTERVAL '1 hour'
      )
    ORDER BY created_at ASC
  LOOP
    -- Determine escalation level based on time and tier
    IF v_case.seconds_unassigned > 3600 THEN -- 1 hour
      -- Critical escalation - notify all supervisors
      INSERT INTO system_alerts (
        alert_type, severity, title, message, metadata
      ) VALUES (
        'case_escalation',
        'critical',
        'CRITICAL: Case Unassigned 1+ Hours',
        'Tier ' || v_case.triage_tier || ' case in ' || v_case.county || 
        ' has been unassigned for over 1 hour. Immediate action required.',
        jsonb_build_object(
          'case_id', v_case.case_id,
          'tier', v_case.triage_tier,
          'county', v_case.county,
          'unassigned_minutes', FLOOR(v_case.seconds_unassigned / 60)
        )
      );
      
      action_taken := 'Critical escalation - supervisors notified';
      escalation_level := 'critical';
      
    ELSIF v_case.seconds_unassigned > 1800 THEN -- 30 minutes
      -- High escalation - expand search radius
      INSERT INTO system_alerts (
        alert_type, severity, title, message, metadata
      ) VALUES (
        'case_escalation',
        'warning',
        'Case Unassigned 30+ Minutes',
        'Tier ' || v_case.triage_tier || ' case in ' || v_case.county || 
        ' unassigned for 30+ minutes. Search radius expanded.',
        jsonb_build_object(
          'case_id', v_case.case_id,
          'tier', v_case.triage_tier,
          'county', v_case.county,
          'unassigned_minutes', FLOOR(v_case.seconds_unassigned / 60),
          'action', 'expanded_search_radius'
        )
      );
      
      action_taken := 'Expanded search radius';
      escalation_level := 'high';
      
    ELSE -- 15+ minutes
      -- Standard escalation - notify nearby counties
      INSERT INTO system_alerts (
        alert_type, severity, title, message, metadata
      ) VALUES (
        'case_escalation',
        'info',
        'Case Unassigned 15+ Minutes',
        'Tier ' || v_case.triage_tier || ' case in ' || v_case.county || 
        ' unassigned for 15+ minutes. Nearby counties notified.',
        jsonb_build_object(
          'case_id', v_case.case_id,
          'tier', v_case.triage_tier,
          'county', v_case.county,
          'unassigned_minutes', FLOOR(v_case.seconds_unassigned / 60),
          'action', 'nearby_counties_notified'
        )
      );
      
      action_taken := 'Notified nearby counties';
      escalation_level := 'standard';
    END IF;
    
    v_escalation_count := v_escalation_count + 1;
    
    -- Log the escalation
    INSERT INTO dispatch_metrics (
      dispatch_id, triage_tier, county, created_at
    ) VALUES (
      v_case.case_id, v_case.triage_tier, v_case.county, NOW()
    );
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FRAUD AUTO-FLAG SYSTEM
-- Detect suspicious patterns in posts and donations

CREATE OR REPLACE FUNCTION detect_fraud_patterns()
RETURNS TABLE (
  flag_id UUID,
  flag_type TEXT,
  reason TEXT,
  confidence_score INTEGER
) AS $$
DECLARE
  v_flag RECORD;
BEGIN
  -- Check for duplicate images in posts
  FOR v_flag IN
    WITH duplicate_images AS (
      SELECT 
        image_hash,
        COUNT(*) as count,
        ARRAY_AGG(id) as post_ids,
        ARRAY_AGG(created_by) as creators
      FROM posts
      WHERE image_hash IS NOT NULL
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY image_hash
      HAVING COUNT(*) > 1
    )
    SELECT 
      gen_random_uuid() as flag_id,
      'duplicate_image' as flag_type,
      'Same image used in ' || di.count || ' different posts' as reason,
      CASE WHEN di.count >= 3 THEN 90 ELSE 60 END as confidence_score
    FROM duplicate_images di
  LOOP
    -- Create fraud alert
    INSERT INTO system_alerts (
      alert_type, severity, title, message, metadata
    ) VALUES (
      'fraud_detection',
      'warning',
      'Duplicate Image Detected',
      v_flag.reason,
      jsonb_build_object(
        'flag_id', v_flag.flag_id,
        'flag_type', v_flag.flag_type,
        'confidence_score', v_flag.confidence_score,
        'image_hash', v_flag.image_hash
      )
    );
    
    RETURN NEXT;
  END LOOP;
  
  -- Check for suspicious donation patterns
  FOR v_flag IN
    SELECT 
      gen_random_uuid() as flag_id,
      'suspicious_donation' as flag_type,
      'Multiple large donations from same source' as reason,
      70 as confidence_score
    FROM donations
    WHERE amount > 1000
      AND created_at > NOW() - INTERVAL '24 hours'
      AND donor_email IN (
        SELECT donor_email
        FROM donations
        WHERE amount > 1000
          AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY donor_email
        HAVING COUNT(*) > 2
      )
    LIMIT 1
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, title, message, metadata
    ) VALUES (
      'fraud_detection',
      'warning',
      'Suspicious Donation Pattern',
      v_flag.reason,
      jsonb_build_object(
        'flag_id', v_flag.flag_id,
        'flag_type', v_flag.flag_type,
        'confidence_score', v_flag.confidence_score
      )
    );
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENHANCED RESPONSE TIME TRACKING
-- Track and analyze volunteer response patterns

CREATE OR REPLACE FUNCTION update_response_metrics()
RETURNS TABLE (
  metric_id UUID,
  response_type TEXT,
  avg_seconds INTEGER
) AS $$
BEGIN
  -- Calculate average response times by tier
  INSERT INTO dispatch_metrics (
    dispatch_id, triage_tier, county, first_response_at, created_at
  )
  SELECT 
    dr.id,
    dr.triage_tier,
    dr.county,
    dr.assigned_at,
    dr.created_at
  FROM dispatch_requests dr
  WHERE dr.assigned_at IS NOT NULL
    AND dr.status = 'assigned'
    AND NOT EXISTS (
      SELECT 1 FROM dispatch_metrics dm
      WHERE dm.dispatch_id = dr.id
    )
  LIMIT 100;
  
  -- Return summary metrics
  RETURN QUERY
  SELECT 
    gen_random_uuid() as metric_id,
    'avg_response_tier_' || triage_tier as response_type,
    FLOOR(AVG(response_time_seconds)) as avg_seconds
  FROM dispatch_metrics
  WHERE response_time_seconds IS NOT NULL
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY triage_tier
  UNION ALL
  SELECT 
    gen_random_uuid() as metric_id,
    'avg_response_county_' || county as response_type,
    FLOOR(AVG(response_time_seconds)) as avg_seconds
  FROM dispatch_metrics
  WHERE response_time_seconds IS NOT NULL
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY county;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED MASTER WORKFLOW FUNCTION
-- Include new automation functions

CREATE OR REPLACE FUNCTION run_hourly_workflows()
RETURNS TABLE (
  workflow TEXT,
  items_processed INTEGER
) AS $$
BEGIN
  workflow := 'case_escalation_check';
  items_processed := (SELECT COUNT(*) FROM check_case_escalation());
  RETURN NEXT;

  workflow := 'fraud_detection';
  items_processed := (SELECT COUNT(*) FROM detect_fraud_patterns());
  RETURN NEXT;

  workflow := 'response_metrics_update';
  items_processed := (SELECT COUNT(*) FROM update_response_metrics());
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dispatch_unassigned ON dispatch_requests(assigned_to, status, created_at) WHERE assigned_to IS NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_posts_image_hash ON posts(image_hash, created_at) WHERE image_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_pattern ON donations(donor_email, amount, created_at) WHERE amount > 1000;
CREATE INDEX IF NOT EXISTS idx_metrics_response_time ON dispatch_metrics(response_time_seconds, created_at) WHERE response_time_seconds IS NOT NULL;
