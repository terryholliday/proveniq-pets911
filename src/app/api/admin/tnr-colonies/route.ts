import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    // Fetch TNR colony cases
    const { data: colonies, error } = await supabase
      .from('incident_cases')
      .select('*')
      .eq('case_type', 'COMMUNITY_CAT_COLONY')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TNR colonies error:', error);
      return NextResponse.json({ colonies: [] });
    }

    // Transform to TNR-specific format
    const formattedColonies = (colonies || []).map(c => ({
      id: c.id,
      case_number: c.case_number,
      location_address: c.location_address,
      location_county: c.location_county,
      location_notes: c.location_notes,
      estimated_count: c.total_animals || 0,
      cats_trapped: c.metadata?.cats_trapped || 0,
      cats_fixed: c.metadata?.cats_fixed || 0,
      cats_returned: c.metadata?.cats_returned || 0,
      status: c.status === 'OPEN' ? 'REPORTED' :
              c.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
              c.status === 'RESOLVED' ? 'COMPLETE' : 'MONITORING',
      coordinator_name: c.assigned_volunteer_name,
      coordinator_phone: c.assigned_volunteer_phone,
      next_action_date: c.metadata?.next_action_date,
      created_at: c.created_at,
    }));

    return NextResponse.json({ colonies: formattedColonies });
  } catch (error) {
    console.error('TNR API error:', error);
    return NextResponse.json({ colonies: [] });
  }
}
