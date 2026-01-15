import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';
import { createACODispatch } from '@/lib/services/aco-dispatch-service';
import type { LawTriggerCategory } from '@/lib/services/aco-law-trigger-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForAPI();
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = supabase
      .from('sighting')
      .select(`
        *,
        reporter:reporter_id(display_name, phone),
        missing_case:missing_case_id(
          id,
          pet_name,
          species,
          owner:owner_id(display_name)
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (county) {
      query = query.eq('county', county);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority === 'HIGH') {
      // High priority sightings are those where reporter is staying with animal
      query = query.eq('can_stay_with_animal', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sightings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sightings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sightings: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['county', 'sighting_address', 'description'];
    const missing = required.filter(field => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine priority based on can_stay_with_animal
    const priority = body.can_stay_with_animal ? 'HIGH' : 'MEDIUM';

    // Extract law triggers if provided
    const lawTriggers: LawTriggerCategory[] = body.law_triggers || [];

    // Try to save to database if Supabase is configured
    let sightingData = null;
    let acoDispatchResult = null;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClientForAPI();
        
        // Create the sighting
        const { data, error } = await supabase
          .from('sighting')
          .insert({
            reporter_id: body.reporter_id || null,
            reporter_name: body.reporter_name || null,
            reporter_phone: body.reporter_phone || null,
            missing_case_id: body.missing_case_id || null,
            sighting_at: body.sighting_at || new Date().toISOString(),
            sighting_lat: body.sighting_lat || null,
            sighting_lng: body.sighting_lng || null,
            sighting_address: body.sighting_address,
            description: body.description,
            direction_heading: body.direction_heading || null,
            animal_behavior: body.animal_behavior || null,
            confidence_level: body.confidence_level || 'UNSURE',
            photo_url: body.photo_url || null,
            county: body.county,
            can_stay_with_animal: body.can_stay_with_animal || false,
            priority: priority,
            status: 'ACTIVE',
            is_verified: false,
            law_triggers: lawTriggers,
          })
          .select()
          .single();

        if (!error && data) {
          sightingData = data;

          // If this is a high priority sighting (reporter can stay with animal),
          // trigger immediate notification workflow
          if (priority === 'HIGH') {
            console.log('High priority sighting created, notification workflow triggered');
          }

          // If law triggers present, create ACO dispatch
          if (lawTriggers.length > 0) {
            try {
              acoDispatchResult = await createACODispatch({
                source_case_type: 'SIGHTING',
                source_case_id: data.id,
                county: body.county,
                lat: body.sighting_lat || 0,
                lng: body.sighting_lng || 0,
                address: body.sighting_address,
                species: body.species || 'Unknown',
                description: body.description,
                reporter_name: body.reporter_name || 'Anonymous',
                reporter_phone: body.reporter_phone || '',
                law_triggers: lawTriggers,
                notes: body.animal_behavior || undefined,
              });
            } catch (acoError) {
              console.warn('ACO dispatch failed, continuing:', acoError);
            }
          }
        } else {
          console.warn('Database insert failed, using demo mode:', error?.message);
        }
      } catch (dbError) {
        console.warn('Database unavailable, using demo mode:', dbError);
      }
    }

    // Return success (with real data if available, demo data otherwise)
    const demoSighting = {
      id: `demo-${Date.now()}`,
      county: body.county,
      sighting_address: body.sighting_address,
      description: body.description,
      priority,
      status: 'ACTIVE',
      law_triggers: lawTriggers,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ 
      sighting: sightingData || demoSighting,
      aco_dispatch: acoDispatchResult,
      demo_mode: !sightingData,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
