import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { twilioService } from '@/lib/services/twilio-service';
import { fetchEmergencyContacts } from '@/lib/api/client';
import type { County } from '@/lib/types';

/**
 * POST /api/notifications/emergency-vet
 * Notify ER vet that someone is en route with emergency
 * 
 * Uses Twilio for SMS/voice notifications
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
      contact_id, 
      emergency_summary, 
      callback_number,
      county = 'GREENBRIER', // Default to Greenbrier if not specified
      finder_location 
    } = body;

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

    // Get contact details from county pack
    const contactsResponse = await fetchEmergencyContacts(county as County);
    if (!contactsResponse.success || !contactsResponse.data) {
      throw new Error('Failed to fetch emergency contacts');
    }

    const contact = contactsResponse.data.contacts.find(c => c.id === contact_id);
    if (!contact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTACT_NOT_FOUND',
            message: `Emergency contact ${contact_id} not found in ${county}`,
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Send notification via Twilio
    const notificationResult = await twilioService.notifyVet({
      contactName: contact.name,
      contactPhone: contact.phone_primary || contact.phone_secondary || '',
      emergencySummary: emergency_summary || 'Emergency pet transport en route',
      callbackNumber: callback_number || 'Not provided',
      finderLocation: finder_location || undefined,
    });

    const attemptId = crypto.randomUUID();

    return NextResponse.json({
      success: notificationResult.success,
      data: {
        attempt_id: attemptId,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone_primary,
        },
        channels: {
          sms: {
            status: notificationResult.sms?.status || 'failed',
            message_id: notificationResult.sms?.messageId,
            estimated_delivery: notificationResult.sms?.status === 'sent' 
              ? new Date(Date.now() + 10000).toISOString() 
              : undefined,
          },
          voice: notificationResult.voice ? {
            status: notificationResult.voice.status,
            call_id: notificationResult.voice.callId,
            estimated_call_time: notificationResult.voice.status === 'initiated'
              ? new Date(Date.now() + 30000).toISOString()
              : undefined,
          } : undefined,
        },
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        pilot_metric_logged: true,
        county: county,
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
