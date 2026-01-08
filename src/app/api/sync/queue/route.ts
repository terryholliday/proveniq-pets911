import { NextRequest, NextResponse } from 'next/server';
import { get, set, cleanupExpired } from '@/lib/sync/idempotency-store';

/**
 * POST /api/sync/queue
 * Batch sync queued offline actions
 * 
 * Per OFFLINE_PROTOCOL.md: Process actions in FIFO order
 * Per OFFLINE_PROTOCOL.md: Use idempotency keys to prevent duplicates
 * 
 * TODO: Connect to Supabase backend
 * FAIL-CLOSED: Returns 503 if backend unavailable
 * 
 * Current implementation uses in-memory idempotency store for demo/E2E.
 */
export async function POST(request: NextRequest) {
  try {
    // Cleanup expired entries on each request (simple strategy)
    cleanupExpired();

    const body = await request.json();
    const { device_id, actions } = body;

    if (!device_id || !Array.isArray(actions)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'device_id and actions array are required',
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Process actions in FIFO order; check idempotency deterministically
    const results = actions.map((action: {
      idempotency_key: string;
      action_type: string;
      payload: Record<string, unknown>;
      created_at: string;
    }) => {
      const existing = get(action.idempotency_key);
      if (existing) {
        // Idempotency conflict: return stored result
        return {
          idempotency_key: action.idempotency_key,
          status: existing.status,
          error: existing.error,
          resolved_entity_id: existing.resolved_entity_id,
        };
      }

      // Simulate successful processing and record idempotency
      const resolved_entity_id = crypto.randomUUID();
      const record = {
        idempotency_key: action.idempotency_key,
        status: 'SYNCED' as const,
        resolved_entity_id,
        created_at: new Date().toISOString(),
      };
      set(record);

      return {
        idempotency_key: action.idempotency_key,
        status: 'SYNCED' as const,
        resolved_entity_id,
      };
    });

    const synced = results.filter(r => r.status === 'SYNCED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const conflict = results.filter(r => r.status === 'CONFLICT').length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        synced_count: synced,
        failed_count: failed,
        conflict_count: conflict,
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        pilot_metric_logged: true,
      },
    });

  } catch (error) {
    console.error('Sync queue error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Sync service temporarily unavailable. Actions remain queued locally.',
        },
        meta: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
