import { redirect } from 'next/navigation';
import { getAuthorityGate } from '@/lib/access/authority';
import AdminVolunteersClient from './AdminVolunteersClient';

export default async function AdminVolunteersPage() {
  const sysopGate = await getAuthorityGate({ capability: 'SYSOP' });
  const gate = sysopGate.allowed ? sysopGate : await getAuthorityGate({ capability: 'MODERATOR' });

  if (!gate.allowed) {
    if (gate.reason === 'UNAUTHENTICATED') {
      redirect('/login?redirectTo=' + encodeURIComponent('/admin/volunteers'));
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

  return <AdminVolunteersClient />;
}

