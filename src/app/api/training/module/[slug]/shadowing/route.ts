import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET - Fetch shadowing data for a specific module
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get module info
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select('id, title, requires_shadowing, shadowing_hours_required')
      .eq('slug', slug)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get user's shadowing records for this module
    const { data: records } = await supabase
      .from('shadowing_records')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', module.id)
      .order('session_date', { ascending: false });

    // Transform records with type cast
    type ShadowingRecord = {
      id: string;
      module_id: string;
      mentor_id?: string;
      mentor_email?: string;
      session_date: string;
      hours: string;
      activity_type?: string;
      activity_description?: string;
      location?: string;
      verified: boolean;
      verified_at?: string;
      mentor_notes?: string;
      mentor_rating?: number;
      created_at: string;
    };

    const transformedRecords = (records as ShadowingRecord[] | null)?.map(r => ({
      id: r.id,
      moduleId: r.module_id,
      moduleTitle: module.title,
      mentorId: r.mentor_id,
      mentorName: r.mentor_email || 'Unknown',
      mentorEmail: r.mentor_email,
      sessionDate: r.session_date,
      hours: parseFloat(r.hours),
      activityType: r.activity_type,
      activityDescription: r.activity_description,
      location: r.location,
      verified: r.verified,
      verifiedAt: r.verified_at,
      mentorNotes: r.mentor_notes,
      mentorRating: r.mentor_rating,
      createdAt: r.created_at,
    })) || [];

    // For now, return empty mentors list (simplified)
    const availableMentors: { id: string; name: string; email: string; certifications: string[]; location?: string }[] = [];

    return NextResponse.json({
      moduleId: module.id,
      moduleTitle: module.title,
      requiredHours: module.shadowing_hours_required || 0,
      records: transformedRecords,
      availableMentors,
    });
  } catch (error) {
    console.error('Failed to fetch module shadowing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shadowing data' },
      { status: 500 }
    );
  }
}
