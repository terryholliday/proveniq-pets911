// PetMayday Quiz Engine Service
// Handles quiz attempt management, scoring, and progression

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  TrainingQuestion,
  QuestionOption,
  QuizAttempt,
  QuizAnswer,
  QuizQuestionForAttempt,
  StartQuizResponse,
  SubmitAnswerResponse,
  CompleteQuizResponse,
  ProgressStatus,
} from '@/types/training';

// Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class QuizService {
  
  /**
   * Start a new quiz attempt for a user
   */
  async startQuiz(userId: string, moduleId: string): Promise<StartQuizResponse> {
    // 1. Get module info
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      throw new Error('Module not found');
    }

    // 2. Check user progress
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    // 3. Validate can take quiz
    if (progress) {
      // Check if locked due to failed attempts
      if (progress.quiz_locked_until && new Date(progress.quiz_locked_until) > new Date()) {
        throw new Error(`Quiz locked until ${progress.quiz_locked_until}`);
      }

      // Check max attempts
      if (module.max_attempts && progress.quiz_attempts >= module.max_attempts) {
        throw new Error('Maximum quiz attempts reached');
      }

      // Check if already passed
      if (progress.status === 'completed') {
        throw new Error('Module already completed');
      }
    }

    // 4. Get random questions
    const questions = await this.getRandomQuestions(
      moduleId, 
      module.quiz_question_count || 10
    );

    if (questions.length === 0) {
      throw new Error('No questions available for this module');
    }

    // 5. Create quiz attempt
    const attemptNumber = (progress?.quiz_attempts || 0) + 1;
    const questionOrder = questions.map(q => q.id);

    const { data: attempt, error: attemptError } = await supabase
      .from('training_quiz_attempts')
      .insert({
        user_id: userId,
        module_id: moduleId,
        progress_id: progress?.id,
        attempt_number: attemptNumber,
        score: 0,
        score_pct: 0,
        passed: false,
        questions_total: questions.length,
        questions_correct: 0,
        question_order: questionOrder,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      throw new Error('Failed to create quiz attempt');
    }

    // 6. Update progress
    await supabase
      .from('training_user_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        status: 'quiz_pending',
        quiz_attempts: attemptNumber,
        last_quiz_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,module_id'
      });

    // 7. Format questions for client (remove correct answers)
    const questionsForAttempt: QuizQuestionForAttempt[] = questions.map(q => ({
      id: q.id,
      questionType: q.questionType,
      questionText: q.questionText,
      scenarioContext: q.scenarioContext,
      options: q.options?.map(o => ({
        id: o.id,
        optionText: o.optionText,
        sortOrder: o.sortOrder,
      })) || [],
      points: q.points,
      isCritical: q.isCritical,
    }));

    return {
      attemptId: attempt.id,
      attemptNumber,
      questions: questionsForAttempt,
    };
  }

  /**
   * Submit an answer for a question
   */
  async submitAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    selectedOptions: string[],
    sequenceAnswer?: string[],
    timeSpentSeconds?: number
  ): Promise<SubmitAnswerResponse> {
    // 1. Verify attempt belongs to user and is active
    const { data: attempt, error: attemptError } = await supabase
      .from('training_quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .is('completed_at', null)
      .single();

    if (attemptError || !attempt) {
      throw new Error('Invalid or completed quiz attempt');
    }

    // 2. Get question with correct answers
    const { data: question, error: questionError } = await supabase
      .from('training_questions')
      .select(`
        *,
        options:training_question_options(*)
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      throw new Error('Question not found');
    }

    // 3. Score the answer
    const { isCorrect, pointsEarned, feedback } = this.scoreAnswer(
      question,
      selectedOptions,
      sequenceAnswer
    );

    // 4. Get correct options for response
    const correctOptions = question.options
      .filter((o: QuestionOption) => o.isCorrect)
      .map((o: QuestionOption) => o.id);

    // 5. Save answer
    const { error: answerError } = await supabase
      .from('training_quiz_answers')
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_options: selectedOptions,
        sequence_answer: sequenceAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        points_possible: question.points,
        time_spent_seconds: timeSpentSeconds,
      });

    if (answerError) {
      throw new Error('Failed to save answer');
    }

    return {
      isCorrect,
      pointsEarned,
      explanation: question.explanation,
      correctOptions,
      feedback,
    };
  }

  /**
   * Complete a quiz attempt and calculate final results
   */
  async completeQuiz(userId: string, attemptId: string): Promise<CompleteQuizResponse> {
    // 1. Get attempt with all answers
    const { data: attempt, error: attemptError } = await supabase
      .from('training_quiz_attempts')
      .select(`
        *,
        answers:training_quiz_answers(*)
      `)
      .eq('id', attemptId)
      .eq('user_id', userId)
      .is('completed_at', null)
      .single();

    if (attemptError || !attempt) {
      throw new Error('Invalid or already completed quiz attempt');
    }

    // 2. Get module for passing score
    const { data: module } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', attempt.module_id)
      .single();

    if (!module) {
      throw new Error('Module not found');
    }

    // 3. Get questions to check for critical questions
    const { data: questions } = await supabase
      .from('training_questions')
      .select('id, is_critical')
      .in('id', attempt.question_order);

    const criticalQuestionIds = new Set(
      questions?.filter(q => q.is_critical).map(q => q.id) || []
    );

    // 4. Calculate results
    const answers = attempt.answers || [];
    const totalPoints = answers.reduce((sum: number, a: any) => sum + a.points_possible, 0);
    const earnedPoints = answers.reduce((sum: number, a: any) => sum + a.points_earned, 0);
    const questionsCorrect = answers.filter((a: any) => a.is_correct).length;
    
    const scorePct = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    
    // Check critical questions
    const criticalTotal = answers.filter((a: any) => criticalQuestionIds.has(a.question_id)).length;
    const criticalCorrect = answers.filter(
      (a: any) => criticalQuestionIds.has(a.question_id) && a.is_correct
    ).length;
    const failedCritical = criticalCorrect < criticalTotal;

    // Determine if passed (must meet score AND all critical questions)
    const passed = scorePct >= module.passing_score && !failedCritical;

    // 5. Update attempt
    const timeSpent = Math.floor(
      (Date.now() - new Date(attempt.started_at).getTime()) / 1000
    );

    await supabase
      .from('training_quiz_attempts')
      .update({
        score: earnedPoints,
        score_pct: scorePct,
        passed,
        questions_correct: questionsCorrect,
        critical_questions_total: criticalTotal,
        critical_questions_correct: criticalCorrect,
        failed_critical: failedCritical,
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
      })
      .eq('id', attemptId);

    // 6. Update user progress
    let newStatus: ProgressStatus;
    let certificateId: string | undefined;
    const nextSteps: string[] = [];

    if (passed) {
      // Check if additional requirements exist
      if (module.requires_supervisor_signoff) {
        newStatus = 'awaiting_signoff';
        nextSteps.push('Request supervisor signoff to complete certification');
      } else if (module.requires_shadowing) {
        newStatus = 'awaiting_shadowing';
        nextSteps.push(`Complete ${module.shadowing_hours_required} hours of shadowing`);
      } else {
        // Fully complete - issue certificate
        newStatus = 'completed';
        certificateId = await this.issueCertificate(userId, module);
        nextSteps.push('🎉 Congratulations! Your certification has been issued.');
        nextSteps.push('You can now access new features and responsibilities.');
      }
    } else {
      newStatus = 'quiz_failed';
      
      if (failedCritical) {
        nextSteps.push('Review the safety content - critical questions must be answered correctly.');
      }
      
      const attemptsRemaining = module.max_attempts 
        ? module.max_attempts - attempt.attempt_number 
        : 'unlimited';
      
      if (attemptsRemaining === 0) {
        nextSteps.push('You have used all quiz attempts. Contact support for assistance.');
      } else {
        nextSteps.push(`You have ${attemptsRemaining} attempt(s) remaining.`);
        nextSteps.push('Review the module content and try again.');
      }
    }

    // Update progress record
    const progressUpdate: any = {
      status: newStatus,
      last_quiz_score: Math.round(scorePct),
      last_quiz_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (passed) {
      progressUpdate.quiz_passed_at = new Date().toISOString();
      progressUpdate.best_quiz_score = Math.round(scorePct);
    }

    if (newStatus === 'completed') {
      progressUpdate.completed_at = new Date().toISOString();
      progressUpdate.certificate_id = certificateId;
      
      // Set expiration if applicable
      if (module.certification_valid_days) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + module.certification_valid_days);
        progressUpdate.expires_at = expiresAt.toISOString();
      }
    }

    // Lock quiz after max attempts
    if (!passed && module.max_attempts && attempt.attempt_number >= module.max_attempts) {
      // Optional: implement retry lockout period
      // progressUpdate.quiz_locked_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase
      .from('training_user_progress')
      .update(progressUpdate)
      .eq('user_id', userId)
      .eq('module_id', attempt.module_id);

    return {
      score: earnedPoints,
      scorePct: Math.round(scorePct),
      passed,
      questionsTotal: answers.length,
      questionsCorrect,
      failedCritical,
      newStatus,
      certificateId,
      nextSteps,
    };
  }

  /**
   * Get random questions for a quiz
   */
  private async getRandomQuestions(
    moduleId: string, 
    count: number
  ): Promise<(TrainingQuestion & { options: QuestionOption[] })[]> {
    // Get all active questions for the module
    const { data: questions, error } = await supabase
      .from('training_questions')
      .select(`
        *,
        options:training_question_options(*)
      `)
      .eq('module_id', moduleId)
      .eq('is_active', true);

    if (error || !questions) {
      return [];
    }

    // Shuffle and take required count
    const shuffled = this.shuffleArray([...questions]);
    const selected = shuffled.slice(0, count);

    // Shuffle options within each question (except for sequencing)
    return selected.map(q => ({
      ...q,
      options: q.questionType === 'sequencing' 
        ? q.options.sort((a: QuestionOption, b: QuestionOption) => a.sortOrder - b.sortOrder)
        : this.shuffleArray([...q.options]),
    }));
  }

  /**
   * Score an answer
   */
  private scoreAnswer(
    question: TrainingQuestion & { options: QuestionOption[] },
    selectedOptions: string[],
    sequenceAnswer?: string[]
  ): { isCorrect: boolean; pointsEarned: number; feedback?: string } {
    const { questionType, options, points } = question;

    switch (questionType) {
      case 'multiple_choice':
      case 'true_false':
      case 'scenario': {
        const correctOption = options.find(o => o.isCorrect);
        const isCorrect = selectedOptions.length === 1 && 
                         selectedOptions[0] === correctOption?.id;
        
        // Get feedback from selected option
        const selectedOption = options.find(o => o.id === selectedOptions[0]);
        
        return {
          isCorrect,
          pointsEarned: isCorrect ? points : 0,
          feedback: selectedOption?.feedback,
        };
      }

      case 'multi_select': {
        const correctIds = new Set(options.filter(o => o.isCorrect).map(o => o.id));
        const selectedSet = new Set(selectedOptions);
        
        // Check for exact match
        const isExactMatch = 
          correctIds.size === selectedSet.size &&
          [...correctIds].every(id => selectedSet.has(id));
        
        if (isExactMatch) {
          return { isCorrect: true, pointsEarned: points };
        }

        // Partial credit calculation
        const correctSelected = selectedOptions.filter(id => correctIds.has(id)).length;
        const wrongSelected = selectedOptions.filter(id => !correctIds.has(id)).length;
        const partialScore = Math.max(0, (correctSelected - wrongSelected) / correctIds.size);
        
        return {
          isCorrect: false,
          pointsEarned: Math.round(points * partialScore * 100) / 100,
        };
      }

      case 'sequencing': {
        if (!sequenceAnswer) {
          return { isCorrect: false, pointsEarned: 0 };
        }

        const correctSequence = options
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(o => o.id);

        const isCorrect = 
          sequenceAnswer.length === correctSequence.length &&
          sequenceAnswer.every((id, i) => id === correctSequence[i]);

        // Partial credit for partially correct sequences
        if (!isCorrect) {
          let correctPositions = 0;
          for (let i = 0; i < Math.min(sequenceAnswer.length, correctSequence.length); i++) {
            if (sequenceAnswer[i] === correctSequence[i]) {
              correctPositions++;
            }
          }
          const partialScore = correctPositions / correctSequence.length;
          return {
            isCorrect: false,
            pointsEarned: Math.round(points * partialScore * 100) / 100,
          };
        }

        return { isCorrect: true, pointsEarned: points };
      }

      default:
        return { isCorrect: false, pointsEarned: 0 };
    }
  }

  /**
   * Issue a certificate
   */
  private async issueCertificate(userId: string, module: any): Promise<string> {
    // Generate certificate number
    const { data: certNumber } = await supabase
      .rpc('generate_certificate_number', {
        p_module_slug: module.slug,
        p_track: module.track,
      });

    // Generate verification hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${userId}-${module.id}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32);

    // Calculate expiration
    const expiresAt = module.certification_valid_days
      ? new Date(Date.now() + module.certification_valid_days * 24 * 60 * 60 * 1000)
      : null;

    // Get user's quiz score
    const { data: progress } = await supabase
      .from('training_user_progress')
      .select('best_quiz_score')
      .eq('user_id', userId)
      .eq('module_id', module.id)
      .single();

    // Create certificate record
    const { data: cert, error } = await supabase
      .from('volunteer_certifications')
      .insert({
        user_id: userId,
        module_id: module.id,
        certificate_number: certNumber || `P911-${Date.now()}`,
        title: module.title,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt?.toISOString(),
        status: 'active',
        verification_hash: verificationHash,
        final_score: progress?.best_quiz_score,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to issue certificate');
    }

    return cert.id;
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const quizService = new QuizService();
