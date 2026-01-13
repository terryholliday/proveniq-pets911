import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/client';
import MultiStepApplyForm from './MultiStepApplyForm';

export default async function VolunteerApplyPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Volunteer Application</h1>
          <p className="text-muted-foreground mt-2">
            Join PetMayday and help save lives in your community
          </p>
        </div>

        {!session ? (
          <div className="max-w-md mx-auto rounded-xl border border-border bg-card p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to start or continue your volunteer application.
            </p>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
              href={'/login?redirectTo=' + encodeURIComponent('/volunteer/apply')}
            >
              Sign in to Apply
            </Link>
          </div>
        ) : (
          <MultiStepApplyForm userId={session.user.id} email={session.user.email ?? null} />
        )}
      </div>
    </div>
  );
}
