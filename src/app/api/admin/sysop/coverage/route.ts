import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - List all coverage areas and assignments
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

    // TODO: Check if user is SYSOP

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'WV';

    // Get coverage areas for state
    const { data: areas, error: areasError } = await supabase
      .from('coverage_areas')
      .select('*')
      .eq('state_code', state)
      .eq('is_active', true)
      .order('county_name');

    if (areasError) {
      console.error('Error fetching areas:', areasError);
      return NextResponse.json({ success: false, error: 'Failed to fetch coverage areas' }, { status: 500 });
    }

    // Get all assignments
    const { data: assignments, error: assignError } = await supabase
      .from('moderator_coverage_assignments')
      .select(`
        *,
        coverage_areas (id, county_name, state_code, display_name),
        moderator:moderator_id (id, email, raw_user_meta_data)
      `)
      .eq('is_active', true);

    if (assignError) {
      console.error('Error fetching assignments:', assignError);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        areas: areas || [],
        assignments: assignments || []
      }
    });

  } catch (error) {
    console.error('Coverage API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update coverage assignment
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

    // TODO: Check if user is SYSOP

    const body = await request.json();
    const { moderator_id, coverage_area_id, assignment_type, priority, notes } = body;

    if (!moderator_id || !coverage_area_id || !assignment_type) {
      return NextResponse.json({ 
        success: false, 
        error: 'moderator_id, coverage_area_id, and assignment_type are required' 
      }, { status: 400 });
    }

    // Upsert the assignment
    const { data: assignment, error } = await supabase
      .from('moderator_coverage_assignments')
      .upsert({
        moderator_id,
        coverage_area_id,
        assignment_type,
        priority: priority || 1,
        notes,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'moderator_id,coverage_area_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json({ success: false, error: 'Failed to create assignment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: assignment });

  } catch (error) {
    console.error('Coverage POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove coverage assignment
export async function DELETE(request: NextRequest) {
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

    // TODO: Check if user is SYSOP

    const { searchParams } = new URL(request.url);
    const moderatorId = searchParams.get('moderator_id');
    const areaId = searchParams.get('area_id');

    if (!moderatorId || !areaId) {
      return NextResponse.json({ 
        success: false, 
        error: 'moderator_id and area_id are required' 
      }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('moderator_coverage_assignments')
      .update({ is_active: false })
      .eq('moderator_id', moderatorId)
      .eq('coverage_area_id', areaId);

    if (error) {
      console.error('Error removing assignment:', error);
      return NextResponse.json({ success: false, error: 'Failed to remove assignment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Coverage DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
