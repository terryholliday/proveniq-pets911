import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * POST /api/sighting/multi
 * Report multiple animals in various scenarios:
 * - Litters
 * - Deceased owner situations
 * - Feral cat colonies (TNR)
 * - Hoarding cases
 * - Mass abandonment
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const formData = await request.formData();
    
    const scenario = formData.get('scenario') as string;
    const species = formData.get('species') as string || 'MIXED';
    const countStr = formData.get('count') as string;
    const count = countStr === 'unknown' ? null : parseInt(countStr) || null;
    const description = formData.get('description') as string || '';
    const county = formData.get('county') as string;
    const address = formData.get('address') as string || '';
    const locationNotes = formData.get('location_notes') as string || '';
    const urgency = formData.get('urgency') as string || 'MEDIUM';
    const canHold = formData.get('can_hold') === 'true';
    const reporterName = formData.get('reporter_name') as string;
    const reporterPhone = formData.get('reporter_phone') as string;
    const photo = formData.get('photo') as File | null;

    if (!county || !reporterPhone || !reporterName) {
      return NextResponse.json(
        { error: 'County, name, and phone are required' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Upload photo if provided
    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `multi-${scenario}-${Date.now()}.${fileExt}`;
      
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

    // Map scenario to case_type
    const caseTypeMap: Record<string, string> = {
      'LITTER': 'STRAY_LITTER',
      'DECEASED_OWNER': 'ABANDONMENT',
      'FERAL_COLONY': 'COMMUNITY_CAT_COLONY',
      'HOARDING': 'HOARDING',
      'ABANDONMENT': 'ABANDONMENT',
      'OTHER': 'STRAY_LITTER',
    };

    const speciesBreakdown: Record<string, number> = {};
    if (count && species) {
      speciesBreakdown[species] = count;
    }

    // Create incident case
    const { data: incidentCase, error: caseError } = await supabase
      .from('incident_cases')
      .insert({
        case_type: caseTypeMap[scenario] || 'STRAY_LITTER',
        status: urgency === 'CRITICAL' ? 'IN_PROGRESS' : 'OPEN',
        location_county: county,
        location_address: address,
        location_notes: locationNotes,
        total_animals: count || 0,
        species_breakdown: speciesBreakdown,
        reporter_id: user?.id,
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        // Special flags
        is_multi_species: species === 'MIXED',
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

    // For feral colonies, create a specific record
    if (scenario === 'FERAL_COLONY') {
      // Could create a specific TNR colony record here
      // For now, the description captures the colony details
    }

    // Create a placeholder animal entry
    await supabase
      .from('case_animals')
      .insert({
        case_id: incidentCase.id,
        temp_id: count ? `Group of ${count}` : 'Multiple animals',
        species: species === 'MIXED' ? 'OTHER' : species,
        species_detail: scenario === 'FERAL_COLONY' ? 'Feral cat colony' : null,
        description: description,
        condition: urgency === 'CRITICAL' ? 'CRITICAL' : 'UNKNOWN',
        is_litter_member: scenario === 'LITTER',
        is_group_photo: true,
        photo_urls: photoUrl ? [photoUrl] : [],
        microchip_scanned: false,
        has_collar: false,
        requires_immediate_medical: urgency === 'CRITICAL',
        suspected_breeder_release: false,
      });

    // TODO: Trigger appropriate alerts based on scenario
    // - FERAL_COLONY -> TNR coordinators
    // - DECEASED_OWNER -> Local rescue partners
    // - CRITICAL -> Emergency response

    return NextResponse.json({
      success: true,
      case_id: incidentCase.id,
      case_number: incidentCase.case_number,
      scenario,
      message: `Case created for ${scenario.toLowerCase().replace('_', ' ')} situation`,
    });

  } catch (error) {
    console.error('Multi-animal report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
