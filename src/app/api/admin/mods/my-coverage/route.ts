import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get the current moderator's assigned coverage areas
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get the moderator's coverage assignments
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

    if (error) {
      console.error('Error fetching coverage:', error);
      // Return empty coverage rather than error - moderator may not have assignments yet
      return NextResponse.json({ 
        success: true, 
        data: {
          counties: [],
          states: [],
          hasStatewide: false
        }
      });
    }

    // Parse the assignments into a useful format
    const counties: string[] = [];
    const states: string[] = [];
    let hasStatewide = false;

    assignments?.forEach(a => {
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

    return NextResponse.json({ 
      success: true, 
      data: {
        counties: [...new Set(counties)],
        states: [...new Set(states)],
        hasStatewide,
        assignments: assignments || []
      }
    });

  } catch (error) {
    console.error('My coverage API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
