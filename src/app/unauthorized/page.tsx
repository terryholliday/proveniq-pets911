'use client';

import Link from 'next/link';
import { AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getReasonMessage = () => {
    switch (reason) {
      case 'moderator_required':
        return {
          title: 'Moderator Access Required',
          description: 'You need to request and be approved for the Moderator capability to access this dashboard.',
          action: {
            text: 'Apply for Moderator Role',
            href: '/helpers/join',
          },
        };
      default:
        return {
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
          action: {
            text: 'Go Home',
            href: '/',
          },
        };
    }
  };

  const { title, description, action } = getReasonMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600 text-sm">{description}</p>
          <Link href={action.href}>
            <Button className="w-full">{action.text}</Button>
          </Link>
          <Link href="/" className="block text-sm text-slate-500 hover:text-slate-400 transition-colors">
            ← Back to Home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
