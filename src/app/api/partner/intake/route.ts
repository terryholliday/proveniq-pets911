import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intake_type, case_number, source, animals } = body;

    // Get partner organization for this user
    const { data: partner } = await supabase
      .from('partner_users')
      .select('organization_id, partner_organizations!inner(name, county)')
      .eq('user_id', user.id)
      .single();

    // Create intake record
    const { data: intake, error: intakeError } = await supabase
      .from('partner_intakes')
      .insert({
        organization_id: partner?.organization_id,
        intake_type,
        linked_case_number: case_number || null,
        source_name: source?.name,
        source_phone: source?.phone,
        source_address: source?.address,
        source_county: source?.county,
        source_notes: source?.description,
        animal_count: animals?.length || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (intakeError) {
      console.error('Intake creation error:', intakeError);
      return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
    }

    // Create animal records
    if (animals && animals.length > 0) {
      const animalRecords = animals.map((a: any, idx: number) => ({
        intake_id: intake.id,
        organization_id: partner?.organization_id,
        species: a.species,
        breed: a.breed,
        color: a.color,
        sex: a.sex,
        age_estimate: a.age_estimate,
        weight_estimate: a.weight_estimate,
        microchip_number: a.microchip_number,
        has_collar: a.has_collar,
        collar_description: a.collar_description,
        medical_notes: a.medical_notes,
        behavioral_notes: a.behavioral_notes,
        temp_id: `INT-${intake.id.slice(0,4)}-${idx + 1}`,
      }));

      const { error: animalsError } = await supabase
        .from('intake_animals')
        .insert(animalRecords);

      if (animalsError) {
        console.error('Animals creation error:', animalsError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      intake_id: intake.id,
    });
  } catch (error) {
    console.error('Partner intake API error:', error);
    return NextResponse.json({ error: 'Failed to process intake' }, { status: 500 });
  }
}
