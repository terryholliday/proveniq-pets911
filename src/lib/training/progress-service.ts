// Pet911 Training Progress Service
// Handles content progress tracking, status updates, and prerequisite checking

import { createClient } from '@supabase/supabase-js';
import {
  UserProgress,
  ProgressStatus,
  TrainingModule,
  ModuleProgressSummary,
} from '@/types/training';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProgressService {

  /**
   * Get or create progress record for a user/module
   */
  async getOrCreateProgress(userId: string, moduleId: string): Promise<UserProgress> {
    // Try to get existing
    const { data: existing } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (existing) {
      return this.mapProgress(existing);
    }

    // Create new
    const { data: created, error } = await supabase
      .from('training_user_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'not_started',
        content_progress_pct: 0,
        content_sections_completed: [],
        quiz_attempts: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create progress record');
    }

    return this.mapProgress(created);
  }

  /**
   * Start a module (first access)
   */
  async startModule(userId: string, moduleId: string): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('training_user_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,module_id',
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to start module');
    }

    return this.mapProgress(data);
  }

  /**
   * Mark a content section as complete
   */
  async completeSection(
    userId: string, 
    moduleId: string, 
    sectionId: string
  ): Promise<UserProgress> {
    // Get current progress
    const progress = await this.getOrCreateProgress(userId, moduleId);
    
    // Add section if not already completed
    const completedSections = new Set(progress.contentSectionsCompleted);
    completedSections.add(sectionId);
    const sectionsArray = Array.from(completedSections);

    // Get module to calculate percentage
    const { data: module } = await supabase
      .from('training_modules')
      .select('content_json')
      .eq('id', moduleId)
      .single();

    const totalSections = module?.content_json?.sections?.length || 1;
    const progressPct = Math.round((sectionsArray.length / totalSections) * 100);

    // Determine new status
    let newStatus: ProgressStatus = 'in_progress';
    if (progressPct === 100) {
      newStatus = 'content_complete';
    }

    // Update
    const { data, error } = await supabase
      .from('training_user_progress')
      .update({
        status: newStatus,
        content_progress_pct: progressPct,
        content_sections_completed: sectionsArray,
        content_completed_at: progressPct === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update section progress');
    }

    return this.mapProgress(data);
  }

  /**
   * Mark content as complete (ready for quiz)
   */
  async completeContent(userId: string, moduleId: string): Promise<UserProgress> {
    const { data: module } = await supabase
      .from('training_modules')
      .select('requires_quiz')
      .eq('id', moduleId)
      .single();

    const newStatus: ProgressStatus = module?.requires_quiz 
      ? 'quiz_pending' 
      : 'completed';

    const update: any = {
      status: newStatus,
      content_progress_pct: 100,
      content_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If no quiz required, mark as completed
    if (!module?.requires_quiz) {
      update.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('training_user_progress')
      .update(update)
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to complete content');
    }

    return this.mapProgress(data);
  }

  /**
   * Save reading position for resuming later
   */
  async savePosition(
    userId: string,
    moduleId: string,
    position: { sectionId: string; scrollPosition?: number; videoTimestamp?: number }
  ): Promise<void> {
    await supabase
      .from('training_user_progress')
      .update({
        last_content_position: position,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId);
  }

  /**
   * Check if user can access a module (prerequisites met, background check, etc.)
   */
  async canAccessModule(userId: string, moduleId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    unmetPrerequisites?: { id: string; slug: string; title: string }[];
  }> {
    // Get module requirements
    const { data: module } = await supabase
      .from('training_modules')
      .select(`
        *,
        prerequisites:training_prerequisites!module_id(
          prerequisite:training_modules!prerequisite_module_id(id, slug, title)
        )
      `)
      .eq('id', moduleId)
      .single();

    if (!module) {
      return { canAccess: false, reason: 'Module not found' };
    }

    // Check prerequisites
    if (module.prerequisites?.length > 0) {
      const { data: userProgress } = await supabase
        .from('training_user_progress')
        .select('module_id, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const completedModules = new Set(
        userProgress
          ?.filter(p => !p.expires_at || new Date(p.expires_at) > new Date())
          .map(p => p.module_id) || []
      );

      const unmetPrereqs = module.prerequisites
        .filter((p: any) => !completedModules.has(p.prerequisite?.id))
        .map((p: any) => p.prerequisite);

      if (unmetPrereqs.length > 0) {
        return {
          canAccess: false,
          reason: 'Prerequisites not met',
          unmetPrerequisites: unmetPrereqs,
        };
      }
    }

    // Check background check requirement
    if (module.requires_background_check) {
      const { data: bgCheck } = await supabase
        .from('volunteer_background_checks')
        .select('status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'cleared')
        .single();

      if (!bgCheck || (bgCheck.expires_at && new Date(bgCheck.expires_at) < new Date())) {
        return {
          canAccess: false,
          reason: 'Background check required',
        };
      }
    }

    // Check for active cooldown
    const { data: cooldown } = await supabase
      .from('volunteer_cooldown_events')
      .select('*')
      .eq('user_id', userId)
      .gt('ends_at', new Date().toISOString())
      .is('overridden_by', null)
      .single();

    if (cooldown) {
      return {
        canAccess: false,
        reason: 'Cooldown active',
      };
    }

    return { canAccess: true };
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to fetch user progress');
    }

    return (data || []).map(this.mapProgress);
  }

  /**
   * Get progress summary for dashboard
   */
  async getProgressSummary(userId: string): Promise<{
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    totalHours: number;
    certificationsEarned: number;
    certificationsExpiringSoon: number;
  }> {
    // Get progress counts
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('status, module_id')
      .eq('user_id', userId);

    type ProgressRow = { status: string; module_id: string };
    const progressRows = (progress as ProgressRow[] | null) || [];

    // Get certification counts
    const { data: certs } = await supabase
      .from('volunteer_certifications')
      .select('id, expires_at, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const completedProgress = progressRows.filter(p => p.status === 'completed');
    const inProgressProgress = progressRows.filter(p => 
      p.status === 'in_progress' || p.status === 'content_complete' || p.status === 'quiz_pending'
    );

    // Fetch module durations for completed modules
    const completedModuleIds = completedProgress.map(p => p.module_id).filter(Boolean);
    let totalMinutes = 0;
    if (completedModuleIds.length > 0) {
      const { data: modules } = await supabase
        .from('training_modules')
        .select('estimated_minutes')
        .in('id', completedModuleIds);
      
      totalMinutes = (modules as { estimated_minutes?: number }[] | null)?.reduce(
        (sum, m) => sum + (m.estimated_minutes || 0),
        0
      ) || 0;
    }

    return {
      totalModules: progressRows.length,
      completedModules: completedProgress.length,
      inProgressModules: inProgressProgress.length,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      certificationsEarned: certs?.length || 0,
      certificationsExpiringSoon: certs?.filter(c => 
        c.expires_at && new Date(c.expires_at) <= thirtyDaysFromNow
      ).length || 0,
    };
  }

  /**
   * Check and process expired progress/certifications
   */
  async processExpirations(userId: string): Promise<number> {
    const now = new Date().toISOString();

    // Expire progress records
    const { data: expiredProgress } = await supabase
      .from('training_user_progress')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('expires_at', now)
      .select('id');

    // Expire certifications
    const { data: expiredCerts } = await supabase
      .from('volunteer_certifications')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id');

    return (expiredProgress?.length || 0) + (expiredCerts?.length || 0);
  }

  /**
   * Request supervisor signoff
   */
  async requestSignoff(userId: string, moduleId: string): Promise<void> {
    // Get available supervisors (users with moderator_t3 certification)
    const { data: supervisors } = await supabase
      .from('volunteer_certifications')
      .select('user_id')
      .eq('status', 'active')
      .ilike('certificate_number', '%MOD%T3%');

    if (!supervisors || supervisors.length === 0) {
      throw new Error('No supervisors available');
    }

    // For now, assign to first available (could be improved with load balancing)
    const supervisorId = supervisors[0].user_id;

    // Get progress record
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    // Create signoff request
    await supabase
      .from('supervisor_signoffs')
      .insert({
        user_id: userId,
        module_id: moduleId,
        progress_id: progress?.id,
        supervisor_id: supervisorId,
        status: 'pending',
      });

    // Update progress status
    await supabase
      .from('training_user_progress')
      .update({ status: 'awaiting_signoff' })
      .eq('user_id', userId)
      .eq('module_id', moduleId);
  }

  /**
   * Log shadowing hours
   */
  async logShadowingHours(
    userId: string,
    moduleId: string,
    mentorId: string,
    sessionDate: Date,
    hours: number,
    activityType: string,
    activityDescription?: string,
    location?: string
  ): Promise<void> {
    await supabase
      .from('shadowing_records')
      .insert({
        user_id: userId,
        module_id: moduleId,
        mentor_id: mentorId,
        session_date: sessionDate.toISOString().split('T')[0],
        hours,
        activity_type: activityType,
        activity_description: activityDescription,
        location,
        verified: false,
      });

    // Check if shadowing requirement is now met
    const { data: module } = await supabase
      .from('training_modules')
      .select('shadowing_hours_required')
      .eq('id', moduleId)
      .single();

    const { data: totalHours } = await supabase
      .from('shadowing_records')
      .select('hours')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('verified', true);

    const verifiedHours = totalHours?.reduce((sum, r) => sum + r.hours, 0) || 0;

    if (verifiedHours >= (module?.shadowing_hours_required || 0)) {
      // Shadowing complete, check if ready for full completion
      const { data: progress } = await supabase
        .from('training_user_progress')
        .select('status')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single();

      if (progress?.status === 'awaiting_shadowing') {
        await supabase
          .from('training_user_progress')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('module_id', moduleId);
      }
    }
  }

  private mapProgress(data: any): UserProgress {
    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      status: data.status,
      contentProgressPct: data.content_progress_pct,
      contentSectionsCompleted: data.content_sections_completed || [],
      lastContentPosition: data.last_content_position,
      contentCompletedAt: data.content_completed_at ? new Date(data.content_completed_at) : undefined,
      quizAttempts: data.quiz_attempts,
      bestQuizScore: data.best_quiz_score,
      lastQuizScore: data.last_quiz_score,
      lastQuizAt: data.last_quiz_at ? new Date(data.last_quiz_at) : undefined,
      quizPassedAt: data.quiz_passed_at ? new Date(data.quiz_passed_at) : undefined,
      quizLockedUntil: data.quiz_locked_until ? new Date(data.quiz_locked_until) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      certificateId: data.certificate_id,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      updatedAt: new Date(data.updated_at),
      module: data.module,
    };
  }
}

export const progressService = new ProgressService();
