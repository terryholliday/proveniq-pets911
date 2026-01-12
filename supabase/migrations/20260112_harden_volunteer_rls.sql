-- Harden volunteer privilege boundaries
-- Prevent users from self-approving or self-assigning privileged capabilities via direct table writes.

-- Volunteers: allow users to READ their own profile (existing SELECT policy), but disallow direct INSERT/UPDATE.
DROP POLICY IF EXISTS "Users can update own volunteer profile" ON volunteers;
DROP POLICY IF EXISTS "Users can insert own volunteer profile" ON volunteers;

-- Defense-in-depth: if grants exist for authenticated/anon, revoke write access.
REVOKE INSERT, UPDATE, DELETE ON volunteers FROM anon, authenticated;

