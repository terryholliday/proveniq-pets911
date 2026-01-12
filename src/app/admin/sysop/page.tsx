import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export default async function SysopPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session?.user) {
    redirect('/login?redirectTo=' + encodeURIComponent('/admin/sysop'));
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">SYSOP</h1>
        <p className="text-zinc-400 text-sm">Signed in as {volunteer?.display_name || session.user.email}</p>
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Admin hub</div>
          <div className="text-sm text-zinc-400">This dashboard is intentionally minimal for now.</div>
        </div>
      </div>
    </div>
  );
}
