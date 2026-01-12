'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  QuizQuestionForAttempt, 
  QuestionType,
  SubmitAnswerResponse,
  CompleteQuizResponse 
} from '@/types/training';

interface QuizEngineProps {
  moduleId: string;
  moduleTitle: string;
  attemptId: string;
  questions: QuizQuestionForAttempt[];
  passingScore: number;
  onComplete: (result: CompleteQuizResponse) => void;
  onExit: () => void;
}

interface AnswerState {
  questionId: string;
  selectedOptions: string[];
  sequenceAnswer?: string[];
  submitted: boolean;
  result?: SubmitAnswerResponse;
}

export function QuizEngine({
  moduleId,
  moduleTitle,
  attemptId,
  questions,
  passingScore,
  onComplete,
  onExit
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerState>>(new Map());
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sequenceAnswer, setSequenceAnswer] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [finalResult, setFinalResult] = useState<CompleteQuizResponse | null>(null);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Initialize sequence answer for sequencing questions
  useEffect(() => {
    if (currentQuestion?.questionType === 'sequencing') {
      const shuffled = [...currentQuestion.options]
        .sort(() => Math.random() - 0.5)
        .map(o => o.id);
      setSequenceAnswer(shuffled);
    } else {
      setSequenceAnswer([]);
    }
    setSelectedOptions([]);
    setShowResult(false);
    setQuestionStartTime(Date.now());
  }, [currentIndex, currentQuestion]);

  const handleOptionSelect = (optionId: string) => {
    if (showResult) return;

    if (currentQuestion.questionType === 'multiple_choice' || 
        currentQuestion.questionType === 'true_false' ||
        currentQuestion.questionType === 'scenario') {
      setSelectedOptions([optionId]);
    } else if (currentQuestion.questionType === 'multi_select') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSequenceMove = (fromIndex: number, toIndex: number) => {
    if (showResult) return;
    const newSequence = [...sequenceAnswer];
    const [removed] = newSequence.splice(fromIndex, 1);
    newSequence.splice(toIndex, 0, removed);
    setSequenceAnswer(newSequence);
  };

  const handleSubmitAnswer = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      const response = await fetch('/api/training/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: currentQuestion.id,
          selectedOptions: currentQuestion.questionType === 'sequencing' ? [] : selectedOptions,
          sequenceAnswer: currentQuestion.questionType === 'sequencing' ? sequenceAnswer : undefined,
          timeSpentSeconds: timeSpent
        })
      });

      const result: SubmitAnswerResponse = await response.json();

      setAnswers(prev => new Map(prev).set(currentQuestion.id, {
        questionId: currentQuestion.id,
        selectedOptions,
        sequenceAnswer: currentQuestion.questionType === 'sequencing' ? sequenceAnswer : undefined,
        submitted: true,
        result
      }));

      setShowResult(true);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/training/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
      });

      const result: CompleteQuizResponse = await response.json();
      setFinalResult(result);
      setQuizComplete(true);
      onComplete(result);
    } catch (error) {
      console.error('Failed to complete quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAnswer = answers.get(currentQuestion?.id);
  const canSubmit = currentQuestion?.questionType === 'sequencing' 
    ? sequenceAnswer.length > 0 
    : selectedOptions.length > 0;

  if (quizComplete && finalResult) {
    return (
      <QuizResults 
        result={finalResult} 
        moduleTitle={moduleTitle}
        passingScore={passingScore}
        onClose={onExit}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{moduleTitle} - Quiz</h2>
          <button 
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700"
          >
            Exit Quiz
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Critical question badge */}
        {currentQuestion.isCritical && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Critical Safety Question</span>
          </div>
        )}

        {/* Scenario context */}
        {currentQuestion.scenarioContext && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
            <p className="text-sm font-medium text-amber-800 mb-1">Scenario:</p>
            <p className="text-gray-700">{currentQuestion.scenarioContext}</p>
          </div>
        )}

        {/* Question text */}
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {currentQuestion.questionText}
        </h3>

        {/* Question type indicator */}
        <p className="text-sm text-gray-500 mb-4">
          {currentQuestion.questionType === 'multi_select' && 'Select all that apply'}
          {currentQuestion.questionType === 'sequencing' && 'Drag to reorder (or use arrows)'}
          {currentQuestion.questionType === 'true_false' && 'True or False'}
          {(currentQuestion.questionType === 'multiple_choice' || currentQuestion.questionType === 'scenario') && 'Select one answer'}
        </p>

        {/* Options */}
        {currentQuestion.questionType === 'sequencing' ? (
          <SequencingOptions
            options={currentQuestion.options}
            sequence={sequenceAnswer}
            onMove={handleSequenceMove}
            disabled={showResult}
            correctSequence={showResult ? currentAnswer?.result?.correctOptions : undefined}
          />
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              const isCorrect = showResult && currentAnswer?.result?.correctOptions?.includes(option.id);
              const isWrong = showResult && isSelected && !isCorrect;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showResult
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isWrong
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      showResult
                        ? isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : isWrong
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-gray-300'
                        : isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {showResult && isCorrect && '✓'}
                      {showResult && isWrong && '✗'}
                      {!showResult && isSelected && '✓'}
                    </div>
                    <span className="text-gray-900">{option.optionText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Result feedback */}
        {showResult && currentAnswer?.result && (
          <div className={`mt-6 p-4 rounded-lg ${
            currentAnswer.result.isCorrect ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {currentAnswer.result.isCorrect ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-800">Correct!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-red-800">Incorrect</span>
                </>
              )}
              <span className="text-gray-600">
                (+{currentAnswer.result.pointsEarned} points)
              </span>
            </div>
            {currentAnswer.result.explanation && (
              <p className="text-gray-700 mt-2">{currentAnswer.result.explanation}</p>
            )}
            {currentAnswer.result.feedback && (
              <p className="text-gray-600 mt-2 italic">{currentAnswer.result.feedback}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          ← Previous
        </button>

        {!showResult ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!canSubmit || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentIndex < questions.length - 1 ? 'Next Question →' : 'Complete Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}

// Sequencing question component
function SequencingOptions({
  options,
  sequence,
  onMove,
  disabled,
  correctSequence
}: {
  options: { id: string; optionText: string }[];
  sequence: string[];
  onMove: (from: number, to: number) => void;
  disabled: boolean;
  correctSequence?: string[];
}) {
  const optionMap = new Map(options.map(o => [o.id, o]));

  return (
    <div className="space-y-2">
      {sequence.map((optionId, index) => {
        const option = optionMap.get(optionId);
        const isCorrectPosition = correctSequence && correctSequence[index] === optionId;
        
        return (
          <div
            key={optionId}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
              disabled
                ? isCorrectPosition
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
              {index + 1}
            </span>
            <span className="flex-1">{option?.optionText}</span>
            {!disabled && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === sequence.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Quiz results component
function QuizResults({
  result,
  moduleTitle,
  passingScore,
  onClose
}: {
  result: CompleteQuizResponse;
  moduleTitle: string;
  passingScore: number;
  onClose: () => void;
}) {
  const passed = result.passed;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className={`rounded-lg p-8 text-center ${
        passed ? 'bg-green-50' : 'bg-red-50'
      }`}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          passed ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-800' : 'text-red-800'}`}>
          {passed ? 'Congratulations!' : 'Not Quite There'}
        </h2>

        <p className="text-gray-600 mb-6">
          {passed 
            ? `You passed the ${moduleTitle} quiz!`
            : `You need ${passingScore}% to pass. Keep studying and try again.`
          }
        </p>

        {/* Score display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl font-bold text-gray-900">{result.scorePct.toFixed(0)}%</p>
            <p className="text-sm text-gray-500">Score</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl font-bold text-gray-900">{result.questionsCorrect}/{result.questionsTotal}</p>
            <p className="text-sm text-gray-500">Correct</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl font-bold text-gray-900">{passingScore}%</p>
            <p className="text-sm text-gray-500">Required</p>
          </div>
        </div>

        {/* Critical question warning */}
        {result.failedCritical && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Critical Safety Questions Missed
            </div>
            <p className="text-sm text-red-700">
              You missed one or more critical safety questions. These must be answered correctly to pass, 
              regardless of overall score. Please review the safety content carefully.
            </p>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-white rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
          <ul className="space-y-2">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600">
                <span className="text-blue-500">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {passed ? 'Continue' : 'Return to Module'}
        </button>
      </div>
    </div>
  );
}

export default QuizEngine;
