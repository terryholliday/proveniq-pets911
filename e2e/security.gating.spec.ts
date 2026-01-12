import { test, expect } from '@playwright/test';

test.describe('security gating', () => {
  test('blocks unauthenticated access to privileged APIs', async ({ request }) => {
    const cases: Array<{
      name: string;
      run: () => Promise<{ status: number }>;
      expectedStatus: number;
    }> = [
      {
        name: 'GET /api/admin/volunteers',
        run: async () => {
          const res = await request.get('/api/admin/volunteers?filter=all');
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'POST /api/admin/grant-sysop',
        run: async () => {
          const res = await request.post('/api/admin/grant-sysop', {
            data: { email: 'attacker@example.com' },
          });
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'POST /api/dispatch/request',
        run: async () => {
          const res = await request.post('/api/dispatch/request', {
            data: {
              request_type: 'TRANSPORT',
              priority: 'HIGH',
              species: 'DOG',
              animal_size: 'MEDIUM',
              needs_crate: false,
              pickup_lat: 37.7954,
              pickup_lng: -80.4462,
              pickup_address: 'Test address',
              county: 'GREENBRIER',
            },
          });
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'GET /api/dispatch/history',
        run: async () => {
          const res = await request.get('/api/dispatch/history');
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'GET /api/volunteers/profile',
        run: async () => {
          const res = await request.get('/api/volunteers/profile');
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'POST /api/volunteers/register',
        run: async () => {
          const res = await request.post('/api/volunteers/register', {
            data: {
              display_name: 'Attacker',
              phone: '+15555550100',
              primary_county: 'GREENBRIER',
              address_city: 'Lewisburg',
              address_zip: '24901',
              capabilities: ['SYSOP'],
              emergency_contact_name: 'EC',
              emergency_contact_phone: '+15555550101',
            },
          });
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
      {
        name: 'POST /api/notifications/emergency-vet',
        run: async () => {
          const res = await request.post('/api/notifications/emergency-vet', {
            headers: { 'Idempotency-Key': 'test-idem-1' },
            data: { contact_id: 'vet-greenbrier-1', emergency_summary: 'critical', callback_number: '+15555550100' },
          });
          return { status: res.status() };
        },
        expectedStatus: 401,
      },
    ];

    for (const c of cases) {
      const { status } = await c.run();
      expect(status, c.name).toBe(c.expectedStatus);
    }
  });

  test('disables diagnostics endpoints in production', async ({ request }) => {
    const res = await request.get('/api/debug');
    expect(res.status()).toBe(404);
  });

  test('rejects unsigned Twilio webhook when configured', async ({ request }) => {
    test.skip(!process.env.TWILIO_AUTH_TOKEN, 'TWILIO_AUTH_TOKEN not configured');
    const res = await request.post('/api/webhooks/twilio', {
      form: { From: '+15555550100', Body: 'Y', MessageSid: 'SM123' },
    });
    expect(res.status()).toBe(401);
  });
});

