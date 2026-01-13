import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/volunteers/equipment
 * Find volunteers with specific equipment in a county
 * Used for technical rescue alerts
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const county = searchParams.get('county');
  const equipmentParam = searchParams.get('equipment');

  if (!county) {
    return NextResponse.json({ error: 'county parameter required' }, { status: 400 });
  }

  const equipmentTypes = equipmentParam?.split(',').filter(Boolean) || [];

  // Get volunteers with matching equipment in the county
  let query = supabase
    .from('volunteer_equipment')
    .select(`
      volunteer_id,
      equipment_type,
      is_available
    `)
    .eq('is_available', true);

  if (equipmentTypes.length > 0) {
    query = query.in('equipment_type', equipmentTypes);
  }

  const { data: equipmentData, error: equipmentError } = await query;

  if (equipmentError) {
    return NextResponse.json({ error: equipmentError.message }, { status: 500 });
  }

  // Get unique volunteer IDs
  const volunteerIds = [...new Set(equipmentData?.map(e => e.volunteer_id) || [])];

  if (volunteerIds.length === 0) {
    return NextResponse.json({ volunteers: [] });
  }

  // Get volunteer details
  const { data: volunteers, error: volError } = await supabase
    .from('volunteers')
    .select('user_id, display_name, phone, primary_county, status, last_active_at')
    .in('user_id', volunteerIds)
    .eq('status', 'ACTIVE')
    .eq('primary_county', county);

  if (volError) {
    return NextResponse.json({ error: volError.message }, { status: 500 });
  }

  // Combine data
  const result = (volunteers || []).map(vol => {
    const equipment = equipmentData
      ?.filter(e => e.volunteer_id === vol.user_id)
      .map(e => e.equipment_type) || [];
    
    return {
      id: vol.user_id,
      name: vol.display_name || 'Volunteer',
      phone: vol.phone,
      equipment,
      distance_miles: 0, // Would calculate from lat/lng if available
      last_active: vol.last_active_at,
    };
  });

  return NextResponse.json({ volunteers: result });
}
