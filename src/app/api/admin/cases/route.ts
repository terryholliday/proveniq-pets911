import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: cases, error } = await supabase
      .from('incident_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json({ cases: [] });
    }

    return NextResponse.json({ cases: cases || [] });
  } catch (error) {
    console.error('Cases API error:', error);
    return NextResponse.json({ cases: [] });
  }
}
