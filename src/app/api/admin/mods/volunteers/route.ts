import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/volunteers
 * Fetch all volunteers for moderator roster view
 * Requires MODERATOR or SYSOP role
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
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

    // Check if user has moderator/sysop privileges
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const allowedRoles = ['moderator', 'admin', 'sysop', 'MODERATOR', 'ADMIN', 'SYSOP'];
    
    // Also check capabilities from volunteers table
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: modCheck } = await adminDb
      .from('volunteers')
      .select('capabilities')
      .eq('user_id', user.id)
      .single();

    const hasModCapability = modCheck?.capabilities?.some((c: string) => 
      ['MODERATOR', 'SYSOP', 'ADMIN'].includes(c)
    );

    if (!allowedRoles.includes(userRole) && !hasModCapability) {
      return NextResponse.json({ error: 'Forbidden - Moderator access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const county = searchParams.get('county');
    const capability = searchParams.get('capability');

    // Fetch volunteers
    let query = adminDb
      .from('volunteers')
      .select(`
        id,
        user_id,
        display_name,
        phone,
        email,
        primary_county,
        status,
        capabilities,
        has_vehicle,
        vehicle_type,
        can_transport_crate,
        max_foster_count,
        total_dispatches,
        completed_dispatches,
        average_response_time_minutes,
        last_active_at,
        created_at,
        updated_at
      `)
      .order('last_active_at', { ascending: false, nullsFirst: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }
    if (county) {
      query = query.eq('primary_county', county.toUpperCase());
    }
    if (capability) {
      query = query.contains('capabilities', [capability.toUpperCase()]);
    }

    const { data: volunteers, error } = await query;

    if (error) {
      console.error('Volunteers fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
    }

    // Transform to roster format
    const roster = (volunteers || []).map(v => ({
      id: v.id,
      user_id: v.user_id,
      name: v.display_name || 'Unknown',
      phone: v.phone || '',
      email: v.email,
      county: v.primary_county || 'UNKNOWN',
      status: mapStatus(v.status),
      capabilities: v.capabilities || [],
      vehicle_type: v.vehicle_type,
      can_transport_crate: v.can_transport_crate || false,
      foster_capacity: v.max_foster_count || 0,
      completed_missions: v.completed_dispatches || 0,
      total_dispatches: v.total_dispatches || 0,
      rating: calculateRating(v.completed_dispatches, v.total_dispatches),
      avg_response_time: v.average_response_time_minutes,
      last_active: formatLastActive(v.last_active_at),
      last_active_at: v.last_active_at,
      created_at: v.created_at,
    }));

    return NextResponse.json({ 
      success: true, 
      volunteers: roster,
      count: roster.length 
    });

  } catch (error) {
    console.error('Volunteers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapStatus(dbStatus: string): 'available' | 'busy' | 'offline' {
  switch (dbStatus?.toUpperCase()) {
    case 'ACTIVE': return 'available';
    case 'ON_MISSION': return 'busy';
    case 'BUSY': return 'busy';
    default: return 'offline';
  }
}

function calculateRating(completed: number, total: number): number {
  if (!completed || completed < 5) return 5.0; // New volunteers get benefit of doubt
  const successRate = completed / Math.max(total, 1);
  return Math.round((4 + successRate) * 10) / 10; // 4.0 - 5.0 range
}

function formatLastActive(lastActive: string | null): string {
  if (!lastActive) return 'Never';
  
  const diff = Date.now() - new Date(lastActive).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 5) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
