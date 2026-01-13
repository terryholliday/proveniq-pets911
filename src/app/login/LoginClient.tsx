'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, AlertCircle, Shield } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'magic';

export default function LoginClient() {
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/';
  const error = params.get('error');

  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'error' | 'success' | 'info'>('info');

  const onEmailPassword = async () => {
    setBusy(true);
    setStatus(null);
    console.log('[Auth] Attempting', mode, 'for', email);
    
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        console.log('[Auth] Sign in response:', { data, error });
        
        if (error) {
          console.error('[Auth] Sign in error:', error);
          throw error;
        }
        
        if (data.session) {
          console.log('[Auth] Session obtained, determining redirect...');
          setStatusType('success');
          setStatus('Success! Determining your dashboard...');
          
          // If explicit redirectTo was provided (and not just /), use it
          if (redirectTo && redirectTo !== '/') {
            console.log('[Auth] Using explicit redirectTo:', redirectTo);
            window.location.href = redirectTo;
            return;
          }
          
          // Otherwise, determine redirect based on user role
          try {
            const { data: volunteer } = await supabase
              .from('volunteers')
              .select('capabilities, status')
              .eq('user_id', data.user.id)
              .maybeSingle();
            
            const caps: string[] = volunteer?.capabilities || [];
            console.log('[Auth] User capabilities:', caps);
            
            let targetPath = '/';
            if (caps.includes('SYSOP')) {
              targetPath = '/admin/sysop';
            } else if (caps.includes('MODERATOR')) {
              targetPath = '/admin/mods/dispatch';
            } else if (caps.includes('PARTNER')) {
              targetPath = '/partner/dashboard';
            } else if (volunteer?.status === 'ACTIVE') {
              targetPath = '/volunteer/dashboard';
            }
            
            console.log('[Auth] Role-based redirect to:', targetPath);
            window.location.href = targetPath;
          } catch (roleErr) {
            console.error('[Auth] Role lookup failed, redirecting home:', roleErr);
            window.location.href = '/';
          }
          return;
        }
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log('[Auth] Sign up response:', { data, error });
      
      if (error) throw error;
      setStatusType('success');
      setStatus('Account created! Check your email to confirm your account.');
    } catch (e: any) {
      console.error('[Auth] Error:', e);
      setStatusType('error');
      // Provide more helpful error messages
      if (e?.message?.includes('Invalid login credentials')) {
        setStatus('Invalid email or password. Please check your credentials and try again.');
      } else if (e?.message?.includes('Email not confirmed')) {
        setStatus('Please confirm your email address first. Check your inbox for a confirmation link.');
      } else {
        setStatus(e?.message ?? 'Authentication failed. Please try again.');
      }
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <Heart className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pet911 West Virginia</h1>
          <p className="text-zinc-400 text-sm mt-1">Staff & Partner Sign In</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          {/* Staff/Partner Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-zinc-300">Staff & Partner Portal</span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{decodeURIComponent(error)}</p>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setMode('signin')}
              disabled={busy}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              disabled={busy}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              disabled={busy}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'magic' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <input
                className="w-full h-11 rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'magic' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <input
                  className="w-full h-11 rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                />
              </div>
            )}

            {status && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                statusType === 'error' ? 'bg-red-900/20 border border-red-800' :
                statusType === 'success' ? 'bg-green-900/20 border border-green-800' :
                'bg-zinc-800 border border-zinc-700'
              }`}>
                <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  statusType === 'error' ? 'text-red-400' :
                  statusType === 'success' ? 'text-green-400' :
                  'text-zinc-400'
                }`} />
                <p className={`text-sm ${
                  statusType === 'error' ? 'text-red-400' :
                  statusType === 'success' ? 'text-green-400' :
                  'text-zinc-400'
                }`}>{status}</p>
              </div>
            )}

            {mode === 'magic' ? (
              <Button 
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-medium" 
                onClick={onMagicLink} 
                disabled={busy || !email}
              >
                {busy ? 'Sending...' : 'Send Magic Link'}
              </Button>
            ) : (
              <Button 
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-medium" 
                onClick={onEmailPassword} 
                disabled={busy || !email || !password}
              >
                {busy ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>
            )}

            <div className="text-center">
              <Link href={redirectTo} className="text-sm text-zinc-500 hover:text-zinc-300">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-600">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-zinc-400 hover:text-white">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-zinc-400 hover:text-white">Privacy Policy</Link>.
        </div>

        {/* Debug info - remove in production */}
        <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
          <strong>Troubleshooting:</strong> Open browser console (F12) to see auth debug logs.
          If login fails, check that your email is confirmed in Supabase.
        </div>
      </div>
    </div>
  );
}

