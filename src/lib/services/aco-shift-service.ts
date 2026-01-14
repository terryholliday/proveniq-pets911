/**
 * ACO Shift Handoff Service
 * 
 * Manages on-duty status and shift handoffs between:
 * - ACO Officers (business hours)
 * - 911 Dispatch Centers (after hours)
 * - Sheriff (counties without dedicated ACO)
 */

import { createServiceRoleClient } from '@/lib/api/server-auth';

export type OnDutyRole = 'ACO_OFFICER' | 'DISPATCH_911' | 'SHERIFF';
export type County = 'GREENBRIER' | 'KANAWHA';

export type HandoffReason =
  | 'END_OF_SHIFT'
  | 'START_OF_SHIFT'
  | 'AFTER_HOURS_AUTO'
  | 'BUSINESS_HOURS_AUTO'
  | 'EMERGENCY_COVERAGE'
  | 'VACATION'
  | 'SICK_LEAVE'
  | 'MANUAL_OVERRIDE';

export interface OnDutyInfo {
  county: County;
  current_role: OnDutyRole;
  aco_officer_id: string | null;
  dispatcher_id: string | null;
  on_duty_since: string;
  is_after_hours: boolean;
}

export interface ShiftHandoffParams {
  county: County;
  from_role: OnDutyRole | 'SYSTEM';
  from_officer_id?: string;
  from_911_id?: string;
  to_role: OnDutyRole;
  to_officer_id?: string;
  to_911_id?: string;
  reason: HandoffReason;
  notes?: string;
}

/**
 * Get current on-duty info for a county
 */
export async function getOnDuty(county: County): Promise<OnDutyInfo | null> {
  const supabase = createServiceRoleClient();

  // Get on-duty info
  const { data: onDuty, error: onDutyError } = await supabase
    .rpc('get_on_duty', { p_county: county });

  if (onDutyError || !onDuty || onDuty.length === 0) {
    // No shift log exists - check if after hours and return default
    const { data: isAfterHours } = await supabase
      .rpc('is_after_hours', { p_county: county });

    return {
      county,
      current_role: isAfterHours ? 'DISPATCH_911' : 'ACO_OFFICER',
      aco_officer_id: null,
      dispatcher_id: null,
      on_duty_since: new Date().toISOString(),
      is_after_hours: isAfterHours || false,
    };
  }

  const duty = onDuty[0];

  // Check if currently after hours
  const { data: isAfterHours } = await supabase
    .rpc('is_after_hours', { p_county: county });

  return {
    county,
    current_role: duty.duty_role,
    aco_officer_id: duty.aco_officer_id,
    dispatcher_id: duty.dispatcher_id,
    on_duty_since: duty.on_duty_since,
    is_after_hours: isAfterHours || false,
  };
}

/**
 * Record a shift handoff
 */
export async function recordShiftHandoff(
  params: ShiftHandoffParams
): Promise<{ success: boolean; handoff_id?: string; error?: string }> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('record_shift_handoff', {
    p_county: params.county,
    p_from_role: params.from_role,
    p_from_officer_id: params.from_officer_id || null,
    p_from_911_id: params.from_911_id || null,
    p_to_role: params.to_role,
    p_to_officer_id: params.to_officer_id || null,
    p_to_911_id: params.to_911_id || null,
    p_reason: params.reason,
    p_notes: params.notes || null,
  });

  if (error) {
    console.error('Shift handoff error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, handoff_id: data };
}

/**
 * ACO goes off-duty (hands off to 911 or another officer)
 */
export async function acoGoOffDuty(
  county: County,
  officer_id: string,
  reason: HandoffReason = 'END_OF_SHIFT',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  // Find a 911 dispatcher for this county
  const { data: center } = await supabase
    .from('dispatch_911_centers')
    .select('id')
    .eq('county', county)
    .eq('is_active', true)
    .single();

  const toRole: OnDutyRole = center ? 'DISPATCH_911' : 'SHERIFF';

  return recordShiftHandoff({
    county,
    from_role: 'ACO_OFFICER',
    from_officer_id: officer_id,
    to_role: toRole,
    reason,
    notes,
  });
}

/**
 * ACO comes on-duty (takes over from 911 or another officer)
 */
export async function acoGoOnDuty(
  county: County,
  officer_id: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // Get current on-duty to know who we're taking over from
  const current = await getOnDuty(county);

  return recordShiftHandoff({
    county,
    from_role: current?.current_role || 'SYSTEM',
    from_officer_id: current?.aco_officer_id || undefined,
    from_911_id: current?.dispatcher_id || undefined,
    to_role: 'ACO_OFFICER',
    to_officer_id: officer_id,
    reason: 'START_OF_SHIFT',
    notes,
  });
}

/**
 * Get who should be notified for a dispatch in this county
 * Returns the appropriate contact based on current on-duty status
 */
export async function getDispatchTarget(county: County): Promise<{
  role: OnDutyRole;
  officer_id?: string;
  dispatcher_id?: string;
  is_after_hours: boolean;
}> {
  const onDuty = await getOnDuty(county);

  if (!onDuty) {
    // Fallback: check if after hours
    const supabase = createServiceRoleClient();
    const { data: isAfterHours } = await supabase
      .rpc('is_after_hours', { p_county: county });

    return {
      role: isAfterHours ? 'DISPATCH_911' : 'ACO_OFFICER',
      is_after_hours: isAfterHours || false,
    };
  }

  return {
    role: onDuty.current_role,
    officer_id: onDuty.aco_officer_id || undefined,
    dispatcher_id: onDuty.dispatcher_id || undefined,
    is_after_hours: onDuty.is_after_hours,
  };
}

/**
 * Get shift history for a county (for audit/dashboard)
 */
export async function getShiftHistory(
  county: County,
  limit: number = 50
): Promise<any[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('aco_shift_log')
    .select(`
      *,
      from_officer:aco_officers!aco_shift_log_from_officer_id_fkey(id, user_id),
      to_officer:aco_officers!aco_shift_log_to_officer_id_fkey(id, user_id)
    `)
    .eq('county', county)
    .order('effective_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Shift history query error:', error);
    return [];
  }

  return data || [];
}
