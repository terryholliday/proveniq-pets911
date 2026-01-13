import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// ============================================================================
// GET - Fetch user's background check status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      );
    }

    // Get user from session
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get most recent background check
    const { data: check, error } = await supabase
      .from('volunteer_background_checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get modules that require background check
    const { data: modulesRequiringBgCheck } = await supabase
      .from('training_modules')
      .select('title')
      .eq('requires_background_check', true)
      .eq('is_active', true);

    const requiredForModules = modulesRequiringBgCheck?.map(m => m.title) || [];

    // Provider info (configure based on your provider)
    const provider = {
      name: process.env.BACKGROUND_CHECK_PROVIDER || 'Checkr',
      estimatedDays: '2-5 days',
      cost: 'Free',
    };

    return NextResponse.json({
      check: check || null,
      requiredForModules,
      provider,
    });
  } catch (error) {
    console.error('Failed to fetch background check:', error);
    return NextResponse.json(
      { error: 'Failed to fetch background check status' },
      { status: 500 }
    );
  }
}
