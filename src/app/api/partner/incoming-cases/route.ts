import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ cases: [] });
    }

    // Get partner organization for this user
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('organization_id, partner_organizations!inner(county)')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ cases: [] });
    }

    const county = (partnerUser as any).partner_organizations?.county;

    // Get open cases in this county
    const { data: cases, error } = await supabase
      .from('incident_cases')
      .select('*')
      .eq('location_county', county)
      .in('status', ['OPEN', 'IN_PROGRESS', 'PENDING_RESOURCES'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Incoming cases error:', error);
      return NextResponse.json({ cases: [] });
    }

    const formattedCases = (cases || []).map(c => ({
      id: c.id,
      case_number: c.case_number,
      case_type: c.case_type,
      description: c.description,
      location_county: c.location_county,
      total_animals: c.total_animals || 1,
      status: c.status,
      urgency: c.metadata?.urgency || 'MEDIUM',
      created_at: c.created_at,
    }));

    return NextResponse.json({ cases: formattedCases });
  } catch (error) {
    console.error('Incoming cases API error:', error);
    return NextResponse.json({ cases: [] });
  }
}
