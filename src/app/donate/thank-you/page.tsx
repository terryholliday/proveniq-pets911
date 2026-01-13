'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, CheckCircle, Share2, Mail, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-pet-profiles.ico" alt="PetMayday" className="h-8 w-8" />
            <span className="font-bold">PetMayday</span>
          </Link>
          <Badge variant="outline" className="border-green-500 text-green-400">
            Donation Complete
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="bg-zinc-900/50 border-zinc-800 max-w-lg w-full">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-600 mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-10 h-10 text-white fill-current" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
            <p className="text-xl text-zinc-400 mb-6">
              Your generosity helps save lives.
            </p>

            {/* Confirmation */}
            <div className="bg-zinc-800 rounded-lg p-6 mb-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Donation Confirmed</p>
                  <p className="text-sm text-zinc-400">
                    A receipt has been sent to your email.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Tax Deductible</p>
                  <p className="text-sm text-zinc-400">
                    Your receipt contains all information needed for tax purposes.
                  </p>
                </div>
              </div>
              {sessionId && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    Reference: {sessionId.slice(0, 20)}...
                  </p>
                </div>
              )}
            </div>

            {/* What Your Donation Does */}
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-amber-400 mb-3">Your Impact</h3>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li>• Funds emergency pet rescue operations</li>
                <li>• Supports volunteer transport missions</li>
                <li>• Covers emergency veterinary care</li>
                <li>• Helps reunite lost pets with their families</li>
              </ul>
            </div>

            {/* Share */}
            <div className="flex gap-3 mb-6">
              <Button variant="outline" className="flex-1" asChild>
                <a 
                  href={`https://twitter.com/intent/tweet?text=I just donated to @PetMayday to help save pets in West Virginia! 🐾 Join me: petmayday.org/donate`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </a>
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-500 text-black" asChild>
                <Link href="/">
                  Return Home
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <p className="text-xs text-zinc-500">
              Questions? Contact us at{' '}
              <a href="mailto:donate@petmayday.org" className="text-amber-400 hover:underline">
                donate@petmayday.org
              </a>
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 px-4 text-center text-xs text-zinc-500">
        <p>PROVENIQ Foundation is a 501(c)(3) nonprofit organization.</p>
      </footer>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
