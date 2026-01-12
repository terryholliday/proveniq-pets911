import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/client';
import ApplyForm from './ApplyForm';

export default async function VolunteerApplyPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Volunteer Application</h1>
        {!session ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to start or continue your volunteer application.
            </p>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              href={'/login?redirectTo=' + encodeURIComponent('/volunteer/apply')}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <ApplyForm userId={session.user.id} email={session.user.email ?? null} />
          </div>
        )}
      </div>
    </div>
  );
}
