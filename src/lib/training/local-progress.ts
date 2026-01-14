export type TrainingModuleProgress = {
  moduleId: string;
  completedAt: string;
};

type TrainingProgressStore = {
  modules: Record<string, TrainingModuleProgress>;
};

const STORAGE_KEY = 'Mayday_training_progress_v1';

function safeParse(json: string): TrainingProgressStore | null {
  try {
    return JSON.parse(json) as TrainingProgressStore;
  } catch {
    return null;
  }
}

export function getTrainingProgressStore(): TrainingProgressStore {
  if (typeof window === 'undefined') {
    return { modules: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { modules: {} };

  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object' || !parsed.modules) {
    return { modules: {} };
  }

  return parsed;
}

export function isModuleCompleted(moduleId: string): boolean {
  const store = getTrainingProgressStore();
  return Boolean(store.modules[moduleId]?.completedAt);
}

export function markModuleCompleted(moduleId: string): TrainingModuleProgress {
  if (typeof window === 'undefined') {
    return { moduleId, completedAt: new Date().toISOString() };
  }

  const store = getTrainingProgressStore();
  const progress: TrainingModuleProgress = {
    moduleId,
    completedAt: new Date().toISOString(),
  };

  const next: TrainingProgressStore = {
    modules: {
      ...store.modules,
      [moduleId]: progress,
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return progress;
}

export function clearTrainingProgress(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
