import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { id } = await params;

  try {
    // Fetch case with animals
    const { data: caseData, error: caseError } = await supabase
      .from('incident_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch animals for this case
    const { data: animals } = await supabase
      .from('case_animals')
      .select('*')
      .eq('case_id', id);

    // Fetch timeline events (from audit log or dedicated table)
    const { data: timeline } = await supabase
      .from('case_timeline')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      case: {
        ...caseData,
        animals: animals || [],
        timeline: timeline || [],
      }
    });
  } catch (error) {
    console.error('Case detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}
