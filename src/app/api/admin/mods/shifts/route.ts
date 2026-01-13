import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/shifts
 * Fetch volunteer shifts for scheduling calendar
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
    const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const county = searchParams.get('county');

    // Fetch shifts with volunteer info
    let query = adminDb
      .from('volunteer_shifts')
      .select(`
        id,
        volunteer_id,
        shift_date,
        start_time,
        end_time,
        shift_type,
        status,
        county,
        notes,
        volunteers (
          id,
          display_name,
          primary_county,
          capabilities
        )
      `)
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (county) {
      query = query.eq('county', county);
    }

    const { data: shifts, error } = await query;

    if (error) {
      console.error('Shifts fetch error:', error);
      // Return empty if table doesn't exist yet
      return NextResponse.json({ 
        success: true, 
        data: { shifts: [], stats: { total: 0, confirmed: 0, gaps: 0 } } 
      });
    }

    // Transform shifts
    const mappedShifts = (shifts || []).map((s: any) => ({
      id: s.id,
      volunteerId: s.volunteer_id,
      volunteerName: s.volunteers?.display_name || 'Unknown',
      date: s.shift_date,
      startTime: s.start_time,
      endTime: s.end_time,
      type: s.shift_type,
      status: s.status,
      county: s.county || s.volunteers?.primary_county,
      notes: s.notes,
    }));

    // Calculate stats
    const stats = {
      total: mappedShifts.length,
      confirmed: mappedShifts.filter(s => s.status === 'confirmed').length,
      scheduled: mappedShifts.filter(s => s.status === 'scheduled').length,
      completed: mappedShifts.filter(s => s.status === 'completed').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        shifts: mappedShifts,
        stats,
        dateRange: { start: startDate, end: endDate }
      }
    });

  } catch (error) {
    console.error('Shifts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/mods/shifts
 * Create a new shift
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { volunteer_id, shift_date, start_time, end_time, shift_type, county, notes } = body;

    if (!volunteer_id || !shift_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: shift, error } = await adminDb
      .from('volunteer_shifts')
      .insert({
        volunteer_id,
        shift_date,
        start_time,
        end_time,
        shift_type: shift_type || 'regular',
        status: 'scheduled',
        county,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Shift create error:', error);
      return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }

    return NextResponse.json({ success: true, shift });

  } catch (error) {
    console.error('Shifts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/mods/shifts
 * Update shift or handle swap requests
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    // Request shift swap
    if (action === 'request_swap') {
      const { shift_id, reason } = body;
      
      const { data: swap, error } = await adminDb
        .from('shift_swap_requests')
        .insert({
          shift_id,
          requesting_volunteer_id: user.id,
          status: 'pending',
          reason,
        })
        .select()
        .single();

      if (error) {
        console.error('Swap request error:', error);
        return NextResponse.json({ error: 'Failed to request swap' }, { status: 500 });
      }

      return NextResponse.json({ success: true, swap });
    }

    // Claim swap (volunteer offers to take the shift)
    if (action === 'claim_swap') {
      const { swap_id } = body;
      
      const { error } = await adminDb
        .from('shift_swap_requests')
        .update({
          accepting_volunteer_id: user.id,
          status: 'claimed',
        })
        .eq('id', swap_id)
        .eq('status', 'pending');

      if (error) {
        console.error('Claim swap error:', error);
        return NextResponse.json({ error: 'Failed to claim swap' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Swap claimed - pending approval' });
    }

    // Approve swap (moderator action)
    if (action === 'approve_swap') {
      const { swap_id } = body;
      
      // Get swap details
      const { data: swap, error: fetchError } = await adminDb
        .from('shift_swap_requests')
        .select('*, shift:shift_id (*)')
        .eq('id', swap_id)
        .single();

      if (fetchError || !swap) {
        return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
      }

      // Update the shift to new volunteer
      const { error: updateError } = await adminDb
        .from('volunteer_shifts')
        .update({ volunteer_id: swap.accepting_volunteer_id })
        .eq('id', swap.shift_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
      }

      // Mark swap as approved
      await adminDb
        .from('shift_swap_requests')
        .update({ 
          status: 'approved', 
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', swap_id);

      return NextResponse.json({ success: true, message: 'Swap approved' });
    }

    // Deny swap
    if (action === 'deny_swap') {
      const { swap_id, reason } = body;
      
      const { error } = await adminDb
        .from('shift_swap_requests')
        .update({ 
          status: 'denied',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', swap_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to deny swap' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Swap denied' });
    }

    // Cancel swap request
    if (action === 'cancel_swap') {
      const { swap_id } = body;
      
      const { error } = await adminDb
        .from('shift_swap_requests')
        .delete()
        .eq('id', swap_id)
        .eq('requesting_volunteer_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel swap' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Swap cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Shifts PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/mods/shifts/swaps - Fetch pending swap requests
 * (handled via query param on main GET)
 */
