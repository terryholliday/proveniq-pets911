// Pet911 Module Progress API
// POST /api/training/progress - Update module progress

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { progressService } from '@/lib/training/progress-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, moduleId, sectionId, position, mentorId, sessionDate, hours, activityType, activityDescription, location } = body;

    switch (action) {
      case 'start': {
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
        }

        // Check access
        const accessCheck = await progressService.canAccessModule(user.id, moduleId);
        if (!accessCheck.canAccess) {
          return NextResponse.json({
            error: accessCheck.reason,
            unmetPrerequisites: accessCheck.unmetPrerequisites,
          }, { status: 403 });
        }

        const progress = await progressService.startModule(user.id, moduleId);
        return NextResponse.json({ progress });
      }

      case 'complete_section': {
        if (!moduleId || !sectionId) {
          return NextResponse.json({ error: 'moduleId and sectionId required' }, { status: 400 });
        }

        const progress = await progressService.completeSection(user.id, moduleId, sectionId);
        return NextResponse.json({ progress });
      }

      case 'complete_content': {
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
        }

        const progress = await progressService.completeContent(user.id, moduleId);
        return NextResponse.json({ progress });
      }

      case 'save_position': {
        if (!moduleId || !position) {
          return NextResponse.json({ error: 'moduleId and position required' }, { status: 400 });
        }

        await progressService.savePosition(user.id, moduleId, position);
        return NextResponse.json({ success: true });
      }

      case 'request_signoff': {
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
        }

        await progressService.requestSignoff(user.id, moduleId);
        return NextResponse.json({ success: true });
      }

      case 'log_shadowing': {
        if (!moduleId || !mentorId || !sessionDate || !hours || !activityType) {
          return NextResponse.json({ 
            error: 'moduleId, mentorId, sessionDate, hours, and activityType required' 
          }, { status: 400 });
        }

        await progressService.logShadowingHours(
          user.id,
          moduleId,
          mentorId,
          new Date(sessionDate),
          hours,
          activityType,
          activityDescription,
          location
        );
        return NextResponse.json({ success: true });
      }

      case 'check_access': {
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
        }

        const accessCheck = await progressService.canAccessModule(user.id, moduleId);
        return NextResponse.json(accessCheck);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching progress
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (moduleId) {
      // Get specific module progress
      const progress = await progressService.getOrCreateProgress(user.id, moduleId);
      return NextResponse.json({ progress });
    } else {
      // Get all progress
      const progress = await progressService.getUserProgress(user.id);
      const summary = await progressService.getProgressSummary(user.id);
      return NextResponse.json({ progress, summary });
    }
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
