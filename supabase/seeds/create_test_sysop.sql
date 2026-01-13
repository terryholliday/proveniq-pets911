-- ============================================================
-- CREATE TEST SYSOP ACCOUNT
-- Run this in Supabase SQL Editor to create a test account
-- with full SYSOP privileges for screenshot documentation
-- ============================================================

-- IMPORTANT: Change these values before running!
-- Email: test-sysop@pet911.org
-- Password: TestSysop2026! (change in Supabase Auth after creation)

-- Step 1: Create the auth user via Supabase Dashboard or API
-- Go to Authentication > Users > Add User
-- Email: test-sysop@pet911.org
-- Password: TestSysop2026!

-- Step 2: After creating the user, run this SQL to grant SYSOP role
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'test-sysop@pet911.org';
BEGIN
    -- Find the user by email
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found. Please create the user first via Supabase Dashboard.', v_email;
        RAISE NOTICE 'Go to Authentication > Users > Add User';
        RETURN;
    END IF;
    
    -- Update user metadata to grant SYSOP role
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"sysop"'
    )
    WHERE id = v_user_id;
    
    -- Also set app_metadata for additional security checks
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"sysop"'
    )
    WHERE id = v_user_id;
    
    RAISE NOTICE 'SUCCESS: User % granted SYSOP privileges', v_email;
    RAISE NOTICE 'User ID: %', v_user_id;
    
    -- Create volunteer record if not exists
    INSERT INTO volunteers (user_id, status, capabilities, full_name)
    VALUES (
        v_user_id, 
        'ACTIVE', 
        ARRAY['MODERATOR', 'ADMIN', 'SYSOP']::text[],
        'Test SYSOP Account'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        capabilities = ARRAY['MODERATOR', 'ADMIN', 'SYSOP']::text[],
        status = 'ACTIVE';
    
    RAISE NOTICE 'Volunteer record created/updated with SYSOP capabilities';
    
END $$;

-- ============================================================
-- ALTERNATIVE: Direct update if you know the user ID
-- ============================================================

-- Uncomment and replace with actual UUID:
/*
UPDATE auth.users
SET 
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"sysop"'
    ),
    raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"sysop"'
    )
WHERE id = 'YOUR-UUID-HERE';
*/

-- ============================================================
-- VERIFY: Check the user has correct role
-- ============================================================

SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as user_role,
    raw_app_meta_data->>'role' as app_role,
    created_at
FROM auth.users
WHERE email = 'test-sysop@pet911.org';

-- ============================================================
-- GRANT EXISTING USER SYSOP (by email)
-- ============================================================

-- If you want to grant SYSOP to an existing user by email:
/*
UPDATE auth.users
SET 
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"sysop"'
    )
WHERE email = 'your-email@example.com';
*/

-- ============================================================
-- CLEANUP: Remove test account when done
-- ============================================================

-- To remove the test account after documentation:
/*
DELETE FROM volunteers WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'test-sysop@pet911.org'
);

-- Then delete from Supabase Dashboard: Authentication > Users > Delete
*/
