import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import ApplicationsReviewClient from './ApplicationsReviewClient';

export default async function SysopApplicationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session?.user) {
    redirect('/login?redirectTo=' + encodeURIComponent('/admin/sysop/applications'));
  }

  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('capabilities, status, display_name')
    .eq('user_id', session.user.id)
    .single();

  const capabilities = (volunteer?.capabilities as unknown as string[]) || [];
  const isSysop = volunteer?.status === 'ACTIVE' && capabilities.includes('SYSOP');

  if (!isSysop) {
    redirect('/unauthorized?reason=sysop_required');
  }

  return (
    <ApplicationsReviewClient
      sysopName={volunteer?.display_name || session.user.email || 'Sysop'}
      sysopUserId={session.user.id}
    />
  );
}
