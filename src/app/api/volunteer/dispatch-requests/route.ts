import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get volunteer record
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, county')
      .eq('user_id', user.id)
      .single();

    if (!volunteer) {
      return NextResponse.json({ requests: [] });
    }

    // Get pending dispatch requests for this volunteer
    const { data: requests, error } = await supabase
      .from('dispatch_requests')
      .select(`
        id,
        status,
        expires_at,
        created_at,
        incident_cases!inner(
          id,
          case_number,
          case_type,
          description,
          location_county,
          location_address,
          location_lat,
          location_lng,
          total_animals,
          reporter_phone,
          metadata
        )
      `)
      .eq('volunteer_id', volunteer.id)
      .in('status', ['PENDING', 'ACCEPTED'])
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Dispatch requests error:', error);
      return NextResponse.json({ requests: [] });
    }

    // Transform to dispatch request format
    const formattedRequests = (requests || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      case_number: r.incident_cases?.case_number,
      case_type: r.incident_cases?.case_type,
      urgency: r.incident_cases?.metadata?.urgency || 'MEDIUM',
      description: r.incident_cases?.description,
      location_county: r.incident_cases?.location_county,
      location_address: r.incident_cases?.location_address,
      location_lat: r.incident_cases?.location_lat,
      location_lng: r.incident_cases?.location_lng,
      animal_count: r.incident_cases?.total_animals,
      contact_phone: r.incident_cases?.reporter_phone,
      requested_at: r.created_at,
      expires_at: r.expires_at,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Dispatch requests API error:', error);
    return NextResponse.json({ requests: [] });
  }
}
