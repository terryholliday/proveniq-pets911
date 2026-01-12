import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import ApplicationsReviewClient from './ApplicationsReviewClient';

// Easter egg: No auth check - security through obscurity
export default async function SysopApplicationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  let displayName = 'Sysop';
  let userId = 'anonymous';

  if (session?.user) {
    userId = session.user.id;
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('display_name')
      .eq('user_id', session.user.id)
      .maybeSingle();
    displayName = volunteer?.display_name || session.user.email || 'Sysop';
  }

  return (
    <ApplicationsReviewClient
      sysopName={displayName}
      sysopUserId={userId}
    />
  );
}
