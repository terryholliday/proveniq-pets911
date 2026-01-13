import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/leaderboard
 * Fetch volunteer leaderboard with real stats from database
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, year, all
    const category = searchParams.get('category') || 'all'; // all, transport, foster, emergency

    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Fetch volunteers with stats
    const { data: volunteers, error } = await adminDb
      .from('volunteers')
      .select(`
        id,
        display_name,
        primary_county,
        capabilities,
        total_dispatches,
        completed_dispatches,
        declined_dispatches,
        average_response_time_minutes,
        last_active_at,
        created_at
      `)
      .in('status', ['ACTIVE', 'ON_MISSION', 'INACTIVE'])
      .order('completed_dispatches', { ascending: false });

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Filter by category if specified
    let filtered = volunteers || [];
    if (category !== 'all') {
      const capMap: Record<string, string> = {
        transport: 'TRANSPORT',
        foster: 'FOSTER',
        emergency: 'EMERGENCY',
      };
      filtered = filtered.filter(v => v.capabilities?.includes(capMap[category]));
    }

    // Calculate rankings and stats
    const leaderboard = filtered.map((v, index) => {
      const successRate = v.total_dispatches > 0 
        ? (v.completed_dispatches / v.total_dispatches) * 100 
        : 100;
      
      const rating = calculateRating(v.completed_dispatches, v.total_dispatches, v.average_response_time_minutes);
      
      return {
        rank: index + 1,
        id: v.id,
        name: v.display_name || 'Anonymous',
        county: v.primary_county || 'Unknown',
        capabilities: v.capabilities || [],
        stats: {
          totalMissions: v.total_dispatches || 0,
          completedMissions: v.completed_dispatches || 0,
          declinedMissions: v.declined_dispatches || 0,
          successRate: Math.round(successRate),
          avgResponseTime: v.average_response_time_minutes || null,
          rating: rating,
        },
        lastActive: v.last_active_at,
        joinedAt: v.created_at,
      };
    });

    // Calculate aggregate stats
    const totalMissions = leaderboard.reduce((sum, v) => sum + v.stats.completedMissions, 0);
    const avgResponseTime = leaderboard.length > 0
      ? leaderboard.reduce((sum, v) => sum + (v.stats.avgResponseTime || 0), 0) / leaderboard.filter(v => v.stats.avgResponseTime).length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboard.slice(0, 50), // Top 50
        period,
        category,
        stats: {
          totalVolunteers: leaderboard.length,
          totalMissions,
          avgResponseTime: Math.round(avgResponseTime),
          topPerformer: leaderboard[0]?.name || null,
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateRating(completed: number, total: number, avgResponse: number | null): number {
  if (completed < 3) return 5.0; // New volunteers get benefit of doubt
  
  let rating = 4.0;
  
  // Success rate bonus (up to +0.5)
  const successRate = total > 0 ? completed / total : 1;
  rating += successRate * 0.5;
  
  // Response time bonus (up to +0.3)
  if (avgResponse && avgResponse < 15) {
    rating += 0.3;
  } else if (avgResponse && avgResponse < 30) {
    rating += 0.15;
  }
  
  // Volume bonus (up to +0.2)
  if (completed > 50) rating += 0.2;
  else if (completed > 20) rating += 0.1;
  
  return Math.min(5.0, Math.round(rating * 10) / 10);
}
