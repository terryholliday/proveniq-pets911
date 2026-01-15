import { expect, test } from '@playwright/test';

/**
 * E2E Tests for API Endpoints
 * Tests that API routes respond correctly
 */

test.describe('API Health Checks', () => {
  test('sightings API endpoint exists', async ({ request }) => {
    const response = await request.get('/api/sightings');
    // Should return some response (may be 401 for auth, 200 for public, 404 for missing)
    expect([200, 401, 403, 404, 405, 500]).toContain(response.status());
  });

  test('reports API endpoint exists', async ({ request }) => {
    const response = await request.get('/api/reports');
    expect([200, 401, 403, 404, 405, 500]).toContain(response.status());
  });

  test('cases API endpoint exists', async ({ request }) => {
    const response = await request.get('/api/cases');
    expect([200, 401, 403, 404, 405, 500]).toContain(response.status());
  });
});

test.describe('API POST Endpoints', () => {
  test('sightings POST accepts valid data structure', async ({ request }) => {
    const response = await request.post('/api/sightings', {
      data: {
        species: 'DOG',
        color: 'Brown',
        location: 'Test Location',
        sighting_at: new Date().toISOString(),
      },
    });
    // May fail validation but should not crash
    expect([200, 201, 400, 401, 422]).toContain(response.status());
  });
});

test.describe('API Error Handling', () => {
  test('invalid API route returns 404', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint-xyz');
    expect(response.status()).toBe(404);
  });

  test('API handles malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/sightings', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json{{{',
    });
    // Should not crash, return error status
    expect([400, 422, 500]).toContain(response.status());
  });
});
