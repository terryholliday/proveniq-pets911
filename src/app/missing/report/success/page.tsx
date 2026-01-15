'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Share2, Bell, Search, Heart, Sparkles, FileText, X, Printer, Download, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MissingPetFlyer, { type MissingPetFlyerProps, type Species, type FlyerTemplate, FLYER_TEMPLATES } from '@/components/flyers/MissingPetFlyer';

export default function ReportSuccessPage() {
  const [showFlyer, setShowFlyer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FlyerTemplate>('classic');
  const flyerRef = useRef<HTMLDivElement>(null);
  const caseNumber = `MP-2024-${Math.floor(Math.random() * 9000) + 1000}`;

  // Editable flyer data - in production this would come from the submitted report
  const [flyerData, setFlyerData] = useState<MissingPetFlyerProps>({
    petName: 'Buddy',
    species: 'DOG' as Species,
    breed: 'Golden Retriever',
    color: 'Golden',
    size: 'Large',
    lastSeenDate: new Date().toISOString().split('T')[0],
    lastSeenLocation: 'Downtown Area, West Virginia',
    description: 'Friendly, wearing blue collar with tags',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    contactPhone: '(304) 555-0123',
    contactName: 'Pet Owner',
    // reward intentionally not set by default - user must opt-in
    caseNumber,
  });

  // Load from sessionStorage if available (from report form)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('mayday_lost_pet_draft');
      if (stored) {
        const draft = JSON.parse(stored);
        setFlyerData(prev => ({
          ...prev,
          petName: draft.name || prev.petName,
          species: (draft.species as Species) || prev.species,
          breed: draft.breed || prev.breed,
          color: draft.color || prev.color,
          size: draft.size || prev.size,
          lastSeenDate: draft.lastSeenDate || prev.lastSeenDate,
          lastSeenLocation: draft.lastSeenLocation || prev.lastSeenLocation,
          description: draft.description || draft.distinctiveFeatures || prev.description,
          contactPhone: draft.ownerPhone || prev.contactPhone,
          contactName: draft.ownerName || prev.contactName,
          // Never auto-fill reward - user must explicitly opt-in
        }));
      }
    } catch {}
  }, []);

  const updateFlyerData = (updates: Partial<MissingPetFlyerProps>) => {
    setFlyerData(prev => ({ ...prev, ...updates }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (showFlyer) {
    return (
      <main className="min-h-screen bg-slate-900 px-6 py-12 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto">
          {/* Header - hidden when printing */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h1 className="text-2xl font-bold text-white">Missing Pet Flyer</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="border-slate-600 text-slate-300"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {isEditing ? 'Done Editing' : 'Edit Flyer'}
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowFlyer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Template Selector - always visible when not printing */}
          <div className="mb-6 print:hidden">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Choose Template Style</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {FLYER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <p className="font-medium text-white text-sm">{tmpl.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={isEditing ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
            {/* Edit Form - shown when editing */}
            {isEditing && (
              <div className="bg-slate-800 rounded-xl p-6 space-y-4 print:hidden overflow-y-auto max-h-[80vh]">
                <h2 className="text-lg font-bold text-white mb-4">Edit Flyer Details</h2>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Pet Name</label>
                  <input
                    type="text"
                    value={flyerData.petName}
                    onChange={(e) => updateFlyerData({ petName: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Species</label>
                  <select
                    value={flyerData.species}
                    onChange={(e) => updateFlyerData({ species: e.target.value as Species })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="BIRD">Bird</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Breed</label>
                  <input
                    type="text"
                    value={flyerData.breed || ''}
                    onChange={(e) => updateFlyerData({ breed: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={flyerData.color}
                    onChange={(e) => updateFlyerData({ color: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Size</label>
                  <input
                    type="text"
                    value={flyerData.size || ''}
                    onChange={(e) => updateFlyerData({ size: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Seen Location</label>
                  <input
                    type="text"
                    value={flyerData.lastSeenLocation}
                    onChange={(e) => updateFlyerData({ lastSeenLocation: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Seen Date</label>
                  <input
                    type="date"
                    value={flyerData.lastSeenDate}
                    onChange={(e) => updateFlyerData({ lastSeenDate: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={flyerData.description || ''}
                    onChange={(e) => updateFlyerData({ description: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={flyerData.contactPhone}
                    onChange={(e) => updateFlyerData({ contactPhone: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Name (optional)</label>
                  <input
                    type="text"
                    value={flyerData.contactName || ''}
                    onChange={(e) => updateFlyerData({ contactName: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                {/* Reward - explicit opt-in */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <label className="block text-sm text-slate-400 mb-1">
                    Reward (optional - leave blank for no reward)
                  </label>
                  <input
                    type="text"
                    value={flyerData.reward || ''}
                    onChange={(e) => updateFlyerData({ reward: e.target.value || undefined })}
                    placeholder="e.g. $100 or Leave blank"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    ⚠️ Rewards may attract scammers. Only offer if you&apos;re prepared to verify.
                  </p>
                </div>
              </div>
            )}

            {/* Flyer Preview */}
            <div ref={flyerRef}>
              <MissingPetFlyer {...flyerData} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </main>
    );
  }

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

        {/* Support Companion Prompt */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Support Companion is here</p>
                <p className="text-purple-200 text-sm">Your crisis companion</p>
              </div>
            </div>
            <p className="text-purple-100 text-sm text-left mb-4">
              Losing a pet is hard. The Support Companion can provide emotional support, search tips, and check in on you during this difficult time.
            </p>
            <Link href="/support">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Talk to Support Companion
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setShowFlyer(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            Create Missing Pet Flyer
          </Button>

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
