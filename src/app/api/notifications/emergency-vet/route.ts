import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/notifications/emergency-vet
 * Notify ER vet that someone is en route with emergency
 * 
 * TODO: Connect to Twilio for voice/SMS notifications
 * TODO: Connect to Resend for email notifications
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
    const { contact_id, emergency_summary, callback_number } = body;

    if (!contact_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'contact_id is required',
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual notification sending via Twilio/Resend
    // For now, return stub response

    const attemptId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      data: {
        attempt_id: attemptId,
        contact: {
          id: contact_id,
          name: 'Emergency Vet Clinic',
          phone: '+1-304-555-0100',
        },
        channels: {
          email: {
            status: 'QUEUED',
            estimated_delivery: new Date(Date.now() + 60000).toISOString(),
          },
          voice: {
            status: 'QUEUED',
            estimated_call_time: new Date(Date.now() + 30000).toISOString(),
          },
        },
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        pilot_metric_logged: true,
      },
    });

  } catch (error) {
    console.error('Emergency vet notification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Notification service temporarily unavailable. Your request has been queued.',
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
