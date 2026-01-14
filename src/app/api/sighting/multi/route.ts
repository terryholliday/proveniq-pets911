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

    // Generate a case number
    const caseNumber = `MULTI-${Date.now().toString(36).toUpperCase()}`;

    // Build description with scenario context
    const fullDescription = [
      `[${scenario}] ${count ? count + ' animals' : 'Multiple animals'}`,
      `Species: ${species}`,
      description,
      urgency !== 'MEDIUM' ? `Urgency: ${urgency}` : '',
      canHold ? 'Reporter can stay with animals' : '',
    ].filter(Boolean).join('\n');

    // Create sighting record (using existing MAYDAY schema)
    const { data: sightingRecord, error: sightingError } = await supabase
      .from('sighting')
      .insert({
        reporter_id: user?.id || null,
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        sighting_at: new Date().toISOString(),
        sighting_address: address || null,
        description: fullDescription.substring(0, 1000),
        animal_behavior: locationNotes || null,
        county: county,
        photo_url: photoUrl,
        confidence_level: 'CONFIDENT',
      })
      .select('id')
      .single();

    if (sightingError) {
      console.error('Sighting creation error:', sightingError);
      return NextResponse.json(
        { error: 'Failed to create report: ' + sightingError.message },
        { status: 500 }
      );
    }

    // TODO: Trigger appropriate alerts based on scenario
    // - FERAL_COLONY -> TNR coordinators
    // - DECEASED_OWNER -> Local rescue partners
    // - CRITICAL -> Emergency response

    return NextResponse.json({
      success: true,
      case_id: sightingRecord.id,
      case_number: caseNumber,
      scenario,
      message: `Report created for ${scenario.toLowerCase().replace('_', ' ')} situation`,
    });

  } catch (error) {
    console.error('Multi-animal report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
