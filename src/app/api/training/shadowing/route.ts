import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET - Fetch user's shadowing records
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get user from session (implement based on your auth setup)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    let query = supabase
      .from('shadowing_records')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data: records, error } = await query;

    if (error) {
      throw error;
    }

    // Type for shadowing records
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

    // Transform to match frontend types
    const transformedRecords = (records as ShadowingRecord[] | null)?.map(record => ({
      id: record.id,
      moduleId: record.module_id,
      moduleTitle: 'Training Module',
      mentorId: record.mentor_id,
      mentorName: record.mentor_email || 'Unknown Mentor',
      mentorEmail: record.mentor_email,
      sessionDate: record.session_date,
      hours: parseFloat(record.hours),
      activityType: record.activity_type,
      activityDescription: record.activity_description,
      location: record.location,
      verified: record.verified,
      verifiedAt: record.verified_at,
      mentorNotes: record.mentor_notes,
      mentorRating: record.mentor_rating,
      createdAt: record.created_at,
    })) || [];

    return NextResponse.json({ records: transformedRecords });
  } catch (error) {
    console.error('Failed to fetch shadowing records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shadowing records' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Log a new shadowing session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      moduleId,
      mentorId,
      mentorEmail,
      sessionDate,
      hours,
      activityType,
      activityDescription,
      location,
    } = body;

    // Validate required fields
    if (!moduleId || !sessionDate || !hours || !activityType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!mentorId && !mentorEmail) {
      return NextResponse.json(
        { error: 'Mentor ID or email required' },
        { status: 400 }
      );
    }

    // Validate hours
    if (hours <= 0 || hours > 12) {
      return NextResponse.json(
        { error: 'Hours must be between 0.5 and 12' },
        { status: 400 }
      );
    }

    // Validate session date (not in future, not too old)
    const sessionDateObj = new Date(sessionDate);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (sessionDateObj > now) {
      return NextResponse.json(
        { error: 'Session date cannot be in the future' },
        { status: 400 }
      );
    }

    if (sessionDateObj < sevenDaysAgo) {
      return NextResponse.json(
        { error: 'Sessions must be logged within 7 days' },
        { status: 400 }
      );
    }

    // If mentor email provided, look up or invite mentor
    let resolvedMentorId = mentorId;
    let mentorName = 'Unknown Mentor';

    if (mentorId) {
      // Look up mentor name
      const { data: mentor } = await supabase
        .from('auth.users')
        .select('raw_user_meta_data')
        .eq('id', mentorId)
        .single();
      
      mentorName = mentor?.raw_user_meta_data?.name || mentorName;
    } else if (mentorEmail) {
      // Check if mentor exists
      const { data: existingMentor } = await supabase
        .from('auth.users')
        .select('id, raw_user_meta_data')
        .eq('email', mentorEmail)
        .single();

      if (existingMentor) {
        resolvedMentorId = existingMentor.id;
        mentorName = existingMentor.raw_user_meta_data?.name || mentorEmail;
      } else {
        // Create pending verification record with email
        // In production, you'd send an email invitation to the mentor
        resolvedMentorId = null; // Will be linked when mentor signs up
        mentorName = mentorEmail;
      }
    }

    // Create shadowing record
    const { data: record, error } = await supabase
      .from('shadowing_records')
      .insert({
        user_id: userId,
        module_id: moduleId,
        mentor_id: resolvedMentorId,
        mentor_email: mentorEmail || null,
        session_date: sessionDate,
        hours: hours,
        activity_type: activityType,
        activity_description: activityDescription || null,
        location: location || null,
        verified: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get module title
    const { data: module } = await supabase
      .from('training_modules')
      .select('title')
      .eq('id', moduleId)
      .single();

    // Send verification email to mentor (implement based on your email setup)
    // await sendMentorVerificationEmail(mentorEmail || mentor?.email, record.id);

    const response = {
      id: record.id,
      moduleId: record.module_id,
      moduleTitle: module?.title || 'Unknown Module',
      mentorId: record.mentor_id,
      mentorName,
      mentorEmail: record.mentor_email,
      sessionDate: record.session_date,
      hours: parseFloat(record.hours),
      activityType: record.activity_type,
      activityDescription: record.activity_description,
      location: record.location,
      verified: record.verified,
      createdAt: record.created_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to log shadowing session:', error);
    return NextResponse.json(
      { error: 'Failed to log shadowing session' },
      { status: 500 }
    );
  }
}
