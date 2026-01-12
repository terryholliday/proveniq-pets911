-- Pet911 Training System V2
-- Implements nonprofit best practices based on ASPCA, Best Friends, FEMA CERT standards
-- Supports: Quizzes, Certifications, Background Checks, Recertification, Cooldown Enforcement

-- ============================================================================
-- CLEANUP (if migrating from V1)
-- ============================================================================
DROP TABLE IF EXISTS training_quiz_answers CASCADE;
DROP TABLE IF EXISTS training_quiz_attempts CASCADE;
DROP TABLE IF EXISTS training_user_progress CASCADE;
DROP TABLE IF EXISTS training_question_options CASCADE;
DROP TABLE IF EXISTS training_questions CASCADE;
DROP TABLE IF EXISTS training_prerequisites CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS volunteer_certifications CASCADE;
DROP TABLE IF EXISTS volunteer_background_checks CASCADE;
DROP TABLE IF EXISTS volunteer_cooldown_events CASCADE;
DROP TABLE IF EXISTS volunteer_exposure_log CASCADE;
DROP TABLE IF EXISTS supervisor_signoffs CASCADE;
DROP TABLE IF EXISTS shadowing_records CASCADE;

-- ============================================================================
-- VOLUNTEER SAFETY & COMPLIANCE
-- ============================================================================

-- Background check tracking
CREATE TABLE volunteer_background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'checkr',
  external_check_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'pending', 'in_review', 'cleared', 'flagged', 'failed', 'expired'
  )),
  check_type TEXT NOT NULL DEFAULT 'standard',
  result_summary TEXT,
  flags JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, check_type)
);

-- Code Red exposure tracking (for cooldown enforcement)
CREATE TABLE volunteer_exposure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exposure_type TEXT NOT NULL CHECK (exposure_type IN (
    'code_red_triage', 'graphic_content', 'cruelty_case', 'fatality', 'euthanasia_decision'
  )),
  incident_id UUID,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counted_in_window BOOLEAN NOT NULL DEFAULT true
);

-- Cooldown events (system-enforced breaks)
CREATE TABLE volunteer_cooldown_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_reason TEXT NOT NULL,
  cooldown_type TEXT NOT NULL CHECK (cooldown_type IN (
    'short_break', 'tier_restriction', 'full_lockout', 'mandatory_debrief'
  )),
  restricted_actions JSONB DEFAULT '["code_red_triage"]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  overridden_by UUID REFERENCES auth.users(id),
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRAINING MODULES
-- ============================================================================

CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'orientation', 'moderator', 'field_trapper', 'field_transport', 
    'field_foster', 'safety', 'advanced', 'recertification'
  )),
  track TEXT CHECK (track IN (
    'all', 'moderator_t1', 'moderator_t2', 'moderator_t3',
    'trapper', 'transporter', 'foster', 'disaster'
  )) DEFAULT 'all',
  content_type TEXT NOT NULL CHECK (content_type IN (
    'reading', 'video', 'interactive', 'simulation', 'shadowing', 'external'
  )),
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_quiz BOOLEAN NOT NULL DEFAULT true,
  quiz_question_count INTEGER DEFAULT 10,
  passing_score INTEGER NOT NULL DEFAULT 80,
  max_attempts INTEGER DEFAULT 3,
  requires_supervisor_signoff BOOLEAN NOT NULL DEFAULT false,
  requires_background_check BOOLEAN NOT NULL DEFAULT false,
  requires_shadowing BOOLEAN NOT NULL DEFAULT false,
  shadowing_hours_required NUMERIC(4,1) DEFAULT 0,
  certification_valid_days INTEGER DEFAULT 365,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES training_modules(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_prerequisites (
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  prerequisite_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  PRIMARY KEY (module_id, prerequisite_module_id),
  CHECK (module_id != prerequisite_module_id)
);

-- ============================================================================
-- QUIZ SYSTEM
-- ============================================================================

CREATE TABLE training_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'true_false', 'multi_select', 'scenario', 'sequencing'
  )),
  question_text TEXT NOT NULL,
  scenario_context TEXT,
  explanation TEXT,
  reference_source TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 1,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES training_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  partial_credit NUMERIC(3,2) DEFAULT 0,
  feedback TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- USER PROGRESS & ATTEMPTS
-- ============================================================================

CREATE TABLE training_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'content_complete', 'quiz_pending',
    'quiz_failed', 'awaiting_signoff', 'awaiting_shadowing',
    'completed', 'expired', 'suspended'
  )),
  content_progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (content_progress_pct BETWEEN 0 AND 100),
  content_sections_completed JSONB DEFAULT '[]'::jsonb,
  last_content_position JSONB,
  content_completed_at TIMESTAMPTZ,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  best_quiz_score INTEGER,
  last_quiz_score INTEGER,
  last_quiz_at TIMESTAMPTZ,
  quiz_passed_at TIMESTAMPTZ,
  quiz_locked_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_id UUID,
  expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE training_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  progress_id UUID REFERENCES training_user_progress(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  score INTEGER NOT NULL,
  score_pct NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  questions_total INTEGER NOT NULL,
  questions_correct INTEGER NOT NULL,
  critical_questions_total INTEGER DEFAULT 0,
  critical_questions_correct INTEGER DEFAULT 0,
  failed_critical BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  question_order JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE training_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES training_quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES training_questions(id) ON DELETE CASCADE,
  selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  sequence_answer JSONB,
  is_correct BOOLEAN NOT NULL,
  points_earned NUMERIC(5,2) NOT NULL DEFAULT 0,
  points_possible INTEGER NOT NULL DEFAULT 1,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_spent_seconds INTEGER
);

-- ============================================================================
-- SUPERVISOR SIGNOFFS & SHADOWING
-- ============================================================================

CREATE TABLE supervisor_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  progress_id UUID REFERENCES training_user_progress(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'needs_work', 'denied'
  )),
  competency_rating INTEGER CHECK (competency_rating BETWEEN 1 AND 5),
  areas_of_strength TEXT,
  areas_for_improvement TEXT,
  supervisor_notes TEXT,
  remediation_required TEXT,
  remediation_completed_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id, module_id, supervisor_id)
);

CREATE TABLE shadowing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  session_date DATE NOT NULL,
  hours NUMERIC(4,1) NOT NULL CHECK (hours > 0),
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  location TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  mentor_notes TEXT,
  mentor_rating INTEGER CHECK (mentor_rating BETWEEN 1 AND 5),
  photo_evidence_url TEXT,
  incident_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================

CREATE TABLE volunteer_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'expired', 'suspended', 'revoked', 'superseded'
  )),
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES auth.users(id),
  status_reason TEXT,
  verification_hash TEXT NOT NULL,
  pdf_url TEXT,
  final_score INTEGER,
  shadowing_hours NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id, issued_at)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_training_progress_user ON training_user_progress(user_id);
CREATE INDEX idx_training_progress_status ON training_user_progress(status);
CREATE INDEX idx_training_progress_expires ON training_user_progress(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_quiz_attempts_user ON training_quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_module ON training_quiz_attempts(module_id);
CREATE INDEX idx_questions_module ON training_questions(module_id);
CREATE INDEX idx_questions_active ON training_questions(is_active) WHERE is_active = true;
CREATE INDEX idx_certifications_user ON volunteer_certifications(user_id);
CREATE INDEX idx_certifications_status ON volunteer_certifications(status);
CREATE INDEX idx_certifications_expires ON volunteer_certifications(expires_at);
CREATE INDEX idx_background_checks_user ON volunteer_background_checks(user_id);
CREATE INDEX idx_background_checks_status ON volunteer_background_checks(status);
CREATE INDEX idx_exposure_log_user ON volunteer_exposure_log(user_id);
CREATE INDEX idx_exposure_log_time ON volunteer_exposure_log(occurred_at);
CREATE INDEX idx_cooldown_user ON volunteer_cooldown_events(user_id);
CREATE INDEX idx_cooldown_ends ON volunteer_cooldown_events(ends_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_exposure_score(p_user_id UUID, p_window_minutes INTEGER DEFAULT 60)
RETURNS INTEGER AS $$
DECLARE v_score INTEGER;
BEGIN
  SELECT COALESCE(SUM(severity), 0) INTO v_score
  FROM volunteer_exposure_log
  WHERE user_id = p_user_id
    AND occurred_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
    AND counted_in_window = true;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_active_cooldown(p_user_id UUID, p_action TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE v_has_cooldown BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM volunteer_cooldown_events
    WHERE user_id = p_user_id AND ends_at > NOW() AND overridden_by IS NULL
      AND (p_action IS NULL OR restricted_actions ? p_action)
  ) INTO v_has_cooldown;
  RETURN v_has_cooldown;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_prerequisites_met(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_unmet_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unmet_count
  FROM training_prerequisites tp
  LEFT JOIN training_user_progress tup 
    ON tup.module_id = tp.prerequisite_module_id AND tup.user_id = p_user_id
    AND tup.status = 'completed' AND (tup.expires_at IS NULL OR tup.expires_at > NOW())
  WHERE tp.module_id = p_module_id AND tup.id IS NULL;
  RETURN v_unmet_count = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_cleared_background_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_cleared BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM volunteer_background_checks
    WHERE user_id = p_user_id AND status = 'cleared'
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_cleared;
  RETURN v_cleared;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_certificate_number(p_module_slug TEXT, p_track TEXT)
RETURNS TEXT AS $$
DECLARE v_prefix TEXT; v_seq INTEGER; v_year TEXT;
BEGIN
  v_prefix := 'P911-' || UPPER(SUBSTRING(p_track FROM 1 FOR 3));
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(certificate_number, '.*-(\d+)$', '\1'), '')::INTEGER), 0) + 1
  INTO v_seq FROM volunteer_certifications
  WHERE certificate_number LIKE v_prefix || '-' || v_year || '-%';
  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_training_modules_updated BEFORE UPDATE ON training_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_training_progress_updated BEFORE UPDATE ON training_user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_background_checks_updated BEFORE UPDATE ON volunteer_background_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION check_exposure_cooldown() RETURNS TRIGGER AS $$
DECLARE v_score_60min INTEGER; v_score_24hr INTEGER;
BEGIN
  v_score_60min := calculate_exposure_score(NEW.user_id, 60);
  v_score_24hr := calculate_exposure_score(NEW.user_id, 1440);
  IF v_score_60min >= 2 AND NOT has_active_cooldown(NEW.user_id) THEN
    INSERT INTO volunteer_cooldown_events (user_id, trigger_reason, cooldown_type, restricted_actions, ends_at)
    VALUES (NEW.user_id, '2_code_red_60min', 'short_break', '["code_red_triage"]'::jsonb, NOW() + INTERVAL '15 minutes');
  ELSIF v_score_24hr >= 5 AND NOT has_active_cooldown(NEW.user_id) THEN
    INSERT INTO volunteer_cooldown_events (user_id, trigger_reason, cooldown_type, restricted_actions, ends_at)
    VALUES (NEW.user_id, '5_code_red_24hr', 'tier_restriction', '["code_red_triage", "code_yellow_triage"]'::jsonb, NOW() + INTERVAL '12 hours');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_exposure_cooldown_check AFTER INSERT ON volunteer_exposure_log
  FOR EACH ROW EXECUTE FUNCTION check_exposure_cooldown();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE training_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON training_user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON training_user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own attempts" ON training_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own certs" ON volunteer_certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public verify certs" ON volunteer_certifications FOR SELECT USING (true);
