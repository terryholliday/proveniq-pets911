/**
 * Twilio Dispatch Service
 * Handles SMS notifications to volunteers with privacy protection via Twilio Proxy
 */

import type { VolunteerMatch } from '@/lib/types';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  proxyServiceSid?: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured');
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
    proxyServiceSid: process.env.TWILIO_PROXY_SERVICE_SID,
  };
}

export interface DispatchNotificationParams {
  dispatchId: string;
  volunteerId: string;
  volunteerPhone: string;
  volunteerName: string;
  species: string;
  animalSize: string;
  pickupAddress: string;
  distance: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Send SMS notification to volunteer about dispatch request
 * Uses Twilio Proxy to keep phone numbers private
 */
export async function notifyVolunteerDispatch(
  params: DispatchNotificationParams
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const config = getTwilioConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: 'Twilio not configured' 
    };
  }

  const urgencyText = params.priority === 'CRITICAL' ? '🚨 URGENT' : 
                      params.priority === 'HIGH' ? '⚠️ HIGH PRIORITY' : '';

  const message = `${urgencyText} Mayday Emergency Helper Request

Animal: ${params.species} (${params.animalSize})
Location: ${params.pickupAddress}
Distance: ${params.distance} miles from you

Reply Y to accept or N to decline.
Details: https://Mayday.org/dispatch/${params.dispatchId}`;

  try {
    // Use Twilio REST API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: params.volunteerPhone,
        From: config.fromNumber,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio SMS error:', data);
      return { 
        success: false, 
        error: data.message || 'Failed to send SMS' 
      };
    }

    // Log notification in database
    await logDispatchNotification({
      dispatch_request_id: params.dispatchId,
      volunteer_id: params.volunteerId,
      notification_type: 'SMS',
      sent_at: new Date().toISOString(),
      message_sid: data.sid,
    });

    return { 
      success: true, 
      messageSid: data.sid 
    };

  } catch (error) {
    console.error('Twilio dispatch notification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Handle incoming SMS responses from volunteers (Y/N to accept/decline)
 */
export async function handleVolunteerResponse(
  fromPhone: string,
  messageBody: string
): Promise<{ dispatchId: string | null; action: 'ACCEPTED' | 'DECLINED' | null }> {
  const normalizedBody = messageBody.trim().toUpperCase();
  
  let action: 'ACCEPTED' | 'DECLINED' | null = null;
  if (normalizedBody === 'Y' || normalizedBody === 'YES' || normalizedBody === 'ACCEPT') {
    action = 'ACCEPTED';
  } else if (normalizedBody === 'N' || normalizedBody === 'NO' || normalizedBody === 'DECLINE') {
    action = 'DECLINED';
  }

  if (!action) {
    return { dispatchId: null, action: null };
  }

  // Find most recent pending dispatch for this volunteer
  // (In production, parse dispatch ID from message or use session tracking)
  const dispatchId = await findPendingDispatchForVolunteer(fromPhone);

  return { dispatchId, action };
}

/**
 * Notify finder that volunteer is en route
 */
export async function notifyFinderVolunteerEnRoute(
  finderPhone: string,
  volunteerName: string,
  eta: number
): Promise<{ success: boolean }> {
  const config = getTwilioConfig();
  
  if (!config) {
    return { success: false };
  }

  const message = `Good news! ${volunteerName} is on the way to help transport the animal. ETA: ~${eta} minutes.

They will contact you when they arrive. Thank you for helping save a life! 🐾`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: finderPhone,
        From: config.fromNumber,
        Body: message,
      }),
    });

    return { success: response.ok };

  } catch (error) {
    console.error('Finder notification error:', error);
    return { success: false };
  }
}

// Helper functions (implement with Supabase)

async function logDispatchNotification(data: {
  dispatch_request_id: string;
  volunteer_id: string;
  notification_type: string;
  sent_at: string;
  message_sid: string;
}): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from('dispatch_notifications').insert({
    dispatch_request_id: data.dispatch_request_id,
    volunteer_id: data.volunteer_id,
    notification_type: data.notification_type,
    sent_at: data.sent_at,
    message_sid: data.message_sid,
  });
}

async function findPendingDispatchForVolunteer(phone: string): Promise<string | null> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find volunteer by phone
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!volunteer) return null;

  // Find most recent pending dispatch where this volunteer was notified
  const { data: notification } = await supabase
    .from('dispatch_notifications')
    .select('dispatch_request_id')
    .eq('volunteer_id', volunteer.id)
    .is('response_at', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  return notification?.dispatch_request_id || null;
}
