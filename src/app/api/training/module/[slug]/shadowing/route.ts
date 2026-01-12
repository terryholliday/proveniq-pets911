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
      .select(`
        *,
        mentor:auth.users!mentor_id(id, raw_user_meta_data)
      `)
      .eq('user_id', userId)
      .eq('module_id', module.id)
      .order('session_date', { ascending: false });

    // Get available mentors (users with this certification who are available)
    const { data: mentors } = await supabase
      .from('volunteer_certifications')
      .select(`
        user:auth.users!user_id(id, email, raw_user_meta_data)
      `)
      .eq('module_id', module.id)
      .eq('status', 'active')
      .neq('user_id', userId);

    // Transform records
    const transformedRecords = records?.map(r => ({
      id: r.id,
      moduleId: r.module_id,
      moduleTitle: module.title,
      mentorId: r.mentor_id,
      mentorName: r.mentor?.raw_user_meta_data?.name || r.mentor_email || 'Unknown',
      mentorEmail: r.mentor_email || r.mentor?.raw_user_meta_data?.email,
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

    // Transform mentors
    const availableMentors = mentors
      ?.filter(m => m.user)
      .map(m => ({
        id: m.user.id,
        name: m.user.raw_user_meta_data?.name || m.user.email,
        email: m.user.email,
        certifications: [module.title],
        location: m.user.raw_user_meta_data?.location,
      })) || [];

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
