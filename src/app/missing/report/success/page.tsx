'use client';

import Link from 'next/link';
import { CheckCircle, Share2, Bell, Search, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Report Submitted
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Your pet has been added to the Missing Pets Board. We&apos;re here to help.
        </p>
        
        {/* Case Number */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm mb-1">Case Reference</p>
            <p className="text-2xl font-mono font-bold text-white">MP-2024-{Math.floor(Math.random() * 9000) + 1000}</p>
          </CardContent>
        </Card>
        
        {/* Next Steps */}
        <div className="text-left space-y-4 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What happens next?</h2>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Your pet is now visible</p>
              <p className="text-slate-400 text-sm">Community members can view and report sightings</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Get notified of sightings</p>
              <p className="text-slate-400 text-sm">We&apos;ll contact you when someone reports a potential match</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Moderators verify matches</p>
              <p className="text-slate-400 text-sm">All potential matches are verified before sharing contact info</p>
            </div>
          </div>
        </div>
        
        {/* Ori Support Prompt */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Ori is here for you</p>
                <p className="text-purple-200 text-sm">Our empathy companion</p>
              </div>
            </div>
            <p className="text-purple-100 text-sm text-left mb-4">
              Losing a pet is hard. Ori can provide emotional support, search tips, and check in on you during this difficult time.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Talk to Ori
            </Button>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
            <Share2 className="w-5 h-5 mr-2" />
            Share on Social Media
          </Button>
          
          <Link href="/missing" className="block">
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 py-6">
              View Missing Pets Board
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full text-slate-400">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
