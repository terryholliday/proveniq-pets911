-- Defense in depth: require explicit marker columns whenever privileged capabilities are present.
-- This prevents accidental privilege escalation if a server route ever forgets to sanitize inputs.

ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS sysop_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderator_granted_at TIMESTAMPTZ;

-- Backfill existing privileged volunteers (if any) to avoid future update surprises.
UPDATE volunteers
SET sysop_granted_at = COALESCE(sysop_granted_at, created_at)
WHERE capabilities @> ARRAY['SYSOP']::text[];

UPDATE volunteers
SET moderator_granted_at = COALESCE(moderator_granted_at, created_at)
WHERE capabilities @> ARRAY['MODERATOR']::text[];

CREATE OR REPLACE FUNCTION enforce_privileged_capability_markers()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.capabilities @> ARRAY['SYSOP']::text[] AND NEW.sysop_granted_at IS NULL THEN
    RAISE EXCEPTION 'SYSOP capability requires sysop_granted_at';
  END IF;

  IF NEW.capabilities @> ARRAY['MODERATOR']::text[] AND NEW.moderator_granted_at IS NULL THEN
    RAISE EXCEPTION 'MODERATOR capability requires moderator_granted_at';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_privileged_capability_markers ON volunteers;
CREATE TRIGGER trg_enforce_privileged_capability_markers
BEFORE INSERT OR UPDATE OF capabilities ON volunteers
FOR EACH ROW
EXECUTE PROCEDURE enforce_privileged_capability_markers();

