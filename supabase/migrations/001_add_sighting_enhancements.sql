-- Add additional fields to sighting table for enhanced functionality
-- Migration: 001_add_sighting_enhancements.sql

-- Add priority, status, and notification-related fields
ALTER TABLE sighting 
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'RESOLVED')),
ADD COLUMN IF NOT EXISTS can_stay_with_animal BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rescuer_assigned TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_sighting_priority ON sighting(priority, status) WHERE status = 'ACTIVE';

-- Create index for status updates
CREATE INDEX IF NOT EXISTS idx_sighting_status ON sighting(status, updated_at DESC);

-- Create sighting_notification table for tracking notifications
CREATE TABLE IF NOT EXISTS sighting_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES sighting(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('STATUS_UPDATE', 'ETA_UPDATE', 'RESOLVER_ARRIVAL', 'SAFETY_GUIDE')),
  message TEXT NOT NULL,
  
  -- Recipient info
  recipient_id UUID REFERENCES user_profile(id),
  recipient_phone TEXT,
  recipient_email TEXT,
  
  -- Delivery tracking
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate notifications of same type for same sighting per day
  UNIQUE(sighting_id, type, DATE(created_at))
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_sighting_notification_sighting ON sighting_notification(sighting_id);
CREATE INDEX IF NOT EXISTS idx_sighting_notification_recipient ON sighting_notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sighting_notification_status ON sighting_notification(status);

-- Create sighting_status_log for tracking status changes
CREATE TABLE IF NOT EXISTS sighting_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES sighting(id) ON DELETE CASCADE,
  
  -- Status change details
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES user_profile(id),
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for status log
CREATE INDEX IF NOT EXISTS idx_sighting_status_log_sighting ON sighting_status_log(sighting_id);
CREATE INDEX IF NOT EXISTS idx_sighting_status_log_time ON sighting_status_log(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sighting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_sighting_updated_at
  BEFORE UPDATE ON sighting
  FOR EACH ROW
  EXECUTE FUNCTION update_sighting_updated_at();

-- RLS Policies for new tables
ALTER TABLE sighting_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting_status_log ENABLE ROW LEVEL SECURITY;

-- Policy for sighting notifications
CREATE POLICY "Users can view their own notifications" ON sighting_notification
  FOR SELECT
  USING (recipient_id = (SELECT id FROM user_profile WHERE firebase_uid = auth.uid()));

CREATE POLICY "Users can insert notifications for their sightings" ON sighting_notification
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sighting 
      WHERE sighting.id = sighting_notification.sighting_id 
      AND reporter_id = (SELECT id FROM user_profile WHERE firebase_uid = auth.uid())
    )
  );

-- Policy for status log (read-only for users)
CREATE POLICY "Users can view status log for their sightings" ON sighting_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sighting 
      WHERE sighting.id = sighting_status_log.sighting_id 
      AND reporter_id = (SELECT id FROM user_profile WHERE firebase_uid = auth.uid())
    )
  );
