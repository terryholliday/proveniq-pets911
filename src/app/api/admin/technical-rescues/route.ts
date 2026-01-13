import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: cases, error } = await supabase
      .from('incident_cases')
      .select('*')
      .eq('case_type', 'TECHNICAL_RESCUE')
      .in('status', ['OPEN', 'IN_PROGRESS', 'PENDING_RESOURCES'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Technical rescues error:', error);
      return NextResponse.json({ cases: [] });
    }

    const formattedCases = (cases || []).map(c => ({
      id: c.id,
      case_number: c.case_number,
      description: c.description,
      location_county: c.location_county,
      location_address: c.location_address,
      equipment_needed: c.metadata?.equipment_needed || [],
      status: c.status,
      created_at: c.created_at,
    }));

    return NextResponse.json({ cases: formattedCases });
  } catch (error) {
    console.error('Technical rescues API error:', error);
    return NextResponse.json({ cases: [] });
  }
}
