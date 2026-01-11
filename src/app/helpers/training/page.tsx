'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { TRAINING_MODULES } from '@/modules/operations/training/modules';
import { TRAINING_PATHS } from '@/modules/operations/training/types';
import type { RoleId } from '@/lib/roles/role-hierarchy';
import type { VolunteerProfile } from '@/lib/types/volunteer';
import { clearTrainingProgress, getTrainingProgressStore } from '@/lib/training/local-progress';

export default function HelperTrainingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);

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
        const profileRes = await fetch(`/api/volunteers/profile?user_id=${encodeURIComponent(user.id)}`);
        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as any;
          setProfile(profileData?.data ?? null);
        } else {
          setProfile(null);
        }

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

  const roleIds: RoleId[] = useMemo(() => {
    const caps = profile?.capabilities ?? [];
    const out = new Set<RoleId>();

    if (caps.includes('MODERATOR')) out.add('moderator');

    if (caps.includes('TRANSPORT') || caps.includes('VET_TRANSPORT') || caps.includes('SHELTER_TRANSPORT')) {
      out.add('transporter');
    }

    if (caps.includes('FOSTER_SHORT_TERM') || caps.includes('FOSTER_LONG_TERM')) {
      out.add('foster');
    }

    if (caps.includes('EMERGENCY_RESPONSE')) {
      out.add('community_volunteer');
    }

    return Array.from(out);
  }, [profile?.capabilities]);

  const modules = useMemo(() => {
    const all = TRAINING_MODULES as Record<string, any>;

    const moduleIds: string[] = [];
    const seen = new Set<string>();

    const add = (id: string) => {
      if (seen.has(id)) return;
      if (!all[id]) return;
      seen.add(id);
      moduleIds.push(id);
    };

    const hasProfile = Boolean(profile && Array.isArray(profile.capabilities) && profile.capabilities.length > 0);

    if (hasProfile && roleIds.length > 0) {
      for (const roleId of roleIds) {
        const path = (TRAINING_PATHS as any)[roleId];
        const required = (path?.requiredModules ?? []) as string[];
        for (const id of required) add(id);
      }
    } else {
      for (const id of Object.keys(all)) add(id);
    }

    const values = moduleIds.map((id) => all[id]);

    return values.sort((a, b) => {
      const aIsOrientation = a.code === 'VOL-101';
      const bIsOrientation = b.code === 'VOL-101';
      if (aIsOrientation && !bIsOrientation) return -1;
      if (!aIsOrientation && bIsOrientation) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [profile, roleIds]);

  const completedCount = useMemo(() => {
    return modules.filter(m => completedModuleIds.has(String(m.id))).length;
  }, [modules, completedModuleIds]);

  const orientationModule = useMemo(() => {
    return modules.find(m => m.code === 'VOL-101') ?? null;
  }, [modules]);

  const orientationCompleted = useMemo(() => {
    if (!orientationModule) return false;
    return completedModuleIds.has(String(orientationModule.id));
  }, [completedModuleIds, orientationModule]);

  const progressPct = useMemo(() => {
    return modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  }, [completedCount, modules.length]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto pt-8 pb-20">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-6">
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
                Complete your onboarding, then unlock role-specific modules.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Progress</p>
              <p className="text-2xl font-bold text-white">
                {completedCount}/{modules.length}
              </p>
              <p className="text-xs text-slate-400">{progressPct}%</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
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
            const isOrientation = module.code === 'VOL-101';
            const locked = !isOrientation && !orientationCompleted;

            return (
              <Card
                key={String(module.id)}
                className={
                  completed
                    ? 'border-green-600/50'
                    : locked
                      ? 'opacity-60'
                      : 'border-slate-200/10'
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {isOrientation ? (
                          <Sparkles className="h-5 w-5 text-amber-500" />
                        ) : locked ? (
                          <Lock className="h-5 w-5 text-slate-500" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        )}
                        {module.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{module.code} • {module.category}</p>
                    </div>

                    {completed ? (
                      <Badge variant="success" className="shrink-0">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    ) : locked ? (
                      <Badge variant="secondary" className="shrink-0">
                        <Lock className="h-4 w-4 mr-1" />
                        Locked
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
                    <p className="text-xs text-slate-500">
                      Lessons: {module.lessons.length}
                      {' '}•{' '}
                      Est: {module.estimatedDurationMinutes}m
                    </p>

                    <Button
                      size="sm"
                      variant={completed ? 'outline' : locked ? 'outline' : 'default'}
                      onClick={() => {
                        setError(null);
                        if (locked && orientationModule) {
                          router.push(`/helpers/training/${orientationModule.id}`);
                          return;
                        }
                        router.push(`/helpers/training/${module.id}`);
                      }}
                    >
                      {completed ? 'Review' : locked ? 'Go to Orientation' : 'Start'}
                    </Button>
                  </div>

                  {locked && orientationModule && (
                    <p className="text-xs text-slate-500 mt-3">
                      Unlock by completing {orientationModule.title} first.
                    </p>
                  )}
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
