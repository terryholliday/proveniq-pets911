import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForAPI();
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');
    const species = searchParams.get('species');

    let query = supabase
      .from('missing_pet_case')
      .select(`
        id,
        case_reference,
        pet_name,
        species,
        breed,
        color_primary,
        color_secondary,
        size,
        distinctive_features,
        last_seen_at,
        last_seen_address,
        last_seen_lat,
        last_seen_lng,
        county,
        photo_url,
        status,
        created_at
      `)
      .eq('status', 'ACTIVE')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (county && county !== 'ALL') {
      query = query.eq('county', county);
    }

    if (species && species !== 'ALL') {
      query = query.eq('species', species);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching missing pets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch missing pets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pets: data || [] });
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
    const supabase = createClientForAPI();

    // Validate required fields
    const required = ['pet_name', 'species', 'color'];
    const missing = required.filter(field => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate case reference
    const caseRef = `MP-${Date.now().toString(36).toUpperCase()}`;

    // Build the insert payload
    const insertData = {
      case_reference: caseRef,
      pet_name: body.pet_name,
      species: body.species,
      breed: body.breed || null,
      color_primary: body.color,
      color_secondary: body.color_secondary || null,
      size: body.size || null,
      distinctive_features: body.distinctive_features || null,
      last_seen_at: body.last_seen_date ? new Date(body.last_seen_date).toISOString() : new Date().toISOString(),
      last_seen_address: body.last_seen_location || null,
      last_seen_lat: body.last_seen_lat || null,
      last_seen_lng: body.last_seen_lng || null,
      county: body.county || 'GREENBRIER',
      description: body.description || null,
      photo_url: body.photo_url || null,
      is_chipped: body.is_chipped || false,
      collar_description: body.collar_description || null,
      owner_name: body.owner_name || null,
      owner_phone: body.owner_phone || null,
      owner_email: body.owner_email || null,
      status: 'ACTIVE',
      is_deleted: false,
    };

    const { data, error } = await supabase
      .from('missing_pet_case')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating missing pet case:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create missing pet report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      case: data,
      case_reference: caseRef 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
