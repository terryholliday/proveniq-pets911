'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModuleViewer } from '@/components/training/ModuleViewer';
import { QuizEngine } from '@/components/training/QuizEngine';
import {
  BackgroundCheckGate,
  PrerequisiteGate,
  SignoffGate,
  ShadowingGate,
} from '@/components/training/SafetyGates';
import {
  TrainingModule,
  UserProgress,
  BackgroundCheck,
  QuizQuestionForAttempt,
  CompleteQuizResponse,
} from '@/types/training';

interface ModulePageData {
  module: TrainingModule;
  progress: UserProgress | null;
  backgroundCheck: BackgroundCheck | null;
  canAccess: boolean;
  accessReason?: string;
  unmetPrerequisites?: { id: string; slug: string; title: string }[];
  shadowingRecords?: {
    date: Date;
    hours: number;
    mentorName: string;
    verified: boolean;
  }[];
  signoffStatus?: 'pending' | 'needs_work' | 'denied' | null;
  signoffNotes?: string;
}

type ViewMode = 'loading' | 'blocked' | 'content' | 'quiz' | 'complete';

export default function TrainingModulePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [data, setData] = useState<ModulePageData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [quizData, setQuizData] = useState<{
    attemptId: string;
    questions: QuizQuestionForAttempt[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchModuleData();
    }
  }, [slug]);

  const fetchModuleData = async () => {
    try {
      const response = await fetch(`/api/training/module/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch module');
      }
      const moduleData: ModulePageData = await response.json();
      setData(moduleData);

      // Determine initial view mode
      if (!moduleData.canAccess) {
        setViewMode('blocked');
      } else if (moduleData.progress?.status === 'completed') {
        setViewMode('complete');
      } else {
        setViewMode('content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module');
      setViewMode('blocked');
    }
  };

  const handleSectionComplete = async (sectionId: string) => {
    if (!data?.module) return;

    const response = await fetch('/api/training/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete_section',
        moduleId: data.module.id,
        sectionId,
      }),
    });

    if (response.ok) {
      const { progress } = await response.json();
      setData(prev => prev ? { ...prev, progress } : null);
    }
  };

  const handleContentComplete = async () => {
    if (!data?.module) return;

    const response = await fetch('/api/training/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete_content',
        moduleId: data.module.id,
      }),
    });

    if (response.ok) {
      const { progress } = await response.json();
      setData(prev => prev ? { ...prev, progress } : null);
    }
  };

  const handleStartQuiz = async () => {
    if (!data?.module) return;

    try {
      const response = await fetch('/api/training/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          moduleId: data.module.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start quiz');
      }

      const quizResponse = await response.json();
      setQuizData({
        attemptId: quizResponse.attemptId,
        questions: quizResponse.questions,
      });
      setViewMode('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    }
  };

  const handleQuizComplete = async (result: CompleteQuizResponse) => {
    // Refresh module data
    await fetchModuleData();
    
    if (result.passed) {
      if (result.newStatus === 'completed') {
        setViewMode('complete');
      } else {
        // Needs signoff or shadowing
        setViewMode('content');
      }
    } else {
      // Failed - back to content
      setViewMode('content');
    }
    
    setQuizData(null);
  };

  const handleQuizExit = () => {
    setQuizData(null);
    setViewMode('content');
  };

  const handleRequestSignoff = async () => {
    if (!data?.module) return;

    await fetch('/api/training/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_signoff',
        moduleId: data.module.id,
      }),
    });

    await fetchModuleData();
  };

  const handleLogShadowing = () => {
    // Open shadowing log modal - could be implemented as a separate component
    router.push(`/admin/training/${slug}/log-shadowing`);
  };

  // Loading state
  if (viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Module</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/training')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Training
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Blocked state - show gates
  if (viewMode === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Module Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/training')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
            >
              ← Back to Training
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{data.module.title}</h1>
            {data.module.subtitle && (
              <p className="text-gray-600 mt-1">{data.module.subtitle}</p>
            )}
          </div>

          {/* Show appropriate gate */}
          <div className="space-y-6">
            {data.unmetPrerequisites && data.unmetPrerequisites.length > 0 && (
              <PrerequisiteGate
                unmetPrerequisites={data.unmetPrerequisites}
                targetModule={data.module.title}
              />
            )}

            {data.accessReason === 'Background check required' && (
              <BackgroundCheckGate
                check={data.backgroundCheck}
                requiredFor={data.module.title}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz mode
  if (viewMode === 'quiz' && quizData) {
    return (
      <QuizEngine
        moduleId={data.module.id}
        moduleTitle={data.module.title}
        attemptId={quizData.attemptId}
        questions={quizData.questions}
        passingScore={data.module.passingScore}
        onComplete={handleQuizComplete}
        onExit={handleQuizExit}
      />
    );
  }

  // Content mode
  if (viewMode === 'content') {
    // Check for post-quiz gates
    const needsSignoff = data.progress?.status === 'awaiting_signoff' || 
                        (data.module.requiresSupervisorSignoff && data.progress?.quizPassedAt);
    const needsShadowing = data.progress?.status === 'awaiting_shadowing' ||
                          (data.module.requiresShadowing && data.progress?.quizPassedAt);

    return (
      <div>
        {/* Show gates if quiz passed but additional requirements needed */}
        {needsSignoff && (
          <div className="bg-purple-50 border-b border-purple-200">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <SignoffGate
                moduleTitle={data.module.title}
                signoffStatus={data.signoffStatus || null}
                supervisorNotes={data.signoffNotes}
                onRequestSignoff={handleRequestSignoff}
              />
            </div>
          </div>
        )}

        {needsShadowing && (
          <div className="bg-indigo-50 border-b border-indigo-200">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <ShadowingGate
                moduleTitle={data.module.title}
                requiredHours={data.module.shadowingHoursRequired}
                completedHours={data.shadowingRecords?.reduce((sum, r) => sum + r.hours, 0) || 0}
                records={data.shadowingRecords || []}
                onLogHours={handleLogShadowing}
              />
            </div>
          </div>
        )}

        <ModuleViewer
          module={data.module}
          progress={data.progress}
          onSectionComplete={handleSectionComplete}
          onContentComplete={handleContentComplete}
          onStartQuiz={handleStartQuiz}
        />
      </div>
    );
  }

  // Complete mode
  if (viewMode === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push('/admin/training')}
            className="text-blue-600 hover:text-blue-800 mb-8 flex items-center gap-1"
          >
            ← Back to Training
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-green-500 px-6 py-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏆</span>
              </div>
              <h1 className="text-2xl font-bold">Module Complete!</h1>
              <p className="mt-2 opacity-90">{data.module.title}</p>
            </div>

            <div className="p-6">
              {data.progress?.completedAt && (
                <p className="text-center text-gray-600 mb-6">
                  Completed on {new Date(data.progress.completedAt).toLocaleDateString()}
                </p>
              )}

              {data.progress?.bestQuizScore && (
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-gray-900">
                    {data.progress.bestQuizScore}%
                  </p>
                  <p className="text-gray-500">Final Score</p>
                </div>
              )}

              {data.progress?.certificateId && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Certificate</h3>
                  <a
                    href={`/api/training/certificate/${data.progress.certificateId}/download`}
                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download Certificate (PDF)
                  </a>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setViewMode('content')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Review Content
                </button>
                <button
                  onClick={() => router.push('/admin/training')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Continue Training
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
