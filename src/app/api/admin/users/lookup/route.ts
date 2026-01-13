import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/admin/users/lookup?email=...
 * Look up a user by email
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email parameter required' }, { status: 400 });
  }

  // Use admin API to look up user by email
  // Note: This requires service role key for production
  const { data, error } = await supabase
    .rpc('get_user_by_email', { user_email: email });

  if (error || !data) {
    // Fallback: check volunteers table for email
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('user_id')
      .eq('email', email)
      .single();

    if (volunteer) {
      return NextResponse.json({ id: volunteer.user_id, email });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ id: data.id, email: data.email });
}
