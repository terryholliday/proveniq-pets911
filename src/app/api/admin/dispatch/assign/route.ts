import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getRequiredCapabilities(requestType: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    TRANSPORT: ['TRANSPORT', 'VET_TRANSPORT', 'SHELTER_TRANSPORT'],
    FOSTER: ['FOSTER_SHORT_TERM', 'FOSTER_LONG_TERM'],
    EMERGENCY_ASSIST: ['EMERGENCY_RESPONSE'],
  };
  return capabilityMap[requestType] || [];
}

async function getUserIdFromAuthHeader(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } }, { status: 401 });
    }

    const body = await req.json();
    const { dispatch_id, volunteer_id, mode } = body as {
      dispatch_id?: string;
      volunteer_id?: string;
      mode?: 'ASSIGN_ONLY' | 'ASSIGN_AND_NOTIFY';
    };

    if (!dispatch_id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'dispatch_id is required' } }, { status: 400 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify caller is MODERATOR or SYSOP via volunteer profile
    const { data: callerVolunteer } = await adminDb
      .from('volunteers')
      .select('id, capabilities, status')
      .eq('user_id', userId)
      .single();

    const callerCaps: string[] = (callerVolunteer?.capabilities as any) || [];
    const isAdmin = callerVolunteer?.status === 'ACTIVE' && (callerCaps.includes('MODERATOR') || callerCaps.includes('SYSOP'));

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Moderator or SYSOP access required' } }, { status: 403 });
    }

    // Load dispatch
    const { data: dispatch, error: dispatchError } = await adminDb
      .from('dispatch_requests')
      .select('*')
      .eq('id', dispatch_id)
      .single();

    if (dispatchError || !dispatch) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Dispatch not found' } }, { status: 404 });
    }

    // If volunteer_id not provided, compute ranked candidates (same logic as app, but simpler)
    if (!volunteer_id) {
      const requiredCapabilities = getRequiredCapabilities(dispatch.request_type);

      const { data: volunteers, error: volErr } = await adminDb
        .from('volunteers')
        .select('id, user_id, display_name, phone, home_lat, home_lng, max_response_radius_miles, available_immediately, last_active_at, capabilities, primary_county, has_vehicle, can_transport_crate, max_animal_size, can_foster_species')
        .eq('status', 'ACTIVE')
        .eq('primary_county', dispatch.county)
        .overlaps('capabilities', requiredCapabilities);

      if (volErr) {
        return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to load volunteers' } }, { status: 500 });
      }

      // Minimal scoring: prefer available_immediately, then most recent activity
      const candidates = (volunteers || [])
        .map((v: any) => ({
          volunteer_id: v.id,
          volunteer_name: v.display_name,
          volunteer_phone: v.phone,
          is_available_now: !!v.available_immediately,
          last_active_at: v.last_active_at,
        }))
        .sort((a: any, b: any) => {
          if (a.is_available_now !== b.is_available_now) return a.is_available_now ? -1 : 1;
          return (b.last_active_at || '').localeCompare(a.last_active_at || '');
        })
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        data: {
          dispatch_request: dispatch,
          candidates,
        },
      });
    }

    // Load volunteer for denormalized fields
    const { data: volunteer, error: volunteerError } = await adminDb
      .from('volunteers')
      .select('id, display_name, phone, status')
      .eq('id', volunteer_id)
      .single();

    if (volunteerError || !volunteer || volunteer.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Volunteer not found or not active' } }, { status: 400 });
    }

    // Assign dispatch: keep status PENDING to preserve existing app + Twilio webhook semantics
    const { data: updated, error: updateError } = await adminDb
      .from('dispatch_requests')
      .update({
        volunteer_id: volunteer.id,
        volunteer_name: volunteer.display_name,
        volunteer_phone: volunteer.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispatch_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to assign dispatch' } }, { status: 500 });
    }

    let notifyAttempted = false;
    let notifyMessageSid: string | null = null;

    if ((mode || 'ASSIGN_ONLY') === 'ASSIGN_AND_NOTIFY') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && fromNumber && volunteer.phone) {
        notifyAttempted = true;
        const urgencyText = updated.priority === 'CRITICAL' ? 'URGENT' : updated.priority === 'HIGH' ? 'HIGH PRIORITY' : '';
        const message = `${urgencyText ? urgencyText + ' ' : ''}PetMayday Dispatch\n\nType: ${updated.request_type}\nAnimal: ${updated.species} (${updated.animal_size})\nPickup: ${updated.pickup_address}\n\nReply Y to accept or N to decline.`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: volunteer.phone,
            From: fromNumber,
            Body: message,
          }),
        });

        let messageSid: string | null = null;
        try {
          const data = await response.json();
          messageSid = data?.sid || null;
        } catch {
        }

        notifyMessageSid = messageSid;

        try {
          await adminDb.from('dispatch_notifications').insert({
            dispatch_request_id: updated.id,
            volunteer_id: volunteer.id,
            notification_type: 'SMS',
            sent_at: new Date().toISOString(),
            message_sid: messageSid,
          } as any);
        } catch {
        }
      }
    }

    // Append-only audit ledger entry
    try {
      await adminDb.from('dispatch_assignments').insert({
        dispatch_request_id: updated.id,
        volunteer_id: volunteer.id,
        action: 'OFFERED',
        assigned_by_user_id: userId,
        assigned_by_volunteer_id: callerVolunteer?.id || null,
        note: (mode || 'ASSIGN_ONLY') === 'ASSIGN_AND_NOTIFY' ? 'Offered + SMS sent' : 'Offered',
        meta: {
          source: 'website',
          mode: mode || 'ASSIGN_ONLY',
          notify_attempted: notifyAttempted,
          message_sid: notifyMessageSid,
        },
      } as any);
    } catch {
    }

    return NextResponse.json({
      success: true,
      data: {
        dispatch_request: updated,
        mode: mode || 'ASSIGN_ONLY',
      },
    });
  } catch (e) {
    console.error('Assign dispatch error:', e);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } }, { status: 500 });
  }
}
