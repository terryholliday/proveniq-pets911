import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const liveDbReady =
  process.env.E2E_LIVE_DB === '1' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!liveDbReady) {
  test.describe('dispatch procedures (live DB)', () => {
    test('skipped (requires E2E_LIVE_DB=1 + Supabase keys)', async () => {
      test.skip(true, 'Set E2E_LIVE_DB=1 and provide Supabase env vars to run this suite.');
    });
  });
} else {
  const adminDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const runId = crypto.randomUUID();
  const createdDispatchIds: string[] = [];
  let volunteerId: string;
  let volunteerPhone: string;

  test.describe.serial('dispatch procedures (live DB)', () => {
    test.beforeAll(async () => {
      volunteerPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;

      const { data, error } = await adminDb
        .from('volunteers')
        .insert({
          user_id: crypto.randomUUID(),
          status: 'ACTIVE',
          display_name: `E2E Volunteer ${runId.slice(0, 8)}`,
          phone: volunteerPhone,
          email: null,
          primary_county: 'GREENBRIER',
          address_city: 'Lewisburg',
          address_zip: '24901',
          home_lat: 37.8018,
          home_lng: -80.4456,
          capabilities: ['EMERGENCY_RESPONSE'],
          max_response_radius_miles: 250,
          last_active_at: new Date().toISOString(),
        })
        .select('id, phone')
        .single();

      expect(error, `volunteer insert failed: ${error?.message}`).toBeNull();
      expect(data?.id).toBeTruthy();

      volunteerId = data!.id;
    });

    test.afterAll(async () => {
      // Best-effort cleanup (staging only).
      try {
        if (createdDispatchIds.length > 0) {
          await adminDb.from('dispatch_assignments').delete().in('dispatch_request_id', createdDispatchIds);
          await adminDb.from('dispatch_notifications').delete().in('dispatch_request_id', createdDispatchIds);
          await adminDb.from('dispatch_requests').delete().in('id', createdDispatchIds);
        }
        if (volunteerId) {
          await adminDb.from('volunteers').delete().eq('id', volunteerId);
        }
      } catch {
      }
    });

    test('create dispatch request returns ranked matches', async ({ request }) => {
      const requesterId = `e2e:${runId}`;

      const res = await request.post('/api/dispatch/request', {
        data: {
          request_type: 'EMERGENCY_ASSIST',
          priority: 'HIGH',
          species: 'DOG',
          animal_size: 'MEDIUM',
          animal_condition: 'Injured paw',
          needs_crate: false,
          pickup_lat: 37.8010,
          pickup_lng: -80.4450,
          pickup_address: 'Lewisburg, WV',
          county: 'GREENBRIER',
          requester_id: requesterId,
          requester_name: 'E2E Requester',
          requester_phone: '+15550001111',
        },
      });

      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      expect(json?.success).toBe(true);

      const dispatchId = json?.data?.dispatch_request?.id as string | undefined;
      expect(dispatchId).toBeTruthy();
      createdDispatchIds.push(dispatchId!);

      const matches = json?.data?.matches as any[] | undefined;
      expect(Array.isArray(matches)).toBe(true);
      expect(matches!.length).toBeGreaterThan(0);
      expect(matches![0]?.volunteer_id).toBe(volunteerId);
    });

    test('patching status appends audit ledger entry', async ({ request }) => {
      expect(createdDispatchIds.length).toBeGreaterThan(0);
      const dispatchId = createdDispatchIds[0];

      const res = await request.patch('/api/dispatch/request', {
        data: {
          dispatch_id: dispatchId,
          volunteer_id: volunteerId,
          status: 'ACCEPTED',
        },
      });

      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      expect(json?.success).toBe(true);
      expect(json?.data?.status).toBe('ACCEPTED');

      const { data: ledgerRows, error } = await adminDb
        .from('dispatch_assignments')
        .select('action, meta')
        .eq('dispatch_request_id', dispatchId)
        .eq('action', 'ACCEPTED');

      expect(error, `ledger query failed: ${error?.message}`).toBeNull();
      expect((ledgerRows || []).length).toBeGreaterThan(0);
    });

    test('twilio webhook accept updates dispatch + audit ledger', async ({ request }) => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { data: dispatch, error: dispatchError } = await adminDb
        .from('dispatch_requests')
        .insert({
          request_type: 'EMERGENCY_ASSIST',
          priority: 'HIGH',
          species: 'CAT',
          animal_size: 'SMALL',
          animal_condition: 'Dehydrated',
          needs_crate: false,
          pickup_lat: 37.8005,
          pickup_lng: -80.4451,
          pickup_address: 'Lewisburg, WV',
          dropoff_lat: null,
          dropoff_lng: null,
          dropoff_address: null,
          county: 'GREENBRIER',
          requester_id: `e2e:${runId}:twilio`,
          requester_name: 'E2E Requester',
          requester_phone: '+15550002222',
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

      const { error: notifError } = await adminDb.from('dispatch_notifications').insert({
        dispatch_request_id: dispatch!.id,
        volunteer_id: volunteerId,
        notification_type: 'SMS',
        sent_at: new Date().toISOString(),
        message_sid: `SM${runId.replace(/-/g, '').slice(0, 24)}`,
      } as any);

      expect(notifError, `notification insert failed: ${notifError?.message}`).toBeNull();

      const webhookRes = await request.post('/api/webhooks/twilio', {
        form: {
          From: volunteerPhone,
          Body: 'Y',
          MessageSid: `SM${runId.replace(/-/g, '').slice(0, 24)}A`,
        },
      });

      expect(webhookRes.ok()).toBeTruthy();
      const text = await webhookRes.text();
      expect(text).toContain('<Response>');

      const { data: updated, error: updatedError } = await adminDb
        .from('dispatch_requests')
        .select('status, volunteer_id')
        .eq('id', dispatch!.id)
        .single();

      expect(updatedError, `dispatch re-read failed: ${updatedError?.message}`).toBeNull();
      expect(updated?.status).toBe('ACCEPTED');
      expect(updated?.volunteer_id).toBe(volunteerId);
    });
  });
}
