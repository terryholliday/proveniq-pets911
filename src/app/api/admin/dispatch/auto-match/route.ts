import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(url, key);
}

type MatchScore = {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_phone: string;
  county: string;
  capabilities: string[];
  vehicle_type: string | null;
  can_transport_crate: boolean;
  foster_capacity: number;
  completed_missions: number;
  rating: number;
  is_available: boolean;
  last_active_at: string | null;
  // Scoring
  match_score: number;
  match_reasons: string[];
  is_best_match: boolean;
};

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { dispatch_id } = body;

    if (!dispatch_id) {
      return NextResponse.json({ success: false, error: 'dispatch_id required' }, { status: 400 });
    }

    // Get the dispatch request details
    const { data: dispatch, error: dispatchError } = await supabase
      .from('dispatch_requests')
      .select('*')
      .eq('id', dispatch_id)
      .single();

    if (dispatchError || !dispatch) {
      return NextResponse.json({ success: false, error: 'Dispatch request not found' }, { status: 404 });
    }

    // Get all available volunteers with their profiles
    const { data: volunteers, error: volError } = await supabase
      .from('volunteer_profiles')
      .select(`
        id,
        user_id,
        full_name,
        phone,
        county,
        capabilities,
        vehicle_type,
        can_transport_crate,
        foster_capacity,
        completed_missions,
        rating,
        is_available_now,
        last_active_at
      `)
      .eq('is_active', true);

    if (volError) {
      console.error('Error fetching volunteers:', volError);
      return NextResponse.json({ success: false, error: 'Failed to fetch volunteers' }, { status: 500 });
    }

    // Score each volunteer based on multiple factors
    const scoredVolunteers: MatchScore[] = (volunteers || []).map(vol => {
      let score = 0;
      const reasons: string[] = [];

      // 1. County match (highest priority)
      if (vol.county?.toUpperCase() === dispatch.county?.toUpperCase()) {
        score += 40;
        reasons.push('Same county');
      } else {
        // Check if adjacent county (simplified - would need real adjacency data)
        score += 5;
      }

      // 2. Capability match
      const requiredCap = dispatch.request_type === 'TRANSPORT' ? 'TRANSPORT' 
        : dispatch.request_type === 'FOSTER' ? 'FOSTER' 
        : 'EMERGENCY';
      
      if (vol.capabilities?.includes(requiredCap)) {
        score += 25;
        reasons.push(`Has ${requiredCap.toLowerCase()} capability`);
      }

      // 3. Availability
      if (vol.is_available_now) {
        score += 15;
        reasons.push('Currently available');
      }

      // 4. Equipment match (for transport)
      if (dispatch.request_type === 'TRANSPORT') {
        if (dispatch.needs_crate && vol.can_transport_crate) {
          score += 10;
          reasons.push('Has crate transport');
        }
        if (vol.vehicle_type) {
          // Larger vehicles for larger animals
          if (dispatch.animal_size === 'LARGE' && ['SUV', 'Truck', 'Van'].includes(vol.vehicle_type)) {
            score += 5;
            reasons.push('Suitable vehicle');
          } else if (dispatch.animal_size !== 'LARGE') {
            score += 3;
          }
        }
      }

      // 5. Foster capacity (for foster requests)
      if (dispatch.request_type === 'FOSTER' && vol.foster_capacity > 0) {
        score += 10;
        reasons.push(`${vol.foster_capacity} foster slots`);
      }

      // 6. Experience bonus
      if (vol.completed_missions >= 50) {
        score += 5;
        reasons.push('Experienced (50+ missions)');
      } else if (vol.completed_missions >= 20) {
        score += 3;
        reasons.push('Experienced (20+ missions)');
      }

      // 7. Rating bonus
      if (vol.rating >= 4.8) {
        score += 5;
        reasons.push('Top rated');
      } else if (vol.rating >= 4.5) {
        score += 3;
      }

      // 8. Recent activity bonus
      if (vol.last_active_at) {
        const lastActive = new Date(vol.last_active_at);
        const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
        if (hoursSinceActive < 1) {
          score += 5;
          reasons.push('Active recently');
        } else if (hoursSinceActive < 24) {
          score += 2;
        }
      }

      return {
        volunteer_id: vol.user_id || vol.id,
        volunteer_name: vol.full_name || 'Unknown',
        volunteer_phone: vol.phone || '',
        county: vol.county || '',
        capabilities: vol.capabilities || [],
        vehicle_type: vol.vehicle_type,
        can_transport_crate: vol.can_transport_crate || false,
        foster_capacity: vol.foster_capacity || 0,
        completed_missions: vol.completed_missions || 0,
        rating: vol.rating || 0,
        is_available: vol.is_available_now || false,
        last_active_at: vol.last_active_at,
        match_score: score,
        match_reasons: reasons,
        is_best_match: false,
      };
    });

    // Sort by score descending
    scoredVolunteers.sort((a, b) => b.match_score - a.match_score);

    // Mark the best match
    if (scoredVolunteers.length > 0) {
      scoredVolunteers[0].is_best_match = true;
    }

    // Return top 10 matches
    const topMatches = scoredVolunteers.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        dispatch_id,
        request_type: dispatch.request_type,
        county: dispatch.county,
        matches: topMatches,
        total_volunteers: volunteers?.length || 0,
      },
    });

  } catch (error) {
    console.error('Auto-match error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
