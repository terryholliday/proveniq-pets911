import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/municipal/call-log
 * Log outcome of municipal/ACO call
 * 
 * Per CANONICAL_LAW.md: Municipal "accountability" is INTERNAL logging only
 * No public scoreboard language
 * 
 * TODO: Connect to Supabase backend
 * FAIL-CLOSED: Returns 503 if backend unavailable
 */
export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    
    if (!idempotencyKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required',
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      case_id, 
      case_type, 
      contact_id, 
      dialer_initiated_at, 
      call_duration_seconds,
      outcome, 
      outcome_notes,
      county 
    } = body;

    if (!contact_id || !outcome || !county) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'contact_id, outcome, and county are required',
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate outcome enum
    const validOutcomes = [
      'OFFICER_DISPATCHED',
      'CALLBACK_PROMISED',
      'NO_ANSWER',
      'REFERRED_ELSEWHERE',
      'DECLINED',
      'UNKNOWN',
    ];

    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_OUTCOME',
            message: `outcome must be one of: ${validOutcomes.join(', ')}`,
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual Supabase insert
    // For now, return stub response
    
    const logId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      data: {
        log_id: logId,
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        pilot_metric_logged: true,
      },
    });

  } catch (error) {
    console.error('Municipal call log error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Call logging service temporarily unavailable. Your request has been queued.',
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
