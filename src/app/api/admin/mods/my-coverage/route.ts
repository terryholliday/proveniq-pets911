import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - Get the current moderator's assigned coverage areas
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // First, try to get explicit moderator coverage assignments
    const { data: assignments, error } = await supabase
      .from('moderator_coverage_assignments')
      .select(`
        id,
        assignment_type,
        priority,
        coverage_areas (
          id,
          area_type,
          state_code,
          county_name,
          display_name
        )
      `)
      .eq('moderator_id', user.id)
      .eq('is_active', true);

    // Parse the assignments into a useful format
    const counties: string[] = [];
    const states: string[] = [];
    let hasStatewide = false;

    if (!error && assignments && assignments.length > 0) {
      assignments.forEach(a => {
        const area = a.coverage_areas as any;
        if (area) {
          if (area.area_type === 'county' && area.county_name) {
            counties.push(area.county_name);
          } else if (area.area_type === 'state') {
            states.push(area.state_code);
            hasStatewide = true;
          }
        }
      });
    }

    // If no explicit assignments, fall back to volunteer profile's coverage areas
    if (counties.length === 0 && !hasStatewide) {
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('primary_county, coverage_counties, capabilities')
        .eq('user_id', user.id)
        .single();

      if (volunteer) {
        // Add primary county
        if (volunteer.primary_county) {
          counties.push(volunteer.primary_county);
        }
        
        // Add additional coverage counties if they exist
        if (volunteer.coverage_counties && Array.isArray(volunteer.coverage_counties)) {
          counties.push(...volunteer.coverage_counties);
        }

        // Check if user has SYSOP capability = statewide access
        if (volunteer.capabilities?.includes('SYSOP')) {
          hasStatewide = true;
        }
      }
    }

    // Check user role for statewide access
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (['sysop', 'SYSOP', 'admin', 'ADMIN'].includes(userRole)) {
      hasStatewide = true;
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        counties: [...new Set(counties)],
        states: [...new Set(states)],
        hasStatewide,
        assignments: assignments || [],
        source: assignments && assignments.length > 0 ? 'moderator_assignments' : 'volunteer_profile'
      }
    });

  } catch (error) {
    console.error('My coverage API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
