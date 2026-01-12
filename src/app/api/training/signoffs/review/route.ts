import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST - Review a signoff request (supervisor only)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a supervisor
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['supervisor', 'admin', 'guardian'])
      .single();

    if (!userRole) {
      return NextResponse.json(
        { error: 'Not authorized to review signoffs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { signoffId, status, supervisorNotes, competencyRating } = body;

    // Validate inputs
    if (!signoffId || !status) {
      return NextResponse.json(
        { error: 'Signoff ID and status required' },
        { status: 400 }
      );
    }

    if (!['approved', 'needs_work', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Require notes for non-approval decisions
    if ((status === 'needs_work' || status === 'denied') && !supervisorNotes?.trim()) {
      return NextResponse.json(
        { error: 'Notes required for non-approval decisions' },
        { status: 400 }
      );
    }

    // Get signoff record
    const { data: signoff, error: fetchError } = await supabase
      .from('supervisor_signoffs')
      .select(`
        *,
        module:training_modules!module_id(id, title, requires_shadowing, shadowing_hours_required, certification_valid_days)
      `)
      .eq('id', signoffId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !signoff) {
      return NextResponse.json(
        { error: 'Signoff request not found or already reviewed' },
        { status: 404 }
      );
    }

    // Update signoff record
    const { error: updateError } = await supabase
      .from('supervisor_signoffs')
      .update({
        status,
        supervisor_id: userId,
        supervisor_notes: supervisorNotes || null,
        competency_rating: competencyRating || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', signoffId);

    if (updateError) {
      throw updateError;
    }

    // Update user progress based on decision
    if (status === 'approved') {
      // Check if there are any remaining requirements
      const module = signoff.module;
      let newStatus = 'completed';
      
      // If shadowing required, check if complete
      if (module?.requires_shadowing && module.shadowing_hours_required > 0) {
        const { data: shadowingRecords } = await supabase
          .from('shadowing_records')
          .select('hours')
          .eq('user_id', signoff.user_id)
          .eq('module_id', signoff.module_id)
          .eq('verified', true);

        const completedHours = shadowingRecords?.reduce(
          (sum, r) => sum + parseFloat(r.hours),
          0
        ) || 0;

        if (completedHours < module.shadowing_hours_required) {
          newStatus = 'awaiting_shadowing';
        }
      }

      const progressUpdate: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'completed') {
        progressUpdate.completed_at = new Date().toISOString();
        
        // Set expiration if applicable
        if (module?.certification_valid_days) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + module.certification_valid_days);
          progressUpdate.expires_at = expiresAt.toISOString();
        }

        // Issue certificate (call certificate service)
        // This would integrate with your certificate-service.ts
        // const certificateId = await certificateService.issueCertificate(signoff.user_id, signoff.module_id);
        // progressUpdate.certificate_id = certificateId;
      }

      await supabase
        .from('training_user_progress')
        .update(progressUpdate)
        .eq('user_id', signoff.user_id)
        .eq('module_id', signoff.module_id);
    } else if (status === 'needs_work') {
      // Reset to content_complete so they can re-review and re-request
      await supabase
        .from('training_user_progress')
        .update({
          status: 'content_complete',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', signoff.user_id)
        .eq('module_id', signoff.module_id);
    } else if (status === 'denied') {
      // Mark as quiz_failed so they need to restart
      await supabase
        .from('training_user_progress')
        .update({
          status: 'quiz_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', signoff.user_id)
        .eq('module_id', signoff.module_id);
    }

    // Send notification to volunteer (implement based on your notification system)
    // await notifyVolunteer(signoff.user_id, signoff.module_id, status, supervisorNotes);

    return NextResponse.json({
      success: true,
      message: `Signoff ${status}`,
    });
  } catch (error) {
    console.error('Failed to review signoff:', error);
    return NextResponse.json(
      { error: 'Failed to review signoff' },
      { status: 500 }
    );
  }
}
