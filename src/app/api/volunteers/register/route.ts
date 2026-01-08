import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { geocodeVolunteerAddress } from '@/lib/services/geocoding-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      user_id,
      display_name,
      phone,
      email,
      primary_county,
      address_city,
      address_zip,
      capabilities,
      max_response_radius_miles,
      has_vehicle,
      vehicle_type,
      can_transport_crate,
      max_animal_size,
      can_foster_species,
      max_foster_count,
      has_fenced_yard,
      has_other_pets,
      other_pets_description,
      available_weekdays,
      available_weekends,
      available_nights,
      available_immediately,
      emergency_contact_name,
      emergency_contact_phone,
    } = body;

    if (!user_id || !display_name || !phone || !primary_county || !address_city || !address_zip) {
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

    if (!capabilities || capabilities.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'At least one capability must be selected' 
          } 
        },
        { status: 400 }
      );
    }

    if (!emergency_contact_name || !emergency_contact_phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Emergency contact information is required' 
          } 
        },
        { status: 400 }
      );
    }

    const { data: existingVolunteer } = await supabase
      .from('volunteers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingVolunteer) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ALREADY_REGISTERED', 
            message: 'You are already registered as a volunteer' 
          } 
        },
        { status: 409 }
      );
    }

    // Geocode volunteer address
    const geocodeResult = await geocodeVolunteerAddress(address_city, address_zip);
    const home_lat = geocodeResult?.lat || null;
    const home_lng = geocodeResult?.lng || null;

    if (!home_lat || !home_lng) {
      console.warn(`Failed to geocode address for volunteer: ${address_city}, ${address_zip}`);
    }

    const { data: volunteer, error: insertError } = await supabase
      .from('volunteers')
      .insert({
        user_id,
        status: 'ACTIVE',
        display_name,
        phone,
        email: email || null,
        primary_county,
        address_city,
        address_zip,
        home_lat,
        home_lng,
        capabilities,
        max_response_radius_miles: max_response_radius_miles || 10,
        has_vehicle: has_vehicle || false,
        vehicle_type: vehicle_type || null,
        can_transport_crate: can_transport_crate || false,
        max_animal_size: max_animal_size || null,
        can_foster_species: can_foster_species || [],
        max_foster_count: max_foster_count || 1,
        has_fenced_yard: has_fenced_yard || false,
        has_other_pets: has_other_pets || false,
        other_pets_description: other_pets_description || null,
        available_weekdays: available_weekdays || false,
        available_weekends: available_weekends || false,
        available_nights: available_nights || false,
        available_immediately: available_immediately || false,
        background_check_completed: false,
        background_check_date: null,
        references_verified: false,
        emergency_contact_name,
        emergency_contact_phone,
        total_dispatches: 0,
        completed_dispatches: 0,
        declined_dispatches: 0,
        average_response_time_minutes: null,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Volunteer registration error:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to register volunteer' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Volunteer registration error:', error);
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
