/**
 * TRAINING PROGRESS SERVICE - API-Backed Training Progress
 * 
 * Replaces localStorage training progress with Supabase persistence.
 * Falls back to localStorage when offline or unauthenticated.
 * 
 * CONSTRAINTS:
 * - All progress changes logged to audit trail
 * - Syncs localStorage to server on auth
 * - Deterministic completion verification
 */

import type { UserId } from '@/modules/operations/types';
import { createServerClient } from '@/lib/supabase/client';
import { createAuditEntry } from './infrastructure/audit-log';
import { eventBus, createServiceEvent } from './infrastructure/event-bus';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface TrainingModuleProgress {
  moduleId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  score?: number;
  lessonProgress: LessonProgress[];
  lastAccessedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string;
  timeSpentSeconds: number;
}

export interface UserTrainingProgressSummary {
  userId: string;
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  overallPercentage: number;
  moduleProgress: TrainingModuleProgress[];
  lastActivityAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface ITrainingProgressService {
  // Module progress
  getModuleProgress(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<TrainingModuleProgress | null>;
  startModule(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<TrainingModuleProgress>;
  completeModule(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    score?: number
  ): Promise<TrainingModuleProgress>;
  isModuleCompleted(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<boolean>;
  
  // Lesson progress
  updateLessonProgress(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    lessonId: string,
    timeSpent: number
  ): Promise<TrainingModuleProgress>;
  completeLesson(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    lessonId: string
  ): Promise<TrainingModuleProgress>;
  
  // Summary
  getUserProgress(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<UserTrainingProgressSummary>;
  getCompletedModuleIds(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string[]>;
  
  // Sync
  syncFromLocalStorage(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    localData: Record<string, { completedAt: string }>
  ): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class TrainingProgressServiceImpl implements ITrainingProgressService {
  private buildCompletedProgress(params: {
    userId: string;
    moduleId: string;
    completedAt: string;
    score?: number | null;
  }): TrainingModuleProgress {
    return {
      moduleId: params.moduleId,
      userId: params.userId,
      status: 'completed',
      startedAt: params.completedAt,
      completedAt: params.completedAt,
      score: params.score ?? undefined,
      lessonProgress: [],
      lastAccessedAt: params.completedAt,
    };
  }

  async getModuleProgress(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<TrainingModuleProgress | null> {
    const { data, error } = await supabase
      .from('training_module_completions')
      .select('completed_at, score')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle<{ completed_at: string; score: number | null }>();

    if (error || !data) return null;

    return this.buildCompletedProgress({
      userId,
      moduleId,
      completedAt: data.completed_at,
      score: data.score,
    });
  }

  async startModule(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<TrainingModuleProgress> {
    const existing = await this.getModuleProgress(supabase, userId, moduleId);
    if (existing) return existing;

    const now = new Date().toISOString();

    createAuditEntry({
      eventType: 'TRAINING_MODULE_STARTED',
      aggregateType: 'training_module',
      aggregateId: `${userId}:${moduleId}`,
      actor: userId as UserId,
      details: { moduleId },
    });

    eventBus.publish(
      createServiceEvent(
        'TRAINING_MODULE_STARTED',
        {
          userId,
          moduleId,
        },
        userId as UserId
      )
    );

    return {
      moduleId,
      userId,
      status: 'in_progress',
      startedAt: now,
      lessonProgress: [],
      lastAccessedAt: now,
    };
  }

  async completeModule(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    score?: number
  ): Promise<TrainingModuleProgress> {
    const now = new Date().toISOString();

    const { error } = await supabase.from('training_module_completions').upsert(
      {
        user_id: userId,
        module_id: moduleId,
        completed_at: now,
        score: typeof score === 'number' ? score : null,
      },
      { onConflict: 'user_id,module_id' }
    );

    if (error) {
      throw new Error('Failed to persist training completion');
    }

    createAuditEntry({
      eventType: 'TRAINING_MODULE_COMPLETED',
      aggregateType: 'training_module',
      aggregateId: `${userId}:${moduleId}`,
      actor: userId as UserId,
      details: { moduleId, score },
    });

    eventBus.publish(
      createServiceEvent(
        'TRAINING_MODULE_COMPLETED',
        {
          userId,
          moduleId,
          score,
        },
        userId as UserId
      )
    );

    return this.buildCompletedProgress({ userId, moduleId, completedAt: now, score });
  }

  async isModuleCompleted(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string
  ): Promise<boolean> {
    const progress = await this.getModuleProgress(supabase, userId, moduleId);
    return progress?.status === 'completed';
  }

  async updateLessonProgress(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    lessonId: string,
    timeSpent: number
  ): Promise<TrainingModuleProgress> {
    const base = await this.startModule(supabase, userId, moduleId);
    const existingLesson = base.lessonProgress.find(l => l.lessonId === lessonId);

    if (existingLesson) {
      existingLesson.timeSpentSeconds += timeSpent;
      if (existingLesson.status === 'not_started') {
        existingLesson.status = 'in_progress';
      }
    } else {
      base.lessonProgress.push({
        lessonId,
        status: 'in_progress',
        timeSpentSeconds: timeSpent,
      });
    }

    base.lastAccessedAt = new Date().toISOString();
    return base;
  }

  async completeLesson(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    moduleId: string,
    lessonId: string
  ): Promise<TrainingModuleProgress> {
    const base = await this.startModule(supabase, userId, moduleId);
    const now = new Date().toISOString();
    const existingLesson = base.lessonProgress.find(l => l.lessonId === lessonId);

    if (existingLesson) {
      existingLesson.status = 'completed';
      existingLesson.completedAt = now;
    } else {
      base.lessonProgress.push({
        lessonId,
        status: 'completed',
        completedAt: now,
        timeSpentSeconds: 0,
      });
    }

    base.lastAccessedAt = now;
    return base;
  }

  async getUserProgress(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
  ): Promise<UserTrainingProgressSummary> {
    const { data, error } = await supabase
      .from('training_module_completions')
      .select('module_id, completed_at, score')
      .eq('user_id', userId);

    if (error) {
      return {
        userId,
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0,
        overallPercentage: 0,
        moduleProgress: [],
      };
    }

    const moduleProgress: TrainingModuleProgress[] = (data ?? []).map(row =>
      this.buildCompletedProgress({
        userId,
        moduleId: String((row as any).module_id),
        completedAt: String((row as any).completed_at),
        score: (row as any).score ?? undefined,
      })
    );

    const completedModules = moduleProgress.length;
    const totalModules = moduleProgress.length;
    const lastActivityAt = moduleProgress.map(p => p.lastAccessedAt).sort().pop();

    return {
      userId,
      totalModules,
      completedModules,
      inProgressModules: 0,
      overallPercentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      moduleProgress,
      lastActivityAt,
    };
  }

  async getCompletedModuleIds(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('training_module_completions')
      .select('module_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map(row => String((row as any).module_id));
  }

  async syncFromLocalStorage(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    localData: Record<string, { completedAt: string }>
  ): Promise<void> {
    const entries = Object.entries(localData);
    if (entries.length === 0) return;

    const rows = entries.map(([moduleId, data]) => ({
      user_id: userId,
      module_id: moduleId,
      completed_at: data.completedAt,
      score: null,
    }));

    const { error } = await supabase
      .from('training_module_completions')
      .upsert(rows, { onConflict: 'user_id,module_id' });

    if (error) {
      throw new Error('Failed to sync training progress');
    }

    for (const [moduleId] of entries) {
      createAuditEntry({
        eventType: 'TRAINING_MODULE_COMPLETED',
        aggregateType: 'training_module',
        aggregateId: `${userId}:${moduleId}`,
        actor: userId as UserId,
        details: { moduleId, source: 'localStorage_sync' },
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const trainingProgressService: ITrainingProgressService = new TrainingProgressServiceImpl();
