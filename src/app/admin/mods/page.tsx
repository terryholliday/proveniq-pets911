import { redirect } from 'next/navigation';
import ModeratorConsoleDashboard from './dashboard';
import { getAuthorityGate } from '@/lib/access/authority';

export default async function ModeratorConsolePage() {
  const gate = await getAuthorityGate({ capability: 'MODERATOR' });

  if (!gate.allowed) {
    if (gate.reason === 'UNAUTHENTICATED') {
      redirect('/login?redirectTo=' + encodeURIComponent('/admin/mods'));
    }

    if (gate.reason === 'NO_APPLICATION' || gate.reason === 'CAPABILITY_NOT_REQUESTED') {
      redirect('/unauthorized?reason=moderator_required');
    }

    if (gate.reason === 'NOT_APPROVED') {
      redirect('/helpers/dashboard');
    }

    if (gate.reason === 'TRAINING_INCOMPLETE') {
      redirect('/helpers/training');
    }

    redirect('/');
  }

  return <ModeratorConsoleDashboard />;
}
