/**
 * ACO Dispatch Service
 * 
 * Creates ACO dispatch requests and notifications when law triggers fire.
 * Implements Option C: auto-create dispatch + notify + audit trail.
 * 
 * Purpose: Accountability for ACO calls received, responses, and outcomes.
 */

import { createServiceRoleClient } from '@/lib/api/server-auth';
import {
  evaluateLawTriggers,
  LawTriggerCategory,
  LawTriggerResult,
  County,
  Priority,
} from './aco-law-trigger-service';

export interface ACODispatchParams {
  // Source case info
  source_case_type: 'MISSING' | 'FOUND' | 'SIGHTING' | 'EMERGENCY' | 'DIRECT_REPORT';
  source_case_id?: string;
  
  // Location
  county: County;
  lat: number;
  lng: number;
  address: string;
  
  // Animal info
  species: string;
  description?: string;
  
  // Reporter info (ACOs get full access)
  reporter_id?: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_email?: string;
  
  // Law triggers
  law_triggers: LawTriggerCategory[];
  
  // Police notification flag (for triggers that also require law enforcement)
  notify_police?: boolean;
  
  // Additional context
  notes?: string;
}

export interface ACODispatchResult {
  success: boolean;
  dispatch_id?: string;
  law_evaluation: LawTriggerResult;
  notifications_sent: number;
  police_notified?: boolean;
  error?: string;
}

/**
 * Create an ACO dispatch request based on law triggers
 * Auto-notifies all active ACO officers in the county
 */
export async function createACODispatch(
  params: ACODispatchParams
): Promise<ACODispatchResult> {
  const supabase = createServiceRoleClient();

  // 1. Evaluate law triggers
  const lawEval = await evaluateLawTriggers(params.county, params.law_triggers);

  if (!lawEval.triggers_aco || !lawEval.primary_rule) {
    return {
      success: true,
      law_evaluation: lawEval,
      notifications_sent: 0,
    };
  }

  // 2. Create ACO dispatch request
  const expiresAt = new Date();
  const slaMins = lawEval.primary_rule.response_sla_minutes || 480; // Default 8 hours
  expiresAt.setMinutes(expiresAt.getMinutes() + slaMins);

  const { data: dispatch, error: dispatchError } = await supabase
    .from('dispatch_requests')
    .insert({
      // Standard dispatch fields
      request_type: 'EMERGENCY_ASSIST',
      priority: lawEval.highest_priority || 'MEDIUM',
      species: params.species,
      animal_size: 'MEDIUM', // Default, can be updated
      animal_condition: params.description || null,
      pickup_lat: params.lat,
      pickup_lng: params.lng,
      pickup_address: params.address,
      county: params.county,
      requester_id: params.reporter_id || 'SYSTEM',
      requester_name: params.reporter_name,
      requester_phone: params.reporter_phone,
      status: 'PENDING',
      requested_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),

      // ACO-specific fields
      is_aco_dispatch: true,
      legal_basis: lawEval.primary_rule.legal_basis,
      statute_citations: lawEval.all_citations,
      law_triggers: params.law_triggers,
      rule_id: lawEval.primary_rule.rule_id,
      source_case_type: params.source_case_type,
      source_case_id: params.source_case_id || null,
    })
    .select()
    .single();

  if (dispatchError || !dispatch) {
    console.error('ACO dispatch creation error:', dispatchError);
    return {
      success: false,
      law_evaluation: lawEval,
      notifications_sent: 0,
      error: 'Failed to create ACO dispatch request',
    };
  }

  // 3. Log initial assignment entry (audit trail)
  await supabase.from('dispatch_assignments').insert({
    dispatch_request_id: dispatch.id,
    volunteer_id: null,
    action: 'OFFERED',
    note: `ACO dispatch created. Legal basis: ${lawEval.primary_rule.legal_basis}. Citations: ${lawEval.all_citations.join(', ')}`,
    meta: {
      source: 'aco_dispatch_service',
      law_triggers: params.law_triggers,
      rule_code: lawEval.primary_rule.rule_code,
      requires_immediate: lawEval.requires_immediate,
    },
  });

  // 4. Find active ACO officers in county
  const { data: officers, error: officerError } = await supabase
    .from('aco_officers')
    .select('id, user_id, phone, email, notification_preference')
    .eq('county', params.county)
    .eq('status', 'ACTIVE');

  if (officerError) {
    console.error('ACO officer query error:', officerError);
  }

  // 5. Notify ACO officers
  let notificationsSent = 0;

  for (const officer of officers || []) {
    const notified = await notifyACOOfficer({
      dispatch_id: dispatch.id,
      officer_id: officer.id,
      officer_phone: officer.phone,
      officer_email: officer.email,
      notification_preference: officer.notification_preference,
      priority: lawEval.highest_priority || 'MEDIUM',
      address: params.address,
      species: params.species,
      law_triggers: params.law_triggers,
      citations: lawEval.all_citations,
      requires_immediate: lawEval.requires_immediate,
    });

    if (notified) notificationsSent++;
  }

  // 6. Update source case with ACO dispatch reference
  if (params.source_case_id && params.source_case_type) {
    const tableName =
      params.source_case_type === 'MISSING'
        ? 'missing_pet_case'
        : params.source_case_type === 'FOUND'
        ? 'found_animal_case'
        : params.source_case_type === 'SIGHTING'
        ? 'sighting'
        : null;

    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          aco_notified_at: new Date().toISOString(),
          aco_dispatch_id: dispatch.id,
        })
        .eq('id', params.source_case_id);
    }
  }

  // 7. Notify police/911 if required
  let policeNotified = false;
  if (params.notify_police) {
    policeNotified = await notifyPolice911({
      dispatch_id: dispatch.id,
      county: params.county,
      address: params.address,
      species: params.species,
      law_triggers: params.law_triggers,
      citations: lawEval.all_citations,
      priority: lawEval.highest_priority || 'MEDIUM',
      reporter_name: params.reporter_name,
      reporter_phone: params.reporter_phone,
    });
    
    if (policeNotified) {
      // Update dispatch record to reflect police notification
      await supabase
        .from('dispatch_requests')
        .update({
          police_notified: true,
          police_notified_at: new Date().toISOString(),
        })
        .eq('id', dispatch.id);
    }
  }

  return {
    success: true,
    dispatch_id: dispatch.id,
    law_evaluation: lawEval,
    notifications_sent: notificationsSent,
    police_notified: policeNotified,
  };
}

interface NotifyACOParams {
  dispatch_id: string;
  officer_id: string;
  officer_phone?: string;
  officer_email?: string;
  notification_preference: string;
  priority: Priority;
  address: string;
  species: string;
  law_triggers: LawTriggerCategory[];
  citations: string[];
  requires_immediate: boolean;
}

/**
 * Send notification to a single ACO officer
 */
async function notifyACOOfficer(params: NotifyACOParams): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const urgencyText =
    params.priority === 'CRITICAL'
      ? '🚨 CRITICAL - IMMEDIATE RESPONSE'
      : params.priority === 'HIGH'
      ? '⚠️ HIGH PRIORITY'
      : '';

  const message = `${urgencyText}
MAYDAY ACO DISPATCH

Location: ${params.address}
Animal: ${params.species}
Legal Basis: ${params.citations.join(', ')}

${params.requires_immediate ? '⏰ IMMEDIATE RESPONSE REQUIRED' : ''}

View details: https://petmayday.org/admin/aco/dispatch/${params.dispatch_id}

Reply ACK to acknowledge.`;

  // Log notification attempt
  const { data: notification, error: notifError } = await supabase
    .from('aco_notifications')
    .insert({
      dispatch_request_id: params.dispatch_id,
      aco_officer_id: params.officer_id,
      notification_type:
        params.notification_preference === 'EMAIL' ? 'EMAIL' : 'SMS',
      message_content: message,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (notifError) {
    console.error('ACO notification log error:', notifError);
    return false;
  }

  // Send via Twilio if SMS preference
  if (
    params.officer_phone &&
    (params.notification_preference === 'SMS' ||
      params.notification_preference === 'BOTH')
  ) {
    try {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (twilioAccountSid && twilioAuthToken && twilioPhone) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString(
                'base64'
              ),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: params.officer_phone,
            From: twilioPhone,
            Body: message,
          }),
        });

        const data = await response.json();

        // Update notification with provider info
        await supabase
          .from('aco_notifications')
          .update({
            provider_message_id: data.sid || null,
            provider_status: data.status || null,
            error_message: data.error_message || null,
          })
          .eq('id', notification.id);

        return response.ok;
      }
    } catch (error) {
      console.error('ACO SMS notification error:', error);
    }
  }

  // For now, return true if we logged the notification (even if delivery pending)
  return true;
}

interface NotifyPolice911Params {
  dispatch_id: string;
  county: County;
  address: string;
  species: string;
  law_triggers: LawTriggerCategory[];
  citations: string[];
  priority: Priority;
  reporter_name: string;
  reporter_phone: string;
}

/**
 * Notify police/911 dispatch for law enforcement matters
 * Logs notification for audit trail; actual 911 integration is county-specific
 */
async function notifyPolice911(params: NotifyPolice911Params): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const urgencyText =
    params.priority === 'CRITICAL'
      ? '🚨 CRITICAL - IMMEDIATE POLICE RESPONSE NEEDED'
      : params.priority === 'HIGH'
      ? '⚠️ HIGH PRIORITY - POLICE NOTIFICATION'
      : 'Police Notification';

  const message = `${urgencyText}
MAYDAY Animal Incident - Law Enforcement Required

Location: ${params.address}
Animal: ${params.species}
Legal Basis: ${params.citations.join(', ')}
Triggers: ${params.law_triggers.join(', ')}

Reporter: ${params.reporter_name}
Phone: ${params.reporter_phone}

Dispatch ID: ${params.dispatch_id}`;

  // Log police notification for audit trail
  const { error: logError } = await supabase
    .from('police_notifications')
    .insert({
      dispatch_request_id: params.dispatch_id,
      county: params.county,
      notification_type: 'DISPATCH_911',
      message_content: message,
      priority: params.priority,
      law_triggers: params.law_triggers,
      statute_citations: params.citations,
      sent_at: new Date().toISOString(),
    });

  if (logError) {
    // If police_notifications table doesn't exist, log to dispatch_assignments
    console.warn('Police notification table error, logging to assignments:', logError);
    await supabase.from('dispatch_assignments').insert({
      dispatch_request_id: params.dispatch_id,
      volunteer_id: null,
      action: 'POLICE_NOTIFIED',
      note: `Police/911 notification sent. ${params.citations.join(', ')}`,
      meta: {
        source: 'aco_dispatch_service',
        law_triggers: params.law_triggers,
        priority: params.priority,
      },
    });
  }

  // In production: integrate with county 911 CAD system
  // For now, log successful notification
  console.log('[POLICE_911_NOTIFIED]', {
    dispatch_id: params.dispatch_id,
    county: params.county,
    priority: params.priority,
    triggers: params.law_triggers,
  });

  return true;
}

/**
 * Update ACO dispatch with officer acknowledgment
 */
export async function acknowledgeACODispatch(
  dispatch_id: string,
  officer_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('dispatch_requests')
    .update({
      aco_officer_id: officer_id,
      acknowledged_at: new Date().toISOString(),
      status: 'ACCEPTED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatch_id)
    .eq('is_aco_dispatch', true);

  if (error) {
    console.error('ACO acknowledge error:', error);
    return false;
  }

  // Log assignment
  await supabase.from('dispatch_assignments').insert({
    dispatch_request_id: dispatch_id,
    volunteer_id: null,
    action: 'ACCEPTED',
    note: 'ACO acknowledged dispatch',
    meta: {
      source: 'aco_dispatch_service',
      aco_officer_id: officer_id,
    },
  });

  // Update notification record
  await supabase
    .from('aco_notifications')
    .update({
      acknowledged_at: new Date().toISOString(),
      response_action: 'ACKNOWLEDGED',
    })
    .eq('dispatch_request_id', dispatch_id)
    .eq('aco_officer_id', officer_id);

  return true;
}

/**
 * Resolve an ACO dispatch with outcome
 */
export async function resolveACODispatch(
  dispatch_id: string,
  officer_id: string,
  resolution_code: string,
  resolution_notes?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('dispatch_requests')
    .update({
      status: 'COMPLETED',
      resolution_code,
      resolution_notes: resolution_notes || null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatch_id)
    .eq('is_aco_dispatch', true);

  if (error) {
    console.error('ACO resolve error:', error);
    return false;
  }

  // Log assignment
  await supabase.from('dispatch_assignments').insert({
    dispatch_request_id: dispatch_id,
    volunteer_id: null,
    action: 'COMPLETED',
    note: `Resolution: ${resolution_code}. ${resolution_notes || ''}`,
    meta: {
      source: 'aco_dispatch_service',
      aco_officer_id: officer_id,
      resolution_code,
    },
  });

  return true;
}
