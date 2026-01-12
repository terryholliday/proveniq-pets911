// Pet911 Quiz API Routes
// POST /api/training/quiz/start - Start a new quiz
// POST /api/training/quiz/answer - Submit an answer
// POST /api/training/quiz/complete - Complete the quiz

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { quizService } from '@/lib/training/quiz-service';

// Start Quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, moduleId, attemptId, questionId, selectedOptions, sequenceAnswer, timeSpentSeconds } = body;

    switch (action) {
      case 'start': {
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
        }

        // Check for active cooldown
        const { data: cooldown } = await supabase
          .from('volunteer_cooldown_events')
          .select('*')
          .eq('user_id', user.id)
          .gt('ends_at', new Date().toISOString())
          .is('overridden_by', null)
          .single();

        if (cooldown) {
          return NextResponse.json({
            error: 'You are currently in a cooldown period',
            cooldown: {
              endsAt: cooldown.ends_at,
              reason: cooldown.trigger_reason,
            }
          }, { status: 403 });
        }

        // Check prerequisites
        const { data: prerequisitesMet } = await supabase
          .rpc('check_prerequisites_met', {
            p_user_id: user.id,
            p_module_id: moduleId,
          });

        if (!prerequisitesMet) {
          return NextResponse.json({
            error: 'Prerequisites not met for this module'
          }, { status: 403 });
        }

        // Check background check requirement
        const { data: module } = await supabase
          .from('training_modules')
          .select('requires_background_check')
          .eq('id', moduleId)
          .single();

        if (module?.requires_background_check) {
          const { data: bgCheckCleared } = await supabase
            .rpc('has_cleared_background_check', { p_user_id: user.id });

          if (!bgCheckCleared) {
            return NextResponse.json({
              error: 'Background check required before taking this quiz'
            }, { status: 403 });
          }
        }

        const result = await quizService.startQuiz(user.id, moduleId);
        return NextResponse.json(result);
      }

      case 'answer': {
        if (!attemptId || !questionId || !selectedOptions) {
          return NextResponse.json({ 
            error: 'attemptId, questionId, and selectedOptions required' 
          }, { status: 400 });
        }

        const result = await quizService.submitAnswer(
          user.id,
          attemptId,
          questionId,
          selectedOptions,
          sequenceAnswer,
          timeSpentSeconds
        );
        return NextResponse.json(result);
      }

      case 'complete': {
        if (!attemptId) {
          return NextResponse.json({ error: 'attemptId required' }, { status: 400 });
        }

        const result = await quizService.completeQuiz(user.id, attemptId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
