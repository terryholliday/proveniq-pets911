import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/client';
import ApplyForm from './ApplyForm';

export default async function VolunteerApplyPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    redirect('/login?redirectTo=' + encodeURIComponent('/volunteer/apply'));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Volunteer Application</h1>
        <div className="mt-6">
          <ApplyForm userId={data.session.user.id} email={data.session.user.email ?? null} />
        </div>
      </div>
    </div>
  );
}
