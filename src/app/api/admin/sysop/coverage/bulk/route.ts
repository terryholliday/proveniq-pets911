import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// POST - Bulk update coverage assignments for a moderator
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
    const { moderator_id, assignments } = body;

    if (!moderator_id || !Array.isArray(assignments)) {
      return NextResponse.json({ 
        success: false, 
        error: 'moderator_id and assignments array are required' 
      }, { status: 400 });
    }

    // Start transaction - deactivate all existing assignments for this moderator
    const { error: deactivateError } = await supabase
      .from('moderator_coverage_assignments')
      .update({ is_active: false })
      .eq('moderator_id', moderator_id);

    if (deactivateError) {
      console.error('Error deactivating assignments:', deactivateError);
      return NextResponse.json({ success: false, error: 'Failed to update assignments' }, { status: 500 });
    }

    // Insert new assignments if any
    if (assignments.length > 0) {
      const newAssignments = assignments.map((a: { coverage_area_id: string; assignment_type: string; priority?: number }) => ({
        moderator_id,
        coverage_area_id: a.coverage_area_id,
        assignment_type: a.assignment_type,
        priority: a.priority || 1,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('moderator_coverage_assignments')
        .upsert(newAssignments, {
          onConflict: 'moderator_id,coverage_area_id'
        });

      if (insertError) {
        console.error('Error inserting assignments:', insertError);
        return NextResponse.json({ success: false, error: 'Failed to create assignments' }, { status: 500 });
      }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'MODERATOR_COVERAGE_UPDATED',
      entity_type: 'moderator',
      entity_id: moderator_id,
      details: { assignments_count: assignments.length },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${assignments.length} coverage assignments for moderator`
    });

  } catch (error) {
    console.error('Bulk coverage error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
