'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, PlayCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { TRAINING_MODULES_PART2 } from '@/modules/operations/training/modules';
import { isModuleCompleted, markModuleCompleted } from '@/lib/training/local-progress';

function getContentIcon(type: string) {
  switch (type) {
    case 'VIDEO':
      return <PlayCircle className="h-4 w-4 text-blue-600" />;
    case 'READING':
      return <FileText className="h-4 w-4 text-amber-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
  }
}

export default function HelperTrainingModulePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [completedTick, setCompletedTick] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  const moduleId = String(params.moduleId);

  const module = useMemo(() => {
    return (TRAINING_MODULES_PART2 as Record<string, any>)[moduleId] ?? null;
  }, [moduleId]);

  const completed = useMemo(() => {
    return isModuleCompleted(moduleId);
  }, [moduleId, completedTick]);

  if (!user) return null;

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-3xl mx-auto pt-12">
          <Alert variant="destructive">
            <AlertDescription>Training module not found.</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/helpers/training" className="text-slate-300 hover:text-white inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Training
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto pt-8 pb-20">
        <div className="mb-6">
          <Link href="/helpers/training" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Training
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">{module.code} • {module.category} • {module.difficulty}</p>
              </div>
              {completed ? (
                <Badge variant="success" className="shrink-0">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="warning" className="shrink-0">
                  <Clock className="h-4 w-4 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line">{module.fullDescription}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">Lessons: {module.lessons.length}</div>
              <Button
                onClick={() => {
                  try {
                    setError(null);
                    markModuleCompleted(moduleId);
                    setCompletedTick(t => t + 1);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to mark completed');
                  }
                }}
                variant={completed ? 'outline' : 'default'}
              >
                {completed ? 'Completed' : 'Mark Completed'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {module.lessons.map((lesson: any) => (
            <Card key={String(lesson.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{lesson.orderIndex}. {lesson.title}</CardTitle>
                <p className="text-sm text-slate-600">{lesson.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {(lesson.content || []).map((item: any) => (
                    <div key={String(item.id)} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5">{getContentIcon(item.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                      <div className="text-xs text-slate-500">{item.durationMinutes}m</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.push('/helpers/training')}>
            Back
          </Button>
          <Button onClick={() => router.push('/helpers/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
