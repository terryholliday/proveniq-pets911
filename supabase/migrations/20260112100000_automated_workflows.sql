-- Pet911 Automated Workflows
-- Database triggers and functions for automated system behaviors

-- ============================================================================
-- 1. AUTO-COOLDOWN WORKFLOW
-- Automatically trigger cooldowns based on exposure thresholds
-- ============================================================================

-- Function to check and trigger cooldowns after exposure logging
CREATE OR REPLACE FUNCTION trigger_auto_cooldown()
RETURNS TRIGGER AS $$
DECLARE
  v_short_term_score INTEGER;
  v_daily_score INTEGER;
  v_existing_cooldown UUID;
BEGIN
  -- Check for existing active cooldown
  SELECT id INTO v_existing_cooldown
  FROM volunteer_cooldown_events
  WHERE user_id = NEW.user_id
    AND ends_at > NOW()
  LIMIT 1;

  -- If already in cooldown, skip
  IF v_existing_cooldown IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate short-term exposure (last 60 minutes)
  SELECT COALESCE(SUM(severity), 0) INTO v_short_term_score
  FROM volunteer_exposure_log
  WHERE user_id = NEW.user_id
    AND occurred_at > NOW() - INTERVAL '60 minutes'
    AND counted_in_window = true;

  -- Calculate daily exposure (last 24 hours)
  SELECT COALESCE(SUM(severity), 0) INTO v_daily_score
  FROM volunteer_exposure_log
  WHERE user_id = NEW.user_id
    AND occurred_at > NOW() - INTERVAL '24 hours'
    AND counted_in_window = true;

  -- Trigger short break: 2+ Code Red cases in 60 min (score >= 4)
  IF v_short_term_score >= 4 THEN
    INSERT INTO volunteer_cooldown_events (
      user_id, trigger_reason, cooldown_type, restricted_actions, started_at, ends_at
    ) VALUES (
      NEW.user_id,
      'Auto-triggered: High short-term exposure (' || v_short_term_score || ' points in 60 min)',
      'short_break',
      '["code_red_triage", "graphic_content_review"]'::jsonb,
      NOW(),
      NOW() + INTERVAL '15 minutes'
    );
    RETURN NEW;
  END IF;

  -- Trigger tier restriction: 5+ Code Red cases in 24 hrs (score >= 10)
  IF v_daily_score >= 10 THEN
    INSERT INTO volunteer_cooldown_events (
      user_id, trigger_reason, cooldown_type, restricted_actions, started_at, ends_at
    ) VALUES (
      NEW.user_id,
      'Auto-triggered: High daily exposure (' || v_daily_score || ' points in 24 hrs)',
      'tier_restriction',
      '["code_red_triage", "graphic_content_review", "cruelty_case_handling"]'::jsonb,
      NOW(),
      NOW() + INTERVAL '12 hours'
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-cooldown
DROP TRIGGER IF EXISTS auto_cooldown_trigger ON volunteer_exposure_log;
CREATE TRIGGER auto_cooldown_trigger
  AFTER INSERT ON volunteer_exposure_log
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_cooldown();

-- ============================================================================
-- 2. CERTIFICATION EXPIRY ALERTS
-- Track and flag expiring certifications
-- ============================================================================

-- Create alerts table for system notifications
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON system_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_unack ON system_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- Function to generate certification expiry alerts (run daily via cron)
CREATE OR REPLACE FUNCTION generate_certification_expiry_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_cert RECORD;
BEGIN
  -- Find certifications expiring in next 30 days
  FOR v_cert IN
    SELECT vc.*, tm.title as module_title, v.display_name, v.email
    FROM volunteer_certifications vc
    JOIN training_modules tm ON vc.module_id = tm.id
    JOIN volunteers v ON vc.user_id = v.user_id
    WHERE vc.status = 'active'
      AND vc.expires_at IS NOT NULL
      AND vc.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts sa
        WHERE sa.user_id = vc.user_id
          AND sa.alert_type = 'certification_expiring'
          AND sa.metadata->>'certification_id' = vc.id::text
          AND sa.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, user_id, title, message, metadata, expires_at
    ) VALUES (
      'certification_expiring',
      CASE 
        WHEN v_cert.expires_at < NOW() + INTERVAL '7 days' THEN 'critical'
        WHEN v_cert.expires_at < NOW() + INTERVAL '14 days' THEN 'warning'
        ELSE 'info'
      END,
      v_cert.user_id,
      'Certification Expiring: ' || v_cert.module_title,
      'Your ' || v_cert.module_title || ' certification expires on ' || 
        TO_CHAR(v_cert.expires_at, 'Month DD, YYYY') || '. Please complete recertification.',
      jsonb_build_object(
        'certification_id', v_cert.id,
        'module_id', v_cert.module_id,
        'expires_at', v_cert.expires_at,
        'volunteer_name', COALESCE(v_cert.display_name, v_cert.email)
      ),
      v_cert.expires_at
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. STALE APPLICATION CLEANUP
-- Auto-archive applications pending > 14 days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_stale_applications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Archive stale applications
  WITH archived AS (
    UPDATE volunteers
    SET status = 'ARCHIVED',
        updated_at = NOW()
    WHERE status = 'INACTIVE'
      AND created_at < NOW() - INTERVAL '14 days'
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts
        WHERE user_id = volunteers.user_id
          AND alert_type = 'application_archived'
          AND created_at > NOW() - INTERVAL '1 day'
      )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_count FROM archived;

  -- Create alerts for archived applications
  INSERT INTO system_alerts (alert_type, severity, user_id, title, message, metadata)
  SELECT 
    'application_archived',
    'info',
    user_id,
    'Application Auto-Archived',
    'Your volunteer application was auto-archived after 14 days without review. Please reapply if still interested.',
    jsonb_build_object('volunteer_id', id, 'original_status', 'INACTIVE')
  FROM volunteers
  WHERE status = 'ARCHIVED'
    AND updated_at > NOW() - INTERVAL '1 minute';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. BURNOUT DETECTION
-- Flag volunteers with sustained high exposure
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_burnout_risk()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Find users with high cumulative exposure over 7 days
  FOR v_user IN
    SELECT 
      vel.user_id,
      v.display_name,
      v.email,
      SUM(vel.severity) as total_exposure,
      COUNT(*) as incident_count
    FROM volunteer_exposure_log vel
    JOIN volunteers v ON vel.user_id = v.user_id
    WHERE vel.occurred_at > NOW() - INTERVAL '7 days'
    GROUP BY vel.user_id, v.display_name, v.email
    HAVING SUM(vel.severity) >= 20  -- High threshold
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts
        WHERE user_id = vel.user_id
          AND alert_type = 'burnout_risk'
          AND created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, user_id, title, message, metadata
    ) VALUES (
      'burnout_risk',
      'warning',
      v_user.user_id,
      'Wellness Check Recommended',
      COALESCE(v_user.display_name, v_user.email) || ' has handled ' || 
        v_user.incident_count || ' high-stress cases this week. Consider scheduling a debrief.',
      jsonb_build_object(
        'total_exposure', v_user.total_exposure,
        'incident_count', v_user.incident_count,
        'period', '7 days'
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. INACTIVE VOLUNTEER DETECTION
-- Flag volunteers with no activity > 30 days
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_inactive_volunteers()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO system_alerts (alert_type, severity, user_id, title, message, metadata)
  SELECT 
    'inactive_volunteer',
    'info',
    v.user_id,
    'Inactive Volunteer',
    COALESCE(v.display_name, v.email) || ' has not been active for 30+ days.',
    jsonb_build_object(
      'volunteer_id', v.id,
      'last_activity', v.updated_at,
      'status', v.status
    )
  FROM volunteers v
  WHERE v.status = 'ACTIVE'
    AND v.updated_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM system_alerts
      WHERE user_id = v.user_id
        AND alert_type = 'inactive_volunteer'
        AND created_at > NOW() - INTERVAL '30 days'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ANALYTICS TABLES
-- ============================================================================

-- Response time tracking
CREATE TABLE IF NOT EXISTS dispatch_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID,
  triage_tier INTEGER,
  county TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  response_time_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (first_response_at - created_at))::INTEGER
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_dispatch_metrics_tier ON dispatch_metrics(triage_tier);
CREATE INDEX IF NOT EXISTS idx_dispatch_metrics_county ON dispatch_metrics(county);
CREATE INDEX IF NOT EXISTS idx_dispatch_metrics_date ON dispatch_metrics(created_at);

-- Outcome tracking
CREATE TABLE IF NOT EXISTS case_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID,
  case_type TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN (
    'reunited', 'adopted', 'fostered', 'transferred', 'tnr_complete',
    'deceased', 'euthanized', 'escaped', 'unknown', 'ongoing'
  )),
  county TEXT,
  volunteer_id UUID REFERENCES volunteers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_type ON case_outcomes(outcome);
CREATE INDEX IF NOT EXISTS idx_outcomes_county ON case_outcomes(county);
CREATE INDEX IF NOT EXISTS idx_outcomes_date ON case_outcomes(created_at);

-- ============================================================================
-- 7. MASTER CRON FUNCTION
-- Call this daily to run all automated workflows
-- ============================================================================

CREATE OR REPLACE FUNCTION run_daily_workflows()
RETURNS TABLE (
  workflow TEXT,
  items_processed INTEGER
) AS $$
BEGIN
  workflow := 'certification_expiry_alerts';
  items_processed := generate_certification_expiry_alerts();
  RETURN NEXT;

  workflow := 'stale_application_cleanup';
  items_processed := cleanup_stale_applications();
  RETURN NEXT;

  workflow := 'burnout_detection';
  items_processed := detect_burnout_risk();
  RETURN NEXT;

  workflow := 'inactive_volunteer_detection';
  items_processed := detect_inactive_volunteers();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exposure_user_time ON volunteer_exposure_log(user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_cooldown_ends ON volunteer_cooldown_events(user_id, ends_at);
CREATE INDEX IF NOT EXISTS idx_certs_expiring ON volunteer_certifications(expires_at) WHERE status = 'active' AND expires_at IS NOT NULL;
