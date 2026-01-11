'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { TRAINING_MODULES_PART2 } from '@/modules/operations/training/modules';
import { clearTrainingProgress, getTrainingProgressStore } from '@/lib/training/local-progress';

export default function HelperTrainingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const run = async () => {
      setError(null);

      try {
        const local = getTrainingProgressStore();
        if (Object.keys(local.modules).length > 0) {
          await fetch('/api/training/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync', localData: local.modules }),
          });
          clearTrainingProgress();
        }

        const res = await fetch('/api/training/progress', { method: 'GET' });
        const data = (await res.json()) as any;

        if (!res.ok) {
          throw new Error(data?.error ?? 'Failed to load training progress');
        }

        const completed = new Set<string>(
          (data?.summary?.moduleProgress ?? [])
            .filter((p: any) => p?.status === 'completed')
            .map((p: any) => String(p?.moduleId))
        );

        if (!cancelled) {
          setCompletedModuleIds(completed);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load training progress');
        }
      } finally {
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  const modules = useMemo(() => {
    const values = Object.values(TRAINING_MODULES_PART2);
    return values.sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  const completedCount = useMemo(() => {
    return modules.filter(m => completedModuleIds.has(String(m.id))).length;
  }, [modules, completedModuleIds]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto pt-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/helpers/dashboard"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Training</h1>
            <p className="text-slate-300">
              Complete required modules to unlock higher-responsibility roles and safer field work.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Progress</p>
            <p className="text-2xl font-bold text-white">
              {completedCount}/{modules.length}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(module => {
            const completed = completedModuleIds.has(String(module.id));
            return (
              <Card key={String(module.id)} className={completed ? 'border-green-600/50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {module.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{module.code} • {module.category}</p>
                    </div>
                    {completed ? (
                      <Badge variant="success" className="shrink-0">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="shrink-0">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-slate-700 mb-4">{module.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Lessons: {module.lessons.length}</p>
                    <Button
                      size="sm"
                      variant={completed ? 'outline' : 'default'}
                      onClick={() => {
                        setError(null);
                        router.push(`/helpers/training/${module.id}`);
                      }}
                    >
                      {completed ? 'Review' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={() => setTick(t => t + 1)}>
            Refresh Progress
          </Button>
        </div>
      </div>
    </div>
  );
}
