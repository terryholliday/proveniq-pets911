import Link from 'next/link';
import { Users, ArrowLeft, MessageCircle, Heart, HelpCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CommunitySupportPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              <span className="font-bold text-white">Community Support</span>
            </div>
            <Link
              href="/resources"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back to Resources
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Coming Soon Alert */}
          <Alert className="mb-8 border-purple-500 bg-purple-500/10">
            <HelpCircle className="h-4 w-4 text-purple-500" />
            <AlertDescription className="text-purple-200">
              <strong>Community Support features are coming soon!</strong> We're building a space for pet owners and volunteers to connect.
            </AlertDescription>
          </Alert>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">
              Coming Soon: PetNexus Community
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A place where West Virginia pet owners, volunteers, and animal lovers can connect, share experiences, and help each other.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Discussion Forums</h3>
              <p className="text-slate-400 text-sm">
                Ask questions, share advice, and connect with other pet owners in your area.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Success Stories</h3>
              <p className="text-slate-400 text-sm">
                Share your pet rescue stories and celebrate reunions with the community.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Local Events</h3>
              <p className="text-slate-400 text-sm">
                Find and organize pet adoption events, fundraisers, and meetups in West Virginia.
              </p>
            </div>
          </div>

          {/* What's Available Now */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Available Now</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">For Pet Owners:</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• <Link href="/missing" className="text-blue-400 hover:text-blue-300">Missing Pets Board</Link> - Search and report lost pets</li>
                  <li>• <Link href="/sighting/report" className="text-blue-400 hover:text-blue-300">Report a Sighting</Link> - Help find lost pets</li>
                  <li>• <Link href="/emergency-contacts" className="text-blue-400 hover:text-blue-300">Emergency Contacts</Link> - 24/7 help when you need it</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">For Volunteers:</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• <Link href="/volunteers/register" className="text-blue-400 hover:text-blue-300">Volunteer Registration</Link> - Join our response team</li>
                  <li>• <Link href="/admin/pigpig" className="text-blue-400 hover:text-blue-300">Moderator Console</Link> - Help manage cases</li>
                  <li>• Dispatch notifications for rescue missions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stay Updated */}
          <div className="text-center p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-slate-400 mb-6">
              Be the first to know when community features launch. Sign up for updates below.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Button className="bg-purple-600 hover:bg-purple-700">
                Notify Me
              </Button>
            </div>
          </div>

          {/* Back to Resources */}
          <div className="mt-8 text-center">
            <Link href="/resources">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                ← Back to All Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
