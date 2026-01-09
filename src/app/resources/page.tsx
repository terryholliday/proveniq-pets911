import Link from 'next/link';
import { Heart, BookOpen, Phone, Shield, Users, AlertTriangle } from 'lucide-react';

export default function ResourcesPage() {
  const resources = [
    {
      title: 'Emergency Contacts',
      description: '24/7 emergency vets, animal control, and 911',
      icon: Phone,
      href: '/emergency-contacts',
      color: 'bg-red-500'
    },
    {
      title: 'Lost Pet Guide',
      description: 'View and search the Missing Pets Board for lost pets in your area',
      icon: BookOpen,
      href: '/missing',
      color: 'bg-blue-500'
    },
    {
      title: 'Safety Tips',
      description: 'Keep your pets safe with our comprehensive safety guide',
      icon: Shield,
      href: '/help/safety',
      color: 'bg-green-500'
    },
    {
      title: 'Community Support',
      description: 'Connect with other pet owners and volunteers',
      icon: Users,
      href: '/support',
      color: 'bg-purple-500'
    },
    {
      title: 'Report Sighting',
      description: 'Report a found or lost pet sighting',
      icon: AlertTriangle,
      href: '/sighting/report',
      color: 'bg-orange-500'
    },
    {
      title: 'About PetNexus',
      description: 'Learn more about our mission and services',
      icon: Heart,
      href: '/about',
      color: 'bg-pink-500'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <span className="font-bold text-white">PetNexus Pet911</span>
            </div>
            <Link
              href="/"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">
              Pet Resources & Support
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to keep your pets safe and find help when you need it most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Link
                  key={index}
                  href={resource.href}
                  className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
                >
                  <div className={`w-12 h-12 ${resource.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn more
                    <span>→</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Need Immediate Help?</h2>
            <p className="text-slate-400 mb-6">
              If you have an emergency with an injured or lost pet, don't wait. Get immediate assistance from our emergency response team.
            </p>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
              Get Emergency Help
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
