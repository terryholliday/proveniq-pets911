import { redirect } from 'next/navigation';
import { getAdminGate } from '@/lib/access/authority';

export default async function SysopLayout({ children }: { children: React.ReactNode }) {
  const gate = await getAdminGate({ required: 'SYSOP' });

  if (!gate.allowed) {
    redirect('/login?redirectTo=/admin/sysop&error=forbidden');
  }

  return children;
}
