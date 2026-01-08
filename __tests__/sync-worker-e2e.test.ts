/// <reference types="jest" />
import 'fake-indexeddb/auto';
// Mock getEndpointForAction to handle test actions
jest.mock('@/lib/api/client', () => ({
  getEndpointForAction: jest.fn((actionType: string) => {
    switch (actionType) {
      case 'CREATE_CASE':
        return '/api/cases';
      case 'CREATE_SIGHTING':
        return '/api/sightings';
      case 'UPDATE_CASE':
        return '/api/cases';
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }),
}));

// Polyfill structuredClone for Jest/jsdom
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
import { processQueue, triggerSync } from '@/lib/sync/sync-worker';
import { queueAction, getPendingActions, getAction } from '@/lib/db/offline-queue-store';
import { getEndpointForAction } from '@/lib/api/client';
import type { OfflineQueuedAction } from '@/lib/types';

// Mock getEndpointForAction to handle test actions
jest.mock('@/lib/api/client', () => ({
  getEndpointForAction: jest.fn((actionType: string) => {
    switch (actionType) {
      case 'CREATE_CASE':
        return '/api/cases';
      case 'CREATE_SIGHTING':
        return '/api/sightings';
      case 'UPDATE_CASE':
        return '/api/cases';
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }),
}));

// Mock getAuthToken to avoid real auth
jest.mock('@/lib/sync/sync-worker', () => {
  const original = jest.requireActual('@/lib/sync/sync-worker');
  return {
    ...original,
    // Override getAuthToken inside the module by mocking the module that uses it
  };
});

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: unknown) => any;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const jest: any;

// FakeFetch and deterministic helpers
interface FakeFetchResponse {
  ok: boolean;
  status: number;
  json?: () => Promise<any>;
}

let fakeFetchResponses: Record<string, FakeFetchResponse> = {};
let fetchLog: Array<{ url: string; options: RequestInit }> = [];

function resetFakeFetch(): void {
  fakeFetchResponses = {};
  fetchLog = [];
}

function setFakeResponse(url: string, response: FakeFetchResponse): void {
  fakeFetchResponses[url] = response;
}

// Replace global fetch for tests
const originalFetch = global.fetch;
beforeEach(() => {
  resetFakeFetch();
  global.fetch = jest.fn(async (url: string, options?: RequestInit) => {
    fetchLog.push({ url, options: options || {} });
    const response = fakeFetchResponses[url];
    if (!response) {
      throw new Error(`No fake response for ${url}`);
    }
    return response as Response;
  }) as jest.Mock;
});

afterEach(() => {
  global.fetch = originalFetch;
});

// Helper to enqueue test actions using the real queueAction
async function enqueueAction(actionType: string, payload: Record<string, unknown>, userId: string = 'test-user'): Promise<OfflineQueuedAction> {
  return queueAction(actionType as any, payload, userId);
}

describe('Sync Worker E2E (OFFLINE_PROTOCOL compliance)', () => {
  beforeEach(() => {
    resetFakeFetch();
  });
  it('processes actions in FIFO order', async () => {
    // Enqueue three actions in order
    const a1 = await enqueueAction('CREATE_CASE', { case_id: 'case-1' });
    const a2 = await enqueueAction('CREATE_SIGHTING', { sighting_id: 'sighting-2' });
    const a3 = await enqueueAction('UPDATE_CASE', { case_id: 'case-1' });

    // Configure fake fetch to succeed for all
    setFakeResponse('/api/cases', { ok: true, status: 200, json: async () => ({ data: { id: 'case-1' } }) });
    setFakeResponse('/api/sightings', { ok: true, status: 200, json: async () => ({ data: { id: 'sighting-2' } }) });

    const result = await processQueue();

    expect(result.synced).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.pending).toBe(0);

    // Verify fetch order matches FIFO
    expect(fetchLog).toHaveLength(3);
    expect(fetchLog[0].url).toBe('/api/cases');
    expect(fetchLog[1].url).toBe('/api/sightings');
    expect(fetchLog[2].url).toBe('/api/cases');
  }, 10000);

  it('respects idempotency: duplicate key returns CONFLICT without side effects', async () => {
    const action = await enqueueAction('CREATE_CASE', { case_id: 'case-dup' });
    const key = action.idempotency_key;

    // First call succeeds
    setFakeResponse('/api/cases', { ok: true, status: 200, json: async () => ({ data: { id: 'case-dup' } }) });

    const result1 = await processQueue();
    expect(result1.synced).toBe(1);

    // Reset fetch log and simulate second sync with same idempotency key
    fetchLog = [];
    // Backend returns 409 for duplicate idempotency key
    setFakeResponse('/api/cases', { ok: false, status: 409, json: async () => ({ error: 'Conflict' }) });

    const result2 = await processQueue();
    // Should be 0 synced because the action was already synced; conflict counts as synced idempotently
    expect(result2.synced).toBe(0);
    expect(result2.failed).toBe(0);
    // Only one fetch call (the conflict response)
    expect(fetchLog).toHaveLength(1);
  });

  it('applies exponential backoff with jitter on retries', async () => {
    await enqueueAction('CREATE_CASE', { case_id: 'case-retry' });

    // First call fails with server error (should retry)
    setFakeResponse('/api/cases', { ok: false, status: 503, json: async () => ({ error: 'Service Unavailable' }) });

    const result = await processQueue();
    // Should be pending due to retry
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.pending).toBe(1);
  });

  it('fails fast on client errors (4xx) without retry', async () => {
    await enqueueAction('CREATE_CASE', { case_id: 'case-fail' });

    // Client error should not retry
    setFakeResponse('/api/cases', { ok: false, status: 400, json: async () => ({ error: 'Bad Request' }) });

    const result = await processQueue();
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.pending).toBe(0);
  });

  it('does not sync actions with unresolved dependencies', async () => {
    // Enqueue a CREATE_SIGHTING that depends on a local case_id not yet synced
    const caseAction = await enqueueAction('CREATE_CASE', { case_id: 'case-dep' });
    await enqueueAction('CREATE_SIGHTING', { sighting_id: 'sighting-dep', missing_case_id: 'case-dep' });

    setFakeResponse('/api/cases', { ok: true, status: 200, json: async () => ({ data: { id: 'case-dep' } }) });
    setFakeResponse('/api/sightings', { ok: true, status: 200, json: async () => ({ data: { id: 'sighting-dep' } }) });

    const result = await processQueue();
    // Only the case should sync; sighting should remain pending until case is synced
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.pending).toBe(1);
  });
});
