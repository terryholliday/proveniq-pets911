import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';
import { notifyVolunteerDispatch } from '@/lib/services/twilio-dispatch-service';

export const dynamic = 'force-dynamic';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Service role client is used only for internal matching + notifications.
    const admin = createServiceRoleClient();
    const body = await request.json();
    
    const {
      request_type,
      priority,
      species,
      animal_size,
      animal_condition,
      needs_crate,
      pickup_lat,
      pickup_lng,
      pickup_address,
      dropoff_lat,
      dropoff_lng,
      dropoff_address,
      county,
      requester_name,
      requester_phone,
    } = body;

    if (!request_type || !species || !animal_size || !pickup_lat || !pickup_lng || !pickup_address || !county) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields' 
          } 
        },
        { status: 400 }
      );
    }

    const capabilityMap: Record<string, string[]> = {
      'TRANSPORT': ['TRANSPORT', 'VET_TRANSPORT', 'SHELTER_TRANSPORT'],
      'FOSTER': ['FOSTER_SHORT_TERM', 'FOSTER_LONG_TERM'],
      'EMERGENCY_ASSIST': ['EMERGENCY_RESPONSE'],
    };

    const requiredCapabilities = capabilityMap[request_type] || [];

    const { data: volunteers, error: volunteerError } = await admin
      .from('volunteers')
      .select('id, display_name, phone, home_lat, home_lng, max_response_radius_miles, capabilities, available_immediately, last_active_at, has_vehicle, can_transport_crate, max_animal_size, can_foster_species')
      .eq('status', 'ACTIVE')
      .eq('primary_county', county)
      .overlaps('capabilities', requiredCapabilities);

    if (volunteerError) {
      console.error('Volunteer query error:', volunteerError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to find volunteers' 
          } 
        },
        { status: 500 }
      );
    }

    const matches: Array<{
      volunteer_id: string;
      volunteer_name: string;
      volunteer_phone: string;
      distance_miles: number;
      estimated_arrival_minutes: number;
      capabilities: string[];
      match_score: number;
      is_available_now: boolean;
      last_dispatch_at: string | null;
    }> = [];

    for (const volunteer of volunteers || []) {
      if (!volunteer.home_lat || !volunteer.home_lng) continue;

      const distance = calculateDistance(
        pickup_lat,
        pickup_lng,
        volunteer.home_lat,
        volunteer.home_lng
      );

      if (distance > volunteer.max_response_radius_miles) continue;

      if (request_type === 'TRANSPORT') {
        if (!volunteer.has_vehicle) continue;
        if (needs_crate && !volunteer.can_transport_crate) continue;
        if (volunteer.max_animal_size) {
          const sizeOrder = ['SMALL', 'MEDIUM', 'LARGE', 'XLARGE'];
          const volunteerSizeIndex = sizeOrder.indexOf(volunteer.max_animal_size);
          const animalSizeIndex = sizeOrder.indexOf(animal_size);
          if (animalSizeIndex > volunteerSizeIndex) continue;
        }
      }

      if (request_type === 'FOSTER') {
        if (!volunteer.can_foster_species.includes(species)) continue;
      }

      const estimatedArrivalMinutes = Math.ceil(distance * 2);
      
      const matchScore = Math.max(0, 100 - (distance * 5));

      matches.push({
        volunteer_id: volunteer.id,
        volunteer_name: volunteer.display_name,
        volunteer_phone: volunteer.phone,
        distance_miles: Math.round(distance * 10) / 10,
        estimated_arrival_minutes: estimatedArrivalMinutes,
        capabilities: volunteer.capabilities,
        match_score: Math.round(matchScore),
        is_available_now: volunteer.available_immediately || false,
        last_dispatch_at: volunteer.last_active_at,
      });
    }

    matches.sort((a, b) => b.match_score - a.match_score);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create dispatch request as the authenticated requester (RLS enforced)
    const { data: dispatchRequest, error: insertError } = await supabase
      .from('dispatch_requests')
      .insert({
        request_type,
        priority: priority || 'MEDIUM',
        species,
        animal_size,
        animal_condition: animal_condition || null,
        needs_crate: needs_crate || false,
        pickup_lat,
        pickup_lng,
        pickup_address,
        dropoff_lat: dropoff_lat || null,
        dropoff_lng: dropoff_lng || null,
        dropoff_address: dropoff_address || null,
        county,
        requester_id: user.id,
        requester_name: requester_name || user.email || 'Anonymous',
        requester_phone: requester_phone || '',
        volunteer_id: null,
        volunteer_name: null,
        volunteer_phone: null,
        status: 'PENDING',
        requested_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Dispatch request creation error:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to create dispatch request' 
          } 
        },
        { status: 500 }
      );
    }

    // Notify top matches (best-effort; do not leak volunteer contact data to requester)
    const topMatches = matches.slice(0, 5);
    let notificationsAttempted = 0;
    let notificationsSent = 0;

    for (const match of topMatches) {
      notificationsAttempted += 1;
      const result = await notifyVolunteerDispatch({
        dispatchId: dispatchRequest.id,
        volunteerId: match.volunteer_id,
        volunteerPhone: match.volunteer_phone,
        volunteerName: match.volunteer_name,
        species,
        animalSize: animal_size,
        pickupAddress: pickup_address,
        distance: match.distance_miles,
        priority: (priority || 'MEDIUM') as any,
      });

      if (result.success) {
        notificationsSent += 1;

        // Append-only audit ledger entry (best-effort)
        try {
          await admin.from('dispatch_assignments').insert({
            dispatch_request_id: dispatchRequest.id,
            volunteer_id: match.volunteer_id,
            action: 'OFFERED',
            note: 'Offered via SMS',
            meta: {
              source: 'dispatch_request_api',
              match_score: match.match_score,
            },
          } as any);
        } catch {
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dispatch_request: dispatchRequest,
        total_matches: matches.length,
        notifications_attempted: notificationsAttempted,
        notifications_sent: notificationsSent,
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dispatch request error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const body = await request.json();
    const { dispatch_id, status, outcome_notes } = body;

    if (!dispatch_id || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'dispatch_id and status are required' 
          } 
        },
        { status: 400 }
      );
    }

    const allowedStatuses = new Set(['EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED']);
    const nextStatus = String(status).toUpperCase();
    if (!allowedStatuses.has(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${Array.from(allowedStatuses).join(', ')}` },
        },
        { status: 400 }
      );
    }

    const { data: actorVolunteer } = await supabase
      .from('volunteers')
      .select('id, status, capabilities')
      .eq('user_id', user.id)
      .maybeSingle<{ id: string; status: string; capabilities: string[] }>();

    const actorIsPrivileged =
      actorVolunteer?.status === 'ACTIVE' &&
      Array.isArray(actorVolunteer.capabilities) &&
      (actorVolunteer.capabilities.includes('SYSOP') || actorVolunteer.capabilities.includes('MODERATOR'));

    const { data: dispatch } = await supabase
      .from('dispatch_requests')
      .select('id, requester_id, volunteer_id')
      .eq('id', dispatch_id)
      .maybeSingle<{ id: string; requester_id: string; volunteer_id: string | null }>();

    if (!dispatch) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispatch not found' } },
        { status: 404 }
      );
    }

    const actorIsRequester = dispatch.requester_id === user.id;
    const actorIsAssignedVolunteer = Boolean(
      actorVolunteer?.id && dispatch.volunteer_id && dispatch.volunteer_id === actorVolunteer.id
    );

    const canUpdate =
      actorIsPrivileged ||
      (nextStatus === 'CANCELLED' ? actorIsRequester : actorIsAssignedVolunteer);

    if (!canUpdate) {
      // Avoid leaking whether a dispatch exists.
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispatch not found' } },
        { status: 404 }
      );
    }

    const updates: any = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === 'ARRIVED') {
      updates.arrived_at = new Date().toISOString();
    }

    if (nextStatus === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
      updates.outcome_notes = outcome_notes || null;
    }

    const { data: dispatchRequest, error } = await supabase
      .from('dispatch_requests')
      .update(updates)
      .eq('id', dispatch_id)
      .select()
      .single();

    if (error) {
      console.error('Dispatch update error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to update dispatch request' 
          } 
        },
        { status: 500 }
      );
    }

    // Append-only audit ledger entry (best-effort)
    try {
      await supabase.from('dispatch_assignments').insert({
        dispatch_request_id: dispatch_id,
        volunteer_id: dispatchRequest?.volunteer_id || null,
        action: nextStatus,
        note: nextStatus === 'COMPLETED' ? (outcome_notes || null) : null,
        meta: {
          source: 'dispatch_request_api',
          actor_user_id: user.id,
          actor_role: actorIsPrivileged ? 'PRIVILEGED' : actorIsAssignedVolunteer ? 'VOLUNTEER' : 'REQUESTER',
        },
      } as any);
    } catch {
    }

    return NextResponse.json({
      success: true,
      data: dispatchRequest,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dispatch update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}
