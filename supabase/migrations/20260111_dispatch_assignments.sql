CREATE TABLE IF NOT EXISTS dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_request_id UUID NOT NULL REFERENCES dispatch_requests(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id),
  action TEXT NOT NULL CHECK (action IN ('OFFERED', 'ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REASSIGNED')),
  assigned_by_user_id UUID,
  assigned_by_volunteer_id UUID REFERENCES volunteers(id),
  note TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_dispatch ON dispatch_assignments(dispatch_request_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_volunteer ON dispatch_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_action ON dispatch_assignments(action);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_created_at ON dispatch_assignments(created_at);

ALTER TABLE dispatch_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant dispatch assignments" ON dispatch_assignments
  FOR SELECT USING (
    dispatch_request_id IN (
      SELECT id FROM dispatch_requests
      WHERE auth.uid()::text = requester_id
         OR volunteer_id IN (SELECT id FROM volunteers WHERE user_id::uuid = auth.uid())
    )
  );

GRANT ALL ON dispatch_assignments TO service_role;
