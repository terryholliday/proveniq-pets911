'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrainingModule, UserProgress, ContentSection } from '@/types/training';
import ReactMarkdown from 'react-markdown';

interface ModuleViewerProps {
  module: TrainingModule;
  progress: UserProgress | null;
  onSectionComplete: (sectionId: string) => Promise<void>;
  onContentComplete: () => Promise<void>;
  onStartQuiz: () => void;
}

export function ModuleViewer({
  module,
  progress,
  onSectionComplete,
  onContentComplete,
  onStartQuiz
}: ModuleViewerProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(progress?.contentSectionsCompleted || [])
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = module.contentJson.sections || [];
  const currentSection = sections[activeSection];
  const allSectionsComplete = sections.every(s => completedSections.has(s.id));
  const canTakeQuiz = allSectionsComplete && module.requiresQuiz;
  const isContentComplete = progress?.status === 'content_complete' || 
                           progress?.status === 'quiz_pending' ||
                           progress?.status === 'completed';

  // Calculate progress percentage
  const progressPct = sections.length > 0 
    ? Math.round((completedSections.size / sections.length) * 100)
    : 0;

  const handleMarkComplete = async () => {
    if (!currentSection || completedSections.has(currentSection.id)) return;
    
    setIsCompleting(true);
    try {
      await onSectionComplete(currentSection.id);
      setCompletedSections(prev => new Set([...prev, currentSection.id]));
      
      // Check if this was the last section
      const newCompleted = new Set([...completedSections, currentSection.id]);
      if (sections.every(s => newCompleted.has(s.id))) {
        await onContentComplete();
      }
      
      // Auto-advance to next section
      if (activeSection < sections.length - 1) {
        setActiveSection(prev => prev + 1);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Failed to mark section complete:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNavigate = (index: number) => {
    setActiveSection(index);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
              {module.subtitle && (
                <p className="text-sm text-gray-600">{module.subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-lg font-semibold text-gray-900">{progressPct}%</p>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-3">Contents</h3>
              <nav className="space-y-1">
                {sections.map((section, index) => {
                  const isComplete = completedSections.has(section.id);
                  const isActive = index === activeSection;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleNavigate(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        isComplete 
                          ? 'bg-green-500 text-white' 
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isComplete ? '✓' : index + 1}
                      </span>
                      <span className="text-sm truncate">{section.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Module Info */}
              <div className="mt-6 pt-4 border-t">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{module.estimatedMinutes} min</span>
                  </div>
                  {module.requiresQuiz && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{module.passingScore}% to pass</span>
                    </div>
                  )}
                  {module.requiresBackgroundCheck && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Background check required</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div 
              ref={contentRef}
              className="bg-white rounded-lg shadow-sm p-8 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {currentSection ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {currentSection.title}
                  </h2>
                  
                  {/* Video embed if present */}
                  {currentSection.videoUrl && (
                    <div className="mb-6 aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <iframe
                        src={currentSection.videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Image if present */}
                  {currentSection.imageUrl && (
                    <div className="mb-6">
                      <img 
                        src={currentSection.imageUrl} 
                        alt={currentSection.title}
                        className="rounded-lg max-w-full"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {currentSection.content}
                    </ReactMarkdown>
                  </div>

                  {/* Section completion */}
                  <div className="mt-8 pt-6 border-t flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNavigate(activeSection - 1)}
                        disabled={activeSection === 0}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {!completedSections.has(currentSection.id) ? (
                        <button
                          onClick={handleMarkComplete}
                          disabled={isCompleting}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isCompleting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              Mark as Complete
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          )}
                        </button>
                      ) : activeSection < sections.length - 1 ? (
                        <button
                          onClick={() => handleNavigate(activeSection + 1)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          Next Section
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : canTakeQuiz ? (
                        <button
                          onClick={onStartQuiz}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          Take Quiz
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No content available for this module.
                </div>
              )}
            </div>

            {/* Quiz CTA when content complete */}
            {allSectionsComplete && module.requiresQuiz && !isContentComplete && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Content Complete!</h3>
                    <p className="text-green-700">
                      You've completed all sections. Take the quiz to earn your certification.
                    </p>
                  </div>
                  <button
                    onClick={onStartQuiz}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModuleViewer;
