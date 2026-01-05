'use client';

import Link from 'next/link';
import { CheckCircle, Heart, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SightingSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Thank You!
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Your sighting report has been submitted. You may be helping reunite a family with their pet.
        </p>
        
        {/* What Happens Next */}
        <div className="text-left space-y-4 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What happens next?</h2>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">We check for matches</p>
              <p className="text-slate-400 text-sm">Your sighting is compared against missing pet reports</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Moderators review</p>
              <p className="text-slate-400 text-sm">A human verifies potential matches before notifying owners</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Families get notified</p>
              <p className="text-slate-400 text-sm">If there&apos;s a match, we connect you safely</p>
            </div>
          </div>
        </div>
        
        {/* Thank You Card */}
        <Card className="bg-emerald-900/30 border-emerald-700/50 mb-8">
          <CardContent className="p-6">
            <p className="text-emerald-200">
              💚 Every sighting report helps. Even if this isn&apos;t someone&apos;s lost pet, your vigilance makes a difference.
            </p>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="space-y-3">
          <Link href="/missing" className="block">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
              Browse Missing Pets
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 py-6">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
