import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { VolunteerMatch, DispatchRequest } from '@/lib/types';

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
    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
      requester_id,
      requester_name,
      requester_phone,
    } = body;

    if (!request_type || !species || !animal_size || !pickup_lat || !pickup_lng || !pickup_address || !county || !requester_id) {
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

    const { data: volunteers, error: volunteerError } = await supabase
      .from('volunteers')
      .select('*')
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

    const matches: VolunteerMatch[] = [];

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
        requester_id,
        requester_name,
        requester_phone,
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

    return NextResponse.json({
      success: true,
      data: {
        dispatch_request: dispatchRequest,
        matches: matches.slice(0, 5),
        total_matches: matches.length,
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
    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { dispatch_id, volunteer_id, status, outcome_notes } = body;

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

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'ACCEPTED' && volunteer_id) {
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('display_name, phone')
        .eq('id', volunteer_id)
        .single();

      updates.volunteer_id = volunteer_id;
      updates.volunteer_name = volunteer?.display_name || null;
      updates.volunteer_phone = volunteer?.phone || null;
      updates.accepted_at = new Date().toISOString();
    }

    if (status === 'ARRIVED') {
      updates.arrived_at = new Date().toISOString();
    }

    if (status === 'COMPLETED') {
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
      const action = String(status).toUpperCase();
      const allowed = new Set(['ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'EXPIRED']);
      if (allowed.has(action)) {
        await supabase.from('dispatch_assignments').insert({
          dispatch_request_id: dispatch_id,
          volunteer_id: dispatchRequest?.volunteer_id || volunteer_id || null,
          action,
          note: action === 'COMPLETED' ? (outcome_notes || null) : null,
          meta: {
            source: 'app_api',
          },
        } as any);
      }
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
