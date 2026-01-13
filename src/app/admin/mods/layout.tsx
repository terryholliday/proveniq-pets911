import { redirect } from 'next/navigation';
import { getAdminGate } from '@/lib/access/authority';

export default async function ModsLayout({ children }: { children: React.ReactNode }) {
  const gate = await getAdminGate({ required: 'MODERATOR' });

  if (!gate.allowed) {
    redirect('/login?redirectTo=/admin/mods&error=forbidden');
  }

  return children;
}
