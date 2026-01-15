-- Allow public (anonymous) users to submit sightings
-- This is required for the found pet reporting flow to work without authentication

-- Drop the existing restrictive policy for reporters
DROP POLICY IF EXISTS "reporters_manage_own_sightings" ON sighting;

-- Create policy allowing anyone to INSERT sightings
CREATE POLICY "public_can_insert_sightings" ON sighting 
FOR INSERT WITH CHECK (true);

-- Create policy allowing reporters to UPDATE/DELETE their own sightings (when logged in)
CREATE POLICY "reporters_update_own_sightings" ON sighting 
FOR UPDATE USING (reporter_id = get_current_user_id()) 
WITH CHECK (reporter_id = get_current_user_id());

CREATE POLICY "reporters_delete_own_sightings" ON sighting 
FOR DELETE USING (reporter_id = get_current_user_id());

-- Also allow public inserts for missing_pet_case (for lost pet reports)
DROP POLICY IF EXISTS "owners_manage_own_cases" ON missing_pet_case;

CREATE POLICY "public_can_insert_missing_cases" ON missing_pet_case 
FOR INSERT WITH CHECK (true);

CREATE POLICY "owners_update_own_cases" ON missing_pet_case 
FOR UPDATE USING (owner_id = get_current_user_id()) 
WITH CHECK (owner_id = get_current_user_id());

CREATE POLICY "owners_delete_own_cases" ON missing_pet_case 
FOR DELETE USING (owner_id = get_current_user_id());
