'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Mode = 'signin' | 'signup' | 'magic';

export default function LoginPage() {
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/';
  const error = params.get('error');

  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onEmailPassword = async () => {
    setBusy(true);
    setStatus(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = redirectTo;
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setStatus('Account created. If email confirmation is enabled, check your inbox.');
    } catch (e: any) {
      setStatus(e?.message ?? 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const onMagicLink = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const origin = window.location.origin;
      const emailRedirectTo = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      setStatus('Magic link sent. Check your email to continue.');
    } catch (e: any) {
      setStatus(e?.message ?? 'Failed to send magic link');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            You must be signed in to complete an application or training.
          </p>
          {error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <Button type="button" variant={mode === 'signin' ? 'default' : 'outline'} onClick={() => setMode('signin')} disabled={busy}>
            Email + Password
          </Button>
          <Button type="button" variant={mode === 'signup' ? 'default' : 'outline'} onClick={() => setMode('signup')} disabled={busy}>
            Create Account
          </Button>
          <Button type="button" variant={mode === 'magic' ? 'default' : 'outline'} onClick={() => setMode('magic')} disabled={busy}>
            Magic Link
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'magic' && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <input
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
            </div>
          )}

          {status && (
            <p className="text-sm text-muted-foreground">{status}</p>
          )}

          {mode === 'magic' ? (
            <Button className="w-full" onClick={onMagicLink} disabled={busy || !email}>
              Send magic link
            </Button>
          ) : (
            <Button className="w-full" onClick={onEmailPassword} disabled={busy || !email || !password}>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          )}

          <div className="text-xs text-muted-foreground">
            <Link href={redirectTo} className="underline underline-offset-4">Back</Link>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          By continuing, you agree to the
          {' '}
          <Link href="/terms" className="underline underline-offset-4">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>.
        </div>
      </div>
    </div>
  );
}
