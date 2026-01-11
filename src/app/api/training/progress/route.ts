import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { trainingProgressService } from '@/services/training-progress.service';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  if (moduleId) {
    const progress = await trainingProgressService.getModuleProgress(supabase, user.id, moduleId);
    return NextResponse.json({ progress });
  }

  const summary = await trainingProgressService.getUserProgress(supabase, user.id);
  return NextResponse.json({ summary });
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, moduleId, lessonId, score, localData } = body;

  switch (action) {
    case 'start': {
      if (!moduleId) {
        return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
      }
      const progress = await trainingProgressService.startModule(supabase, user.id, moduleId);
      return NextResponse.json({ progress });
    }

    case 'complete': {
      if (!moduleId) {
        return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
      }
      const progress = await trainingProgressService.completeModule(supabase, user.id, moduleId, score);
      return NextResponse.json({ progress });
    }

    case 'completeLesson': {
      if (!moduleId || !lessonId) {
        return NextResponse.json({ error: 'moduleId and lessonId required' }, { status: 400 });
      }
      const progress = await trainingProgressService.completeLesson(supabase, user.id, moduleId, lessonId);
      return NextResponse.json({ progress });
    }

    case 'sync': {
      if (!localData || typeof localData !== 'object') {
        return NextResponse.json({ error: 'localData required' }, { status: 400 });
      }
      await trainingProgressService.syncFromLocalStorage(supabase, user.id, localData);
      const summary = await trainingProgressService.getUserProgress(supabase, user.id);
      return NextResponse.json({ synced: true, summary });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
