import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * POST /api/report/litter
 * Quick entry for litters/groups of animals
 * Optimized for speed: 1 photo, count, basic info
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const formData = await request.formData();
    
    const species = formData.get('species') as string;
    const count = parseInt(formData.get('count') as string) || 1;
    const description = formData.get('description') as string || '';
    const county = formData.get('county') as string;
    const locationNotes = formData.get('location_notes') as string || '';
    const canHold = formData.get('can_hold') === 'true';
    const phone = formData.get('phone') as string;
    const photo = formData.get('photo') as File | null;

    if (!county || !phone) {
      return NextResponse.json(
        { error: 'County and phone are required' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Upload photo if provided
    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `litter-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-photos')
        .upload(fileName, photo);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('case-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    // Create incident case
    const speciesBreakdown: Record<string, number> = {};
    speciesBreakdown[species] = count;

    const { data: incidentCase, error: caseError } = await supabase
      .from('incident_cases')
      .insert({
        case_type: 'STRAY_LITTER',
        status: 'OPEN',
        location_county: county,
        location_notes: locationNotes,
        total_animals: count,
        species_breakdown: speciesBreakdown,
        reporter_id: user?.id,
        reporter_phone: phone,
      })
      .select('id, case_number')
      .single();

    if (caseError) {
      console.error('Case creation error:', caseError);
      return NextResponse.json(
        { error: 'Failed to create case' },
        { status: 500 }
      );
    }

    // Create litter entry (for later splitting into individuals)
    const { error: litterError } = await supabase
      .from('litters')
      .insert({
        case_id: incidentCase.id,
        count,
        species,
        description: description || `${count} ${species.toLowerCase()}${count > 1 ? 's' : ''}`,
        group_photo_url: photoUrl,
        processed: false,
      });

    if (litterError) {
      console.error('Litter creation error:', litterError);
    }

    // Create a single case_animal entry representing the group
    // This can be split later by shelter staff
    await supabase
      .from('case_animals')
      .insert({
        case_id: incidentCase.id,
        temp_id: `Litter of ${count}`,
        species,
        description: description || `Group of ${count} ${species.toLowerCase()}${count > 1 ? 's' : ''}`,
        condition: 'UNKNOWN',
        is_litter_member: true,
        is_group_photo: true,
        photo_urls: photoUrl ? [photoUrl] : [],
        microchip_scanned: false,
        has_collar: false,
        requires_immediate_medical: false,
        suspected_breeder_release: false,
      });

    // TODO: Trigger alert to volunteers/partners in county

    return NextResponse.json({
      success: true,
      case_id: incidentCase.id,
      case_number: incidentCase.case_number,
      message: `Case created for ${count} ${species.toLowerCase()}${count > 1 ? 's' : ''}`,
    });

  } catch (error) {
    console.error('Litter report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
