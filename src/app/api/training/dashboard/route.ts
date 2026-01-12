// Pet911 Training Dashboard API
// GET /api/training/dashboard - Get user's training dashboard data

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TrainingDashboard, ModuleProgressSummary, TrainingTrack, TRACK_CONFIG } from '@/types/training';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all active modules
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select(`
        *,
        prerequisites:training_prerequisites!module_id(
          prerequisite:training_modules!prerequisite_module_id(id, slug, title)
        )
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (modulesError) {
      throw new Error('Failed to fetch modules');
    }

    // 2. Get user's progress for all modules
    const { data: progressRecords } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', user.id);

    const progressMap = new Map(
      progressRecords?.map(p => [p.module_id, p]) || []
    );

    // 3. Get user's background check status
    const { data: backgroundCheck } = await supabase
      .from('volunteer_background_checks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const backgroundCheckCleared = backgroundCheck?.status === 'cleared' &&
      (!backgroundCheck.expires_at || new Date(backgroundCheck.expires_at) > new Date());

    // 4. Get active certifications
    const { data: certifications } = await supabase
      .from('volunteer_certifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    // 5. Get expiring certifications (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCertifications = certifications?.filter(c => 
      c.expires_at && new Date(c.expires_at) <= thirtyDaysFromNow
    ) || [];

    // 6. Get active cooldown
    const { data: cooldown } = await supabase
      .from('volunteer_cooldown_events')
      .select('*')
      .eq('user_id', user.id)
      .gt('ends_at', new Date().toISOString())
      .is('overridden_by', null)
      .order('ends_at', { ascending: false })
      .limit(1)
      .single();

    // 7. Build module progress summaries
    const buildModuleProgress = (module: any): ModuleProgressSummary => {
      const progress = progressMap.get(module.id) || null;
      
      // Check prerequisites
      const prerequisitesMet = !module.prerequisites?.length || 
        module.prerequisites.every((prereq: any) => {
          const prereqProgress = progressMap.get(prereq.prerequisite?.id);
          return prereqProgress?.status === 'completed' &&
            (!prereqProgress.expires_at || new Date(prereqProgress.expires_at) > new Date());
        });

      // Check background check requirement
      const requiresBgCheck = module.requires_background_check;
      const bgCheckCleared = !requiresBgCheck || backgroundCheckCleared;

      // Determine if can start
      const canStart = prerequisitesMet && bgCheckCleared;
      
      let blockedReason: string | undefined;
      if (!prerequisitesMet) {
        const unmetPrereqs = module.prerequisites
          ?.filter((p: any) => {
            const pp = progressMap.get(p.prerequisite?.id);
            return !pp || pp.status !== 'completed';
          })
          .map((p: any) => p.prerequisite?.title)
          .join(', ');
        blockedReason = `Complete first: ${unmetPrereqs}`;
      } else if (!bgCheckCleared) {
        blockedReason = 'Background check required';
      }

      return {
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
          createdAt: new Date(module.created_at),
          updatedAt: new Date(module.updated_at),
        },
        progress: progress ? {
          id: progress.id,
          userId: progress.user_id,
          moduleId: progress.module_id,
          status: progress.status,
          contentProgressPct: progress.content_progress_pct,
          contentSectionsCompleted: progress.content_sections_completed || [],
          lastContentPosition: progress.last_content_position,
          contentCompletedAt: progress.content_completed_at ? new Date(progress.content_completed_at) : undefined,
          quizAttempts: progress.quiz_attempts,
          bestQuizScore: progress.best_quiz_score,
          lastQuizScore: progress.last_quiz_score,
          lastQuizAt: progress.last_quiz_at ? new Date(progress.last_quiz_at) : undefined,
          quizPassedAt: progress.quiz_passed_at ? new Date(progress.quiz_passed_at) : undefined,
          quizLockedUntil: progress.quiz_locked_until ? new Date(progress.quiz_locked_until) : undefined,
          completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
          certificateId: progress.certificate_id,
          expiresAt: progress.expires_at ? new Date(progress.expires_at) : undefined,
          startedAt: progress.started_at ? new Date(progress.started_at) : undefined,
          updatedAt: new Date(progress.updated_at),
        } : null,
        prerequisitesMet,
        backgroundCheckRequired: requiresBgCheck,
        backgroundCheckCleared: bgCheckCleared,
        canStart,
        blockedReason,
      };
    };

    // 8. Group modules by track
    const tracks = Object.keys(TRACK_CONFIG) as TrainingTrack[];
    const trackData = tracks.map(track => {
      const trackModules = modules?.filter(m => m.track === track) || [];
      const moduleProgress = trackModules.map(buildModuleProgress);
      const completedCount = moduleProgress.filter(mp => mp.progress?.status === 'completed').length;

      return {
        track,
        title: TRACK_CONFIG[track].title,
        modules: moduleProgress,
        completedCount,
        totalCount: trackModules.length,
      };
    }).filter(t => t.totalCount > 0); // Only show tracks with modules

    // 9. Build response
    const dashboard: TrainingDashboard = {
      tracks: trackData,
      activeCertifications: certifications?.map(c => ({
        id: c.id,
        userId: c.user_id,
        moduleId: c.module_id,
        certificateNumber: c.certificate_number,
        title: c.title,
        issuedAt: new Date(c.issued_at),
        expiresAt: c.expires_at ? new Date(c.expires_at) : undefined,
        status: c.status,
        verificationHash: c.verification_hash,
        pdfUrl: c.pdf_url,
        finalScore: c.final_score,
      })) || [],
      expiringCertifications: expiringCertifications.map(c => ({
        id: c.id,
        userId: c.user_id,
        moduleId: c.module_id,
        certificateNumber: c.certificate_number,
        title: c.title,
        issuedAt: new Date(c.issued_at),
        expiresAt: c.expires_at ? new Date(c.expires_at) : undefined,
        status: c.status,
        verificationHash: c.verification_hash,
        pdfUrl: c.pdf_url,
        finalScore: c.final_score,
      })),
      backgroundCheck: backgroundCheck ? {
        id: backgroundCheck.id,
        userId: backgroundCheck.user_id,
        provider: backgroundCheck.provider,
        status: backgroundCheck.status,
        checkType: backgroundCheck.check_type,
        submittedAt: backgroundCheck.submitted_at ? new Date(backgroundCheck.submitted_at) : undefined,
        completedAt: backgroundCheck.completed_at ? new Date(backgroundCheck.completed_at) : undefined,
        expiresAt: backgroundCheck.expires_at ? new Date(backgroundCheck.expires_at) : undefined,
      } : null,
      activeCooldown: cooldown ? {
        id: cooldown.id,
        userId: cooldown.user_id,
        triggerReason: cooldown.trigger_reason,
        cooldownType: cooldown.cooldown_type,
        restrictedActions: cooldown.restricted_actions || [],
        startedAt: new Date(cooldown.started_at),
        endsAt: new Date(cooldown.ends_at),
        acknowledgedAt: cooldown.acknowledged_at ? new Date(cooldown.acknowledged_at) : undefined,
      } : null,
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
