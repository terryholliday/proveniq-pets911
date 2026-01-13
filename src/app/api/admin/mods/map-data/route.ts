import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/map-data
 * Fetch real volunteer locations and ticket data for the live map
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch volunteers with location data
    const { data: volunteers, error: volError } = await adminDb
      .from('volunteers')
      .select(`
        id,
        display_name,
        primary_county,
        coverage_counties,
        status,
        capabilities,
        home_lat,
        home_lng,
        last_active_at
      `)
      .in('status', ['ACTIVE', 'ON_MISSION']);

    if (volError) {
      console.error('Volunteers fetch error:', volError);
    }

    // Fetch open tickets/dispatch requests
    const { data: tickets, error: ticketError } = await adminDb
      .from('dispatch_requests')
      .select(`
        id,
        status,
        priority,
        created_at,
        incident_cases (
          id,
          case_number,
          case_type,
          location_county,
          location_lat,
          location_lng,
          description,
          metadata
        )
      `)
      .in('status', ['PENDING', 'ACCEPTED', 'IN_PROGRESS'])
      .order('created_at', { ascending: false });

    if (ticketError) {
      console.error('Tickets fetch error:', ticketError);
    }

    // Transform volunteers for map
    const mappedVolunteers = (volunteers || []).map(v => ({
      id: v.id,
      name: v.display_name || 'Unknown',
      county: v.primary_county || 'UNKNOWN',
      coverage_counties: v.coverage_counties || [],
      status: v.status === 'ACTIVE' ? 'available' : v.status === 'ON_MISSION' ? 'busy' : 'offline',
      capabilities: v.capabilities || [],
      lat: v.home_lat,
      lng: v.home_lng,
      is_available: v.status === 'ACTIVE',
      last_active: v.last_active_at,
    }));

    // Transform tickets for map
    const mappedTickets = (tickets || []).map((t: any) => ({
      id: t.id,
      case_number: t.incident_cases?.case_number,
      type: t.incident_cases?.case_type || 'TRANSPORT',
      priority: t.incident_cases?.metadata?.urgency || t.priority || 'MEDIUM',
      county: t.incident_cases?.location_county || 'UNKNOWN',
      lat: t.incident_cases?.location_lat,
      lng: t.incident_cases?.location_lng,
      description: t.incident_cases?.description,
      status: t.status,
      created_at: t.created_at,
    }));

    // Group by county for coverage stats
    const volunteersByCounty: Record<string, any[]> = {};
    const ticketsByCounty: Record<string, any[]> = {};

    mappedVolunteers.forEach(v => {
      const counties = [v.county, ...(v.coverage_counties || [])];
      counties.forEach(county => {
        if (!volunteersByCounty[county]) volunteersByCounty[county] = [];
        volunteersByCounty[county].push(v);
      });
    });

    mappedTickets.forEach(t => {
      if (!ticketsByCounty[t.county]) ticketsByCounty[t.county] = [];
      ticketsByCounty[t.county].push(t);
    });

    return NextResponse.json({
      success: true,
      data: {
        volunteers: mappedVolunteers,
        tickets: mappedTickets,
        volunteersByCounty,
        ticketsByCounty,
        stats: {
          totalVolunteers: mappedVolunteers.length,
          availableVolunteers: mappedVolunteers.filter(v => v.is_available).length,
          openTickets: mappedTickets.length,
          criticalTickets: mappedTickets.filter(t => t.priority === 'CRITICAL').length,
        }
      }
    });

  } catch (error) {
    console.error('Map data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
