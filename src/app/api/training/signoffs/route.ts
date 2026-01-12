import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET - Fetch signoffs (for supervisors) or user's signoff status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const moduleId = searchParams.get('moduleId');

    // If supervisor role, get all pending signoffs
    if (role === 'supervisor') {
      // Verify user is a supervisor
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['supervisor', 'admin', 'guardian'])
        .single();

      if (!userRole) {
        return NextResponse.json(
          { error: 'Not authorized as supervisor' },
          { status: 403 }
        );
      }

      // Get pending signoffs
      const { data: pending } = await supabase
        .from('supervisor_signoffs')
        .select(`
          *,
          user:auth.users!user_id(id, email, raw_user_meta_data),
          module:training_modules!module_id(id, title, category)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      // Get recently completed
      const { data: completed } = await supabase
        .from('supervisor_signoffs')
        .select(`
          *,
          user:auth.users!user_id(id, email, raw_user_meta_data),
          module:training_modules!module_id(id, title)
        `)
        .eq('supervisor_id', userId)
        .neq('status', 'pending')
        .order('reviewed_at', { ascending: false })
        .limit(20);

      const transformedPending = pending?.map(s => ({
        id: s.id,
        volunteerId: s.user_id,
        volunteerName: s.user?.raw_user_meta_data?.name || s.user?.email || 'Unknown',
        volunteerEmail: s.user?.email,
        moduleId: s.module_id,
        moduleTitle: s.module?.title || 'Unknown Module',
        moduleCategory: s.module?.category || 'general',
        quizScore: 0, // Fetch from progress
        shadowingHours: 0, // Fetch from shadowing records
        requestedAt: s.requested_at,
        previousAttempts: 0,
        notes: s.supervisor_notes,
      })) || [];

      const transformedCompleted = completed?.map(s => ({
        id: s.id,
        volunteerId: s.user_id,
        volunteerName: s.user?.raw_user_meta_data?.name || 'Unknown',
        moduleTitle: s.module?.title || 'Unknown',
        status: s.status,
        competencyRating: s.competency_rating,
        supervisorNotes: s.supervisor_notes,
        reviewedAt: s.reviewed_at,
      })) || [];

      return NextResponse.json({
        pending: transformedPending,
        completed: transformedCompleted,
      });
    }

    // Regular user - get their own signoff status for a module
    if (moduleId) {
      const { data: signoff } = await supabase
        .from('supervisor_signoffs')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        signoff: signoff || null,
      });
    }

    // Get all user's signoffs
    const { data: signoffs } = await supabase
      .from('supervisor_signoffs')
      .select(`
        *,
        module:training_modules!module_id(id, title, slug)
      `)
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    return NextResponse.json({
      signoffs: signoffs || [],
    });
  } catch (error) {
    console.error('Failed to fetch signoffs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signoffs' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Request a signoff (volunteer) or create one
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, notes } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID required' },
        { status: 400 }
      );
    }

    // Check if user has completed necessary prerequisites
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (!progress?.quiz_passed_at) {
      return NextResponse.json(
        { error: 'Quiz must be passed before requesting signoff' },
        { status: 400 }
      );
    }

    // Check if already has pending signoff
    const { data: existingSignoff } = await supabase
      .from('supervisor_signoffs')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('status', 'pending')
      .single();

    if (existingSignoff) {
      return NextResponse.json(
        { error: 'You already have a pending signoff request' },
        { status: 400 }
      );
    }

    // Create signoff request
    const { data: signoff, error } = await supabase
      .from('supervisor_signoffs')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update user progress status
    await supabase
      .from('training_user_progress')
      .update({
        status: 'awaiting_signoff',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    // Notify supervisors (implement based on your notification system)
    // await notifySupervisors(signoff);

    return NextResponse.json({
      success: true,
      signoff,
      message: 'Signoff request submitted successfully',
    });
  } catch (error) {
    console.error('Failed to create signoff request:', error);
    return NextResponse.json(
      { error: 'Failed to create signoff request' },
      { status: 500 }
    );
  }
}
