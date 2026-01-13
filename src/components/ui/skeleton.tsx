'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-800/50',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-zinc-800 bg-zinc-900/50 p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b border-zinc-800">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 flex-1" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="flex gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-zinc-900/50 border-b border-zinc-800">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-3 text-center">
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="border-b border-r border-zinc-800 p-2 min-h-[80px]">
            <Skeleton className="h-4 w-6 mb-2" />
            {i % 3 === 0 && <Skeleton className="h-6 w-full rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <SkeletonStats />
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
