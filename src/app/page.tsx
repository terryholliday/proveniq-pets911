'use client';

import Link from 'next/link';
import { AlertTriangle, Search, Eye, Heart, Users, ClipboardList, MessageCircleHeart, LogOut, LogIn } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, signOut, loading } = useAuth();

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/icon-pet-profiles.ico"
                alt="Pet911"
                className="w-6 h-6"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://lostpets911.org/icon-pet-profiles.ico';
                }}
              />
              <span className="font-bold text-white">PetNexus Pet911</span>
            </div>
            <div className="flex items-center gap-4">
              {!loading && user ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm">Hi, {user.user_metadata?.full_name || user.email}</span>
                  <button
                    onClick={signOut}
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login?redirectTo=/register"
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
              <NotificationCenter />
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Emergency First */}
      <section className="relative min-h-[50vh] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600 via-red-700 to-slate-900" />

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-center px-6 py-12">
          <div className="max-w-2xl mx-auto w-full text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/90 text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              PetNexus Pet911 • West Virginia
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Found an Animal<br />That Needs Help?
            </h1>

            <p className="text-xl text-red-100 mb-8 max-w-md mx-auto">
              Get immediate access to emergency vets and animal control in your area.
            </p>

            <Link href="/emergency" className="inline-block w-full max-w-sm">
              <div className="bg-white text-red-600 font-bold text-xl py-5 px-8 rounded-2xl shadow-2xl shadow-black/30 hover:bg-red-50 hover:scale-105 transition-all flex items-center justify-center gap-3">
                <AlertTriangle className="w-7 h-7" />
                EMERGENCY ASSIST
              </div>
            </Link>

            <p className="text-red-200 text-sm mt-4">
              No sign-up required • Works offline
            </p>
          </div>
        </div>
      </section>

      {/* What brings you here? */}
      <section className="px-6 py-12 bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            What brings you here?
          </h2>
          <p className="text-slate-400 text-center mb-8 text-lg">
            Choose the option that best describes your situation
          </p>

          <div className="space-y-3">
            {/* Lost My Pet */}
            <Link href="/missing/report" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">I Lost My Pet</h3>
                    <p className="text-slate-400 text-sm">Report a missing pet and get help searching</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-blue-400 transition-colors">→</span>
                </div>
              </div>
            </Link>

            {/* Spotted a Lost Pet */}
            <Link href="/sighting/report" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">I Spotted a Lost Pet</h3>
                    <p className="text-slate-400 text-sm">Report a sighting to help reunite families</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-emerald-400 transition-colors">→</span>
                </div>
              </div>
            </Link>

            {/* Multiple Animals / Special Situations */}
            <Link href="/sighting/multi" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-orange-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Multiple Animals / Special Situation</h3>
                    <p className="text-slate-400 text-sm">Litters, feral colonies, deceased owner animals, hoarding</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-orange-400 transition-colors">→</span>
                </div>
              </div>
            </Link>

            {/* Browse Missing Pets */}
            <Link href="/missing" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-amber-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Missing Pets Board</h3>
                    <p className="text-slate-400 text-sm">Browse pets reported missing in your area</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-amber-400 transition-colors">→</span>
                </div>
              </div>
            </Link>

            {/* Register My Pet */}
            <Link href="/register" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-purple-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Register My Pet</h3>
                    <p className="text-slate-400 text-sm">Helps reunification if your pet is ever lost</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-purple-400 transition-colors">→</span>
                </div>
              </div>
            </Link>

            {/* Support Companion */}
            <Link href="/support" className="block group">
              <div className="bg-slate-800 border-2 border-slate-700 hover:border-teal-500 rounded-2xl p-4 transition-all hover:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircleHeart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Support Companion</h3>
                    <p className="text-slate-400 text-sm">Get empathetic support during a difficult time</p>
                  </div>
                  <span className="text-slate-500 text-xl group-hover:text-teal-400 transition-colors">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do / Don't Do */}
      <section className="px-6 py-16 bg-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How We Help
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What We Do */}
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-400">What We Do</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300">Connect finders with <strong className="text-white">24/7 emergency vets</strong> and animal control</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300">Maintain a <strong className="text-white">Missing Pets Board</strong> searchable by location and description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300">Provide <strong className="text-white">empathetic support</strong> for pet parents through our Support Companion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300">Coordinate <strong className="text-white">verified sightings</strong> with moderated match suggestions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300">Work <strong className="text-white">offline</strong> so emergency info is always available</span>
                </li>
              </ul>
            </div>

            {/* What We Don't Do */}
            <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xl">✕</span>
                </div>
                <h3 className="text-2xl font-bold text-red-400">What We Don't Do</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-slate-300">We <strong className="text-white">don't guarantee reunification</strong> — we provide tools, not promises</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-slate-300">We <strong className="text-white">don't share your contact info</strong> without your explicit consent</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-slate-300">We <strong className="text-white">don't provide veterinary advice</strong> — we route you to professionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-slate-300">We <strong className="text-white">don't operate shelters</strong> or take custody of animals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-slate-300">We <strong className="text-white">don't use AI to confirm matches</strong> — humans verify all suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Resource Center */}
      <section className="px-6 py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Resource Center
          </h2>
          <p className="text-slate-400 text-center mb-12 text-lg">
            Frequently asked questions and helpful information
          </p>

          <div className="space-y-4">
            <FAQItem
              question="What should I do if I find an injured animal?"
              answer="Tap the EMERGENCY ASSIST button at the top of this page. You'll be guided through assessing the animal's condition and connected to the nearest emergency vet or animal control. No sign-up required."
            />
            <FAQItem
              question="How does the Missing Pets Board work?"
              answer="Pet owners can post details and photos of their missing pets. Community members can browse the board and report sightings. Our moderators verify potential matches before connecting parties to prevent scams."
            />
            <FAQItem
              question="Is this service free?"
              answer="Yes. PetNexus Pet911 is free for all users. We're a pilot program serving Greenbrier and Kanawha counties in West Virginia."
            />
            <FAQItem
              question="What is the Support Companion and how can it help me?"
              answer="The Support Companion is our empathetic AI guide designed to help you through pet-related crises. When you report a missing pet or need help, the Support Companion provides emotional support, practical search tips, and gentle guidance during a difficult time. It's like having a supportive friend available 24/7."
            />
            <FAQItem
              question="How do you verify sightings and prevent scams?"
              answer="All potential matches go through human moderators before any contact info is shared. We use location verification, photo comparison, and behavior analysis. We never share your contact details without your explicit consent."
            />
            <FAQItem
              question="Does the app work without internet?"
              answer="Yes. Emergency contacts, vet locations, and call scripts are cached on your device. You can access critical information even in areas with poor signal. Actions you take offline sync when you're back online."
            />
            <FAQItem
              question="What counties do you serve?"
              answer="Currently we're piloting in Greenbrier & Kanawha Counties We plan to expand based on pilot results."
            />
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              View all resources
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-bold text-white">PetNexus Pet911</span>
              </div>
              <p className="text-slate-400 text-sm">
                Emergency coordination for lost and found pets in West Virginia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/emergency" className="text-slate-400 hover:text-white transition-colors">Emergency Assist</Link></li>
                <li><Link href="/missing" className="text-slate-400 hover:text-white transition-colors">Missing Pets Board</Link></li>
                <li><Link href="/resources" className="text-slate-400 hover:text-white transition-colors">Resources</Link></li>
                <li><Link href="/support" className="text-slate-400 hover:text-white transition-colors">Support Companion</Link></li>
                <li><Link href="/help/safety" className="text-slate-400 hover:text-white transition-colors">Help &amp; Safety</Link></li>
                <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
                <li>
                  {!loading && user ? (
                    <Link href="/helpers/dashboard" className="text-slate-400 hover:text-white transition-colors">Volunteers</Link>
                  ) : (
                    <Link href="/login?redirectTo=/helpers/dashboard" className="text-slate-400 hover:text-white transition-colors">Volunteer Login</Link>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/admin/mods" className="text-slate-400 hover:text-white transition-colors">Moderator Access</Link></li>
                <li><Link href="/admin/sysop" className="text-slate-400 hover:text-white transition-colors">SYSOP Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              © 2024 PetNexus Foundation. • Greenbrier & Kanawha Counties, WV
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-slate-800 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
        <span className="font-semibold text-white text-lg pr-4">{question}</span>
        <span className="text-slate-400 group-open:rotate-180 transition-transform text-2xl flex-shrink-0">
          ↓
        </span>
      </summary>
      <div className="px-6 pb-6 pt-2">
        <p className="text-slate-300 leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
