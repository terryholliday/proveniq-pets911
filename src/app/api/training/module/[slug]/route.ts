// Pet911 Module Data API
// GET /api/training/module/[slug] - Get module with user progress and access info

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { progressService } from '@/lib/training/progress-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { slug } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get module by slug
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select(`
        *,
        prerequisites:training_prerequisites!module_id(
          prerequisite:training_modules!prerequisite_module_id(id, slug, title)
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get user progress
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_id', module.id)
      .single();

    // Check access
    const accessCheck = await progressService.canAccessModule(user.id, module.id);

    // Get background check if required
    let backgroundCheck = null;
    if (module.requires_background_check) {
      const { data: bgCheck } = await supabase
        .from('volunteer_background_checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      backgroundCheck = bgCheck;
    }

    // Get shadowing records if required
    let shadowingRecords: { date: Date; hours: number; mentorName: string; verified: boolean }[] = [];
    if (module.requires_shadowing) {
      const { data: records } = await supabase
        .from('shadowing_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .order('session_date', { ascending: false });

      shadowingRecords = (records as { session_date: string; hours: number; mentor_name?: string; verified: boolean }[] | null)?.map(r => ({
        date: new Date(r.session_date),
        hours: r.hours,
        mentorName: r.mentor_name || 'Unknown',
        verified: r.verified,
      })) || [];
    }

    // Get signoff status if applicable
    let signoffStatus = null;
    let signoffNotes = null;
    if (module.requires_supervisor_signoff && progress?.quiz_passed_at) {
      const { data: signoff } = await supabase
        .from('supervisor_signoffs')
        .select('status, supervisor_notes')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (signoff) {
        signoffStatus = signoff.status;
        signoffNotes = signoff.supervisor_notes;
      }
    }

    // Format response
    const response = {
      module: {
        id: module.id,
        slug: module.slug,
        title: module.title,
        subtitle: module.subtitle,
        description: module.description,
        category: module.category,
        track: module.track,
        contentType: module.content_type,
        estimatedMinutes: module.estimated_minutes,
        contentJson: module.content_json,
        requiresQuiz: module.requires_quiz,
        quizQuestionCount: module.quiz_question_count,
        passingScore: module.passing_score,
        maxAttempts: module.max_attempts,
        requiresSupervisorSignoff: module.requires_supervisor_signoff,
        requiresBackgroundCheck: module.requires_background_check,
        requiresShadowing: module.requires_shadowing,
        shadowingHoursRequired: module.shadowing_hours_required,
        certificationValidDays: module.certification_valid_days,
        isMandatory: module.is_mandatory,
        isActive: module.is_active,
        sortOrder: module.sort_order,
        version: module.version,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
      },
      progress: progress ? {
        id: progress.id,
        userId: progress.user_id,
        moduleId: progress.module_id,
        status: progress.status,
        contentProgressPct: progress.content_progress_pct,
        contentSectionsCompleted: progress.content_sections_completed || [],
        lastContentPosition: progress.last_content_position,
        contentCompletedAt: progress.content_completed_at,
        quizAttempts: progress.quiz_attempts,
        bestQuizScore: progress.best_quiz_score,
        lastQuizScore: progress.last_quiz_score,
        lastQuizAt: progress.last_quiz_at,
        quizPassedAt: progress.quiz_passed_at,
        quizLockedUntil: progress.quiz_locked_until,
        completedAt: progress.completed_at,
        certificateId: progress.certificate_id,
        expiresAt: progress.expires_at,
        startedAt: progress.started_at,
        updatedAt: progress.updated_at,
      } : null,
      backgroundCheck: backgroundCheck ? {
        id: backgroundCheck.id,
        userId: backgroundCheck.user_id,
        provider: backgroundCheck.provider,
        status: backgroundCheck.status,
        checkType: backgroundCheck.check_type,
        submittedAt: backgroundCheck.submitted_at,
        completedAt: backgroundCheck.completed_at,
        expiresAt: backgroundCheck.expires_at,
      } : null,
      canAccess: accessCheck.canAccess,
      accessReason: accessCheck.reason,
      unmetPrerequisites: accessCheck.unmetPrerequisites,
      shadowingRecords,
      signoffStatus,
      signoffNotes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Module API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
