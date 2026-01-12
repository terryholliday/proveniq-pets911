import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const liveDbReady =
  process.env.E2E_LIVE_DB === '1' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!liveDbReady) {
  test.describe('moderator dispatch procedures (live DB)', () => {
    test('skipped (requires E2E_LIVE_DB=1 + Supabase keys)', async () => {
      test.skip(true, 'Set E2E_LIVE_DB=1 and provide Supabase env vars to run this suite.');
    });
  });
} else {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminDb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const runId = crypto.randomUUID();
  const createdDispatchIds: string[] = [];
  const createdVolunteerIds: string[] = [];
  let moderatorUserId: string | null = null;
  let moderatorEmail: string | null = null;
  let moderatorPassword: string | null = null;
  let accessToken: string | null = null;
  let pickupAddress: string;
  let candidateVolunteerId: string;
  let candidateVolunteerName: string;

  async function cleanup() {
    try {
      if (createdDispatchIds.length > 0) {
        await adminDb.from('dispatch_assignments').delete().in('dispatch_request_id', createdDispatchIds);
        await adminDb.from('dispatch_notifications').delete().in('dispatch_request_id', createdDispatchIds);
        await adminDb.from('dispatch_requests').delete().in('id', createdDispatchIds);
      }
      if (createdVolunteerIds.length > 0) {
        await adminDb.from('volunteers').delete().in('id', createdVolunteerIds);
      }
      if (moderatorUserId) {
        await adminDb.auth.admin.deleteUser(moderatorUserId);
      }
    } catch {
    }
  }

  test.describe.serial('moderator dispatch procedures (live DB)', () => {
    test.beforeAll(async () => {
      pickupAddress = `E2E Pickup ${runId}`;
      candidateVolunteerName = `E2E Candidate ${runId.slice(0, 8)}`;

      moderatorEmail = `e2e-moderator-${runId}@example.com`;
      moderatorPassword = `Pw!${runId.replace(/-/g, '').slice(0, 20)}a`;

      const { data: createdUser, error: userError } = await adminDb.auth.admin.createUser({
        email: moderatorEmail,
        password: moderatorPassword,
        email_confirm: true,
      });

      expect(userError, `auth user create failed: ${userError?.message}`).toBeNull();
      expect(createdUser.user?.id).toBeTruthy();
      moderatorUserId = createdUser.user!.id;

      // Moderator volunteer profile (used for role enforcement).
      const moderatorPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const { data: modVolunteer, error: modVolunteerError } = await adminDb
        .from('volunteers')
        .insert({
          user_id: moderatorUserId,
          status: 'ACTIVE',
          display_name: `E2E Moderator ${runId.slice(0, 8)}`,
          phone: moderatorPhone,
          email: moderatorEmail,
          primary_county: 'GREENBRIER',
          address_city: 'Lewisburg',
          address_zip: '24901',
          home_lat: 37.8018,
          home_lng: -80.4456,
          capabilities: ['MODERATOR'],
          max_response_radius_miles: 50,
          last_active_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      expect(modVolunteerError, `moderator volunteer insert failed: ${modVolunteerError?.message}`).toBeNull();
      expect(modVolunteer?.id).toBeTruthy();
      createdVolunteerIds.push(modVolunteer!.id);

      // Candidate volunteer (the one we will assign).
      const candidatePhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const { data: candidateVolunteer, error: candidateVolunteerError } = await adminDb
        .from('volunteers')
        .insert({
          user_id: crypto.randomUUID(),
          status: 'ACTIVE',
          display_name: candidateVolunteerName,
          phone: candidatePhone,
          email: null,
          primary_county: 'GREENBRIER',
          address_city: 'Lewisburg',
          address_zip: '24901',
          home_lat: 37.8010,
          home_lng: -80.4450,
          capabilities: ['EMERGENCY_RESPONSE'],
          max_response_radius_miles: 100,
          available_immediately: true,
          last_active_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      expect(candidateVolunteerError, `candidate volunteer insert failed: ${candidateVolunteerError?.message}`).toBeNull();
      expect(candidateVolunteer?.id).toBeTruthy();
      candidateVolunteerId = candidateVolunteer!.id;
      createdVolunteerIds.push(candidateVolunteerId);

      // Seed a pending dispatch request.
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { data: dispatch, error: dispatchError } = await adminDb
        .from('dispatch_requests')
        .insert({
          request_type: 'EMERGENCY_ASSIST',
          priority: 'HIGH',
          species: 'DOG',
          animal_size: 'MEDIUM',
          animal_condition: 'Injured paw',
          needs_crate: false,
          pickup_lat: 37.8010,
          pickup_lng: -80.4450,
          pickup_address: pickupAddress,
          dropoff_lat: null,
          dropoff_lng: null,
          dropoff_address: null,
          county: 'GREENBRIER',
          requester_id: `e2e:${runId}`,
          requester_name: 'E2E Requester',
          requester_phone: '+15550003333',
          volunteer_id: null,
          volunteer_name: null,
          volunteer_phone: null,
          status: 'PENDING',
          requested_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .select('id')
        .single();

      expect(dispatchError, `dispatch insert failed: ${dispatchError?.message}`).toBeNull();
      expect(dispatch?.id).toBeTruthy();
      createdDispatchIds.push(dispatch!.id);

      // Obtain an access token for calling admin APIs.
      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: signIn, error: signInError } = await authClient.auth.signInWithPassword({
        email: moderatorEmail,
        password: moderatorPassword,
      });

      expect(signInError, `sign-in failed: ${signInError?.message}`).toBeNull();
      expect(signIn.session?.access_token).toBeTruthy();
      accessToken = signIn.session!.access_token;
    });

    test.afterAll(async () => {
      await cleanup();
    });

    test('admin APIs: queue -> candidates -> assign -> audit ledger', async ({ request }) => {
      expect(accessToken).toBeTruthy();
      expect(createdDispatchIds.length).toBeGreaterThan(0);

      const dispatchId = createdDispatchIds[0];

      const queueRes = await request.get('/api/admin/dispatch/queue', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(queueRes.ok()).toBeTruthy();
      const queueJson = await queueRes.json();
      expect(queueJson?.success).toBe(true);
      const queueIds = (queueJson?.data || []).map((d: any) => d.id);
      expect(queueIds).toContain(dispatchId);

      const candidatesRes = await request.post('/api/admin/dispatch/assign', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { dispatch_id: dispatchId },
      });
      expect(candidatesRes.ok()).toBeTruthy();
      const candidatesJson = await candidatesRes.json();
      expect(candidatesJson?.success).toBe(true);
      const candidates = candidatesJson?.data?.candidates as any[];
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates.map((c) => c.volunteer_id)).toContain(candidateVolunteerId);

      const assignRes = await request.post('/api/admin/dispatch/assign', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { dispatch_id: dispatchId, volunteer_id: candidateVolunteerId, mode: 'ASSIGN_ONLY' },
      });
      expect(assignRes.ok()).toBeTruthy();
      const assignJson = await assignRes.json();
      expect(assignJson?.success).toBe(true);
      expect(assignJson?.data?.dispatch_request?.volunteer_id).toBe(candidateVolunteerId);

      const { data: ledger, error: ledgerError } = await adminDb
        .from('dispatch_assignments')
        .select('action, assigned_by_user_id')
        .eq('dispatch_request_id', dispatchId)
        .eq('action', 'OFFERED')
        .limit(5);

      expect(ledgerError, `ledger query failed: ${ledgerError?.message}`).toBeNull();
      expect((ledger || []).length).toBeGreaterThan(0);
      expect(ledger![0].assigned_by_user_id).toBe(moderatorUserId);
    });

    test('UI: moderator can assign from /admin/mods/dispatch', async ({ page }) => {
      test.setTimeout(120_000);
      expect(moderatorEmail).toBeTruthy();
      expect(moderatorPassword).toBeTruthy();

      await page.goto(`/login?redirectTo=${encodeURIComponent('/admin/mods/dispatch')}`);

      await page.locator('input[type="email"]').fill(moderatorEmail!);
      await page.locator('input[type="password"]').fill(moderatorPassword!);
      await page.getByRole('button', { name: 'Sign in' }).click();

      await expect(page).toHaveURL(/\/admin\/mods\/dispatch/);
      await expect(page.getByText(pickupAddress, { exact: true }).first()).toBeVisible();

      await page.getByText(pickupAddress, { exact: true }).first().click();
      await page.getByRole('button', { name: 'Find Candidates' }).click();

      const candidateRow = page.locator('div', { hasText: candidateVolunteerName }).first();
      await expect(candidateRow).toBeVisible();
      await candidateRow.getByRole('button', { name: 'Assign' }).click();

      await expect(page.getByText('Assigned to:').first()).toBeVisible();
      await expect(page.getByText(candidateVolunteerName, { exact: true }).first()).toBeVisible();
    });
  });
}
