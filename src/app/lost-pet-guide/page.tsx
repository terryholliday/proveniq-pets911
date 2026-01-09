'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Search,
  Shield,
  Camera,
  PawPrint,
  ChevronRight,
  CheckCircle,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LostPetGuidePage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PawPrint className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-white">Lost Pet Guide</span>
            </div>
            <Link
              href="/resources"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Back to Resources
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-4">Find Your Pet Faster</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A practical, safety-first playbook for the first hour, first day, and first week.
            </p>
          </div>

          <Alert className="mb-8 border-amber-500 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              <strong>Immediate danger?</strong> If your pet is injured, trapped, or in traffic danger, use Emergency Contacts.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <Link href="/missing/report" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg justify-between">
                Report Missing Pet
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/emergency-contacts" className="block">
              <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 py-6 text-lg justify-between">
                Emergency Contacts
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">First 60 minutes</h2>
                <p className="text-slate-400 text-sm">
                  Fast local search + strong scent containment.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">First 24 hours</h2>
                <p className="text-slate-400 text-sm">
                  Flyers + calls + data that amplifies your search.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Safety & scams</h2>
                <p className="text-slate-400 text-sm">
                  Protect your pet and your family from bad actors.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <section id="first-hour">
              <h2 className="text-2xl font-bold text-white mb-4">First 60 Minutes (Do This Now)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Search className="w-5 h-5 text-emerald-400" />
                      Search smart (don't chase)
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li><strong>Dogs:</strong> Walk/drive the immediate area slowly. Call gently, use a calm voice, and listen for tags/barking.</li>
                      <li><strong>Cats:</strong> Most hide close (under decks, sheds, brush). Use a flashlight at night; look for eye-shine.</li>
                      <li>Bring high-value treats, a leash, a familiar squeaky toy, and a flashlight.</li>
                      <li><strong>Do not run at them.</strong> If spotted, sit/turn sideways, toss treats, and let them approach.</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <PawPrint className="w-5 h-5 text-emerald-400" />
                      Contain scent
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li>Put <strong>worn clothing</strong> (unwashed shirt/socks) and your pet's bedding near the last known point.</li>
                      <li>Place a water bowl (avoid food if wildlife is active in your area).</li>
                      <li>Leave a door/garage cracked only if safe and you can monitor.</li>
                      <li>Ask neighbors to check garages/sheds <strong>now</strong> before doors close for the night.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="first-day">
              <h2 className="text-2xl font-bold text-white mb-4">First 24 Hours (Amplify Your Reach)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Megaphone className="w-5 h-5 text-blue-400" />
                      Post + print the right info
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li>Use <strong>1 great photo</strong> (clear face + markings). Add a second full-body shot if available.</li>
                      <li>Keep flyers simple: <strong>LOST PET</strong>, name, species, color, last seen area, and a phone number.</li>
                      <li>Use a dedicated callback number if possible.</li>
                      <li>Update microchip registry and notify your vet/rescue networks.</li>
                    </ul>
                    <div className="pt-2">
                      <Link href="/missing/report">
                        <Button className="bg-blue-600 hover:bg-blue-700">Create Missing Pet Post</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Phone className="w-5 h-5 text-blue-400" />
                      Call the right places
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li>Animal control, shelters, and nearby emergency vets (ask about stray intake).</li>
                      <li>Describe distinguishing features (collar type, limp, eye color, scars).</li>
                      <li>Ask about their <strong>hold policies</strong> and how to submit your flyer/report.</li>
                      <li>Re-check daily: many intakes are logged with limited descriptions.</li>
                    </ul>
                    <div className="pt-2">
                      <Link href="/emergency-contacts">
                        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                          View Emergency Contacts
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="sightings">
              <h2 className="text-2xl font-bold text-white mb-4">Get More Sightings</h2>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">Ask for photo proof</h3>
                      <p className="text-slate-400 text-sm">
                        When someone reports a sighting, request a photo/video, exact location, time, direction of travel, and whether the animal is still there.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <Link href="/missing" className="block">
                          <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                            Browse Missing Pets Board
                          </Button>
                        </Link>
                        <Link href="/sighting/report" className="block">
                          <Button className="bg-emerald-600 hover:bg-emerald-700">
                            Report a Sighting
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="safety">
              <h2 className="text-2xl font-bold text-white mb-4">Safety & Scam Prevention</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Shield className="w-5 h-5 text-purple-400" />
                      Common scam patterns
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li><strong>"Pay first"</strong> demands (gift cards, transfers) before “returning” your pet.</li>
                      <li>Refuses to describe identifying features or provide a photo.</li>
                      <li>Pressures you to <strong>meet alone</strong> or in a secluded location.</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                      Safer handoff rules
                    </div>
                    <ul className="text-slate-300 text-sm space-y-2">
                      <li>Meet in a public place (police station parking lots are ideal).</li>
                      <li>Bring a friend. Keep proof of ownership (photos, vet records, microchip info).</li>
                      <li>Ask <strong>them</strong> to tell you a unique detail before you share one.</li>
                      <li>If there's a microchip, verify at a vet/shelter.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="checklist">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Checklist</h2>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-200">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Search immediate area calmly</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Set up scent station</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Notify neighbors to check sheds/garages</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Post on Missing Pets Board</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Call shelters/animal control/vets</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Ask for photo proof of sightings</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Meet safely (public place + friend)</div>
                      <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />Re-check daily until found</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="help">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Need help organizing your search?</h3>
                      <p className="text-slate-400 text-sm">
                        Use the Missing Pets Board and encourage the public to report sightings.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/missing" className="block">
                        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                          Missing Pets Board
                        </Button>
                      </Link>
                      <Link href="/sighting/report" className="block">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          Report Sighting
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/resources" className="block">
              <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Back to Resources
              </Button>
            </Link>
            <Link href="/missing/report" className="block">
              <Button className="bg-blue-600 hover:bg-blue-700">Report Missing Pet</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
