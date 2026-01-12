"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users2,
  Zap,
  Globe,
  HeartHandshake,
  AlertTriangle,
  Wifi,
  Database,
  LifeBuoy,
  Check,
  X,
  Clock,
  Smartphone,
  Map,
  Share2,
  UserCircle,
  Home,
  Heart,
  Mic,
  Shield,
  Siren,
  Radio,
  Signal,
  MapPin,
  Search,
  WifiOff,
  CheckCircle2
} from "lucide-react";

function ThankYouBanner() {
  // Simplified strictly for visual demo if needed, or remove if no param logic
  return null;
}

export default function Pet911Home() {
  const [showHiddenLinks, setShowHiddenLinks] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleEasterEggClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 500) {
      clickCountRef.current = 0;
    }
    lastClickTimeRef.current = now;
    clickCountRef.current += 1;

    if (clickCountRef.current >= 3) {
      setShowHiddenLinks(true);
      clickCountRef.current = 0;
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={handleEasterEggClick}>
            <img
              src="/icon-pet-profiles.ico"
              alt="Pet911 Logo"
              className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            />
            <span className="text-xl font-bold tracking-tight">Pet911</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#crisis" className="hover:text-primary transition-colors">The Crisis</a>
            <a href="#protocol" className="hover:text-primary transition-colors">The Protocol</a>
            <a href="#features" className="hover:text-primary transition-colors">Capabilities</a>
            <a href="#preregister" className="hover:text-primary transition-colors">Pre-Register</a>
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
            <a href="#compliance" className="hover:text-primary transition-colors">Trust</a>
            <Link href="/advocacy" className="hover:text-amber-500 transition-colors text-amber-400">B.A.R.K. Act</Link>
          </nav>
          <div className="flex items-center gap-4">
            {showHiddenLinks && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <a href="https://lostpets911.org/admin/mods" target="_blank" rel="noreferrer noopener">Mod Console</a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/login?redirectTo=/admin/sysop">Staff Login</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/volunteer/apply">Volunteer Apply</Link>
            </Button>
            <Button size="sm" className="gradient-amber text-zinc-900 font-bold border-none hover:opacity-90 transition-opacity" asChild>
              <Link href="https://lostpets911.org">Launch App</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-red-600/10 blur-[120px] rounded-full translate-x-1/2" />
          <div className="absolute bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-amber-500/10 blur-[120px] rounded-full -translate-x-1/2" />

          {/* Hero background image */}
          <div className="absolute inset-0 -z-20 opacity-20 mask-image-gradient">
            {/* Placeholder for a topographical map or mountains image typical of WV */}
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80')] bg-cover bg-center" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6 border-red-500/30 text-red-500 py-1 px-4 bg-red-500/5 animate-pulse">
                Live Pilot • West Virginia • Greenbrier & Kanawha Counties
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                Emergency Response <br />
                for Lost Pets.
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                The "Post and Pray" era is over. <br />
                Pet911 coordinates finders, shelters, and vets into a single <span className="text-foreground font-semibold">rapid-response grid</span>.
                <br />
                <span className="text-red-500/90 italic mt-2 block">Offline-First. Verified Matches. Zero False Hope.</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://lostpets911.org"
                  className="inline-flex items-center justify-center h-14 px-8 bg-red-600 text-white font-bold text-lg rounded-md transition-all hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" /> Report Emergency
                </a>
                <a
                  href="https://lostpets911.org"
                  className="inline-flex items-center justify-center h-14 px-8 bg-teal text-zinc-900 font-bold text-lg rounded-md transition-all hover:bg-teal/90 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                >
                  <Smartphone className="mr-2 h-5 w-5" /> Download App
                </a>
                <a
                  href="#protocol"
                  className="inline-flex items-center justify-center h-14 px-8 border border-border bg-background/50 backdrop-blur-sm rounded-md font-medium hover:bg-muted transition-all group"
                >
                  How It Works <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Crisis: "The Panic Gap" */}
        <section className="py-24 bg-muted/30 border-y border-border" id="crisis">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="destructive" className="mb-4">The Problem</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                  The "Panic Gap"
                </h2>
                <p className="text-xl text-muted-foreground mb-6">
                  When a pet goes missing, every second counts.
                  But the current system is a fragmented mess of social media posts, telephone tag, and closed doors.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      trigger: "Scattered Signals",
                      consequence: "Facebook, Nextdoor, Craigslist, Ring... Moderators can't check them all."
                    },
                    {
                      trigger: "Stale Intelligence",
                      consequence: "Search parties chasing a sighting from 48 hours ago."
                    },
                    {
                      trigger: "Dangerous Encounters",
                      consequence: "Public meeting strangers in unverified locations."
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-lg bg-background border border-border">
                      <AlertTriangle className="text-orange-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{item.trigger}</p>
                        <p className="text-muted-foreground">→ {item.consequence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                {/* Visual representation */}
                <div className="aspect-square rounded-3xl bg-zinc-900 border border-border relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8">
                    <h3 className="text-2xl font-bold mb-2">The Result?</h3>
                    <p className="text-4xl font-black text-white mb-4">False Hope.</p>
                    <p className="text-muted-foreground max-w-sm">
                      Owners grieve while their pet sits in a shelter 10 miles away, mislabeled and unseen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution: Protocol */}
        <section className="py-24 px-4" id="protocol">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">The Solution</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Structured Response.</h2>
              <p className="text-xl text-muted-foreground">
                We replaced "Post and Pray" with a military-grade triage protocol.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Social Chaos */}
              <div className="p-8 rounded-2xl border border-destructive/20 bg-destructive/5 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-destructive opacity-10 font-black text-6xl">CHAOS</div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <X className="text-destructive" /> Social Chaos
                </h3>
                <div className="space-y-4 font-mono text-sm max-w-md mx-auto">
                  <div className="p-4 bg-background rounded border border-border opacity-50 relative">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full absolute -left-4 -top-2 flex items-center justify-center text-xs">?</div>
                    "Has anyone seen Fluffy?" <span className="text-xs text-muted-foreground block mt-1">Found on FB Local Group</span>
                  </div>
                  <div className="h-8 border-l-2 border-dashed border-border mx-8 opacity-30"></div>
                  <div className="p-4 bg-background rounded border border-border opacity-50 relative">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full absolute -left-4 -top-2 flex items-center justify-center text-xs">?</div>
                    "I think I saw him!" <span className="text-xs text-muted-foreground block mt-1">Comment on Nextdoor (2 days later)</span>
                  </div>
                  <div className="h-8 border-l-2 border-dashed border-border mx-8 opacity-30"></div>
                  <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded relative">
                    <div className="w-8 h-8 bg-destructive text-white rounded-full absolute -left-4 -top-2 flex items-center justify-center text-xs">!</div>
                    RESULT: Lead is cold. Pet lost.
                  </div>
                </div>
              </div>

              {/* Pet911 Protocol */}
              <div className="p-8 rounded-2xl border border-teal/20 bg-teal/5 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-teal opacity-10 font-black text-6xl">ORDER</div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-teal" /> Pet911 Protocol
                </h3>
                <div className="space-y-4 font-mono text-sm max-w-md mx-auto">
                  <div className="p-4 bg-background rounded border border-border font-bold relative">
                    <div className="w-8 h-8 bg-teal text-black rounded-full absolute -left-4 -top-2 flex items-center justify-center shadow-lg shadow-teal/50">1</div>
                    Finder Scans Location + Photo
                  </div>
                  <div className="h-8 border-l-2 border-teal mx-8"></div>
                  <div className="p-4 bg-background rounded border border-border font-bold relative">
                    <div className="w-8 h-8 bg-teal text-black rounded-full absolute -left-4 -top-2 flex items-center justify-center shadow-lg shadow-teal/50">2</div>
                    AI + Mod Verify Safety & Injury
                  </div>
                  <div className="h-8 border-l-2 border-teal mx-8"></div>
                  <div className="p-4 bg-teal/20 border border-teal/50 text-foreground font-bold rounded relative shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                    <div className="w-8 h-8 bg-teal text-black rounded-full absolute -left-4 -top-2 flex items-center justify-center shadow-lg shadow-teal/50">3</div>
                    ROUTED TO ER VET / SHELTER
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tiered Escalation - Matching Decision Matrix Spec */}
        <section className="py-24 bg-zinc-950 text-white border-y border-zinc-800" id="escalation">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 border-yellow-500/50 text-yellow-500">Alert Decision Matrix</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                6-Tier Escalation Protocol
              </h2>
              <p className="text-xl text-zinc-400">
                Not every missing pet is an emergency, but some are life-or-death.
                Our system uses <span className="text-white font-semibold">deterministic rules</span>—not emotion—to decide who gets alerted, by what channel, at what radius, and when.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Left Column - Tiers 0-2 */}
              <div className="space-y-4">
                {/* T0: Draft */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-500 text-sm shrink-0">T0</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-zinc-400 mb-1">Draft</h3>
                      <p className="text-sm text-zinc-500 mb-2">Case created but incomplete. No alerts sent.</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-zinc-800 rounded">Channels: None</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">Gate: Data completeness required</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* T1: Local */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/50 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">T1</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-400 mb-1">Local Alert</h3>
                      <p className="text-sm text-zinc-500 mb-2">Last Known Location + photo + consent confirmed. Dynamic local radius based on species.</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-900/30 rounded text-blue-300">Push</span>
                        <span className="px-2 py-1 bg-blue-900/30 rounded text-blue-300">Shelter Console</span>
                        <span className="px-2 py-1 bg-blue-900/30 rounded text-blue-300">Email</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">TTL: 2-6 hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* T2: Expanded */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-teal/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal/20 border border-teal/50 flex items-center justify-center font-bold text-teal text-sm shrink-0">T2</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-teal mb-1">Expanded Search</h3>
                      <p className="text-sm text-zinc-500 mb-2">Evidence strength improves OR time threshold reached. Radius expands. SMS unlocked for verified cases.</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-teal/20 rounded text-teal">Push</span>
                        <span className="px-2 py-1 bg-teal/20 rounded text-teal">Shelter Console</span>
                        <span className="px-2 py-1 bg-teal/20 rounded text-teal">SMS (opt)</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded">TTL: 4-12 hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Tiers 3-5 */}
              <div className="space-y-4">
                {/* T3: Responder */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-900/30 border border-yellow-500/50 flex items-center justify-center font-bold text-yellow-400 text-sm shrink-0">T3</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-yellow-400 mb-1">Responder Network</h3>
                      <p className="text-sm text-zinc-500 mb-2">Verified case OR shelter-confirmed. Route-based geofence activates professional responders.</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="px-2 py-1 bg-yellow-900/30 rounded text-yellow-300">USPS</span>
                        <span className="px-2 py-1 bg-yellow-900/30 rounded text-yellow-300">UPS/FedEx</span>
                        <span className="px-2 py-1 bg-yellow-900/30 rounded text-yellow-300">Amazon Flex</span>
                        <span className="px-2 py-1 bg-yellow-900/30 rounded text-yellow-300">Uber/Lyft</span>
                        <span className="px-2 py-1 bg-yellow-900/30 rounded text-yellow-300">Municipal Staff</span>
                      </div>
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs">TTL: 2-8 hrs</span>
                    </div>
                  </div>
                </div>

                {/* T4: Public Display */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-orange-500/30 hover:border-orange-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-900/30 border border-orange-500/50 flex items-center justify-center font-bold text-orange-400 text-sm shrink-0">T4</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-400 mb-1">Public Display Network</h3>
                      <p className="text-sm text-zinc-500 mb-2">High confidence OR crisis scenario. Human review or shelter confirmation required before broadcast.</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="px-2 py-1 bg-orange-900/30 rounded text-orange-300">Gas Station Screens</span>
                        <span className="px-2 py-1 bg-orange-900/30 rounded text-orange-300">Community Kiosks</span>
                        <span className="px-2 py-1 bg-orange-900/30 rounded text-orange-300">Digital Billboards</span>
                        <span className="px-2 py-1 bg-orange-900/30 rounded text-orange-300">Ring/IoT</span>
                      </div>
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs">TTL: 2-12 hrs</span>
                    </div>
                  </div>
                </div>

                {/* T5: Regional Crisis */}
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-500 flex items-center justify-center font-bold text-red-400 text-sm shrink-0 animate-pulse">T5</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-400 mb-1">Regional Crisis</h3>
                      <p className="text-sm text-zinc-500 mb-2">Declared disaster, evacuation, or mass displacement. Foundation ops approval required.</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="px-2 py-1 bg-red-900/30 rounded text-red-300">All Channels Active</span>
                        <span className="px-2 py-1 bg-red-900/30 rounded text-red-300">Regional Zones</span>
                        <span className="px-2 py-1 bg-red-900/30 rounded text-red-300">Emergency Services</span>
                      </div>
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs">TTL: Time-bounded by incident</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Inputs */}
            <div className="mt-16 p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-6 text-center">What Drives Each Decision?</h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-400" /> Location & Time
                  </h4>
                  <ul className="space-y-2 text-zinc-500">
                    <li>• <span className="text-zinc-400">Last Known Location</span> (lat/long, accuracy radius)</li>
                    <li>• <span className="text-zinc-400">Time Since Lost</span> (drives tier escalation)</li>
                    <li>• <span className="text-zinc-400">Population/Road Density</span> (urban vs rural)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-400" /> Pet Profile
                  </h4>
                  <ul className="space-y-2 text-zinc-500">
                    <li>• <span className="text-zinc-400">Species</span> (dogs expand faster, cats slower)</li>
                    <li>• <span className="text-zinc-400">Behavior</span> (indoor-only, flight risk, bite history)</li>
                    <li>• <span className="text-zinc-400">Risk Profile</span> (age, medical needs, meds required)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-teal" /> Evidence & Trust
                  </h4>
                  <ul className="space-y-2 text-zinc-500">
                    <li>• <span className="text-zinc-400">Evidence Strength</span> (photos, microchip, distinctive marks)</li>
                    <li>• <span className="text-zinc-400">Sighting Signals</span> (count, clustering, recency)</li>
                    <li>• <span className="text-zinc-400">Fraud Detection</span> (account age, device reputation)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Known Before Lost - Pre-Registration */}
        <section className="py-24 bg-muted/30 border-y border-border" id="preregister">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-green-500/50 text-green-500">Preparation, Not Panic</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                  Known Before Lost
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  The best time to register your pet is <span className="text-foreground font-semibold">before</span> they go missing.
                  Our 9-step pre-registration flow captures everything needed for rapid recovery.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { step: "1-2", label: "Owner Info", desc: "Contact, location, county" },
                    { step: "3-4", label: "Pet Identity", desc: "Species, breed, size, sex" },
                    { step: "5-6", label: "Visual Profile", desc: "3 photos + distinctive marks" },
                    { step: "7", label: "Behavior Flags", desc: "Flight risk, collar, recall" },
                    { step: "8", label: "Microchip", desc: "Registry linkage" },
                    { step: "9", label: "Identity Graph", desc: "Anchored & ready" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-background border border-border text-center">
                      <div className="text-xs text-muted-foreground mb-1">Step {item.step}</div>
                      <div className="font-semibold text-sm text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground"><strong className="text-foreground">3 Required Photos:</strong> Full body, face close-up, unique feature</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Behavior Flags:</strong> "May bolt if chased," "Friendly to strangers"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Save-As-You-Go:</strong> Progress persists automatically</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 text-xs text-zinc-500">Pet Pre-Registration</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-teal rounded-full"></div>
                    </div>
                    <p className="text-xs text-zinc-500 text-center">Step 6 of 9: Behavior & Collar</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-800">
                        <div className="w-4 h-4 rounded border-2 border-teal bg-teal/20"></div>
                        <span className="text-sm text-zinc-300">May bolt if chased</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-800">
                        <div className="w-4 h-4 rounded border-2 border-zinc-600"></div>
                        <span className="text-sm text-zinc-400">Comes when called</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-800">
                        <div className="w-4 h-4 rounded border-2 border-teal bg-teal/20"></div>
                        <span className="text-sm text-zinc-300">Wears collar with tags</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Matrix - Expanded */}
        <section className="py-24 bg-zinc-950 text-white" id="features">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tactical Advantages</h2>
              <p className="text-zinc-400">Why emergency services trust Pet911.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-red-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <WifiOff className="h-12 w-12 text-red-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-3 text-white">Offline-First</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Built for the hollers of West Virginia. No signal? No problem. Reports queue locally and sync automatically when connection restores.
                </p>
              </div>
              <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <Shield className="h-12 w-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-3 text-white">Moderator Console</h3>
                <p className="text-zinc-400 leading-relaxed">
                  "Air Traffic Control" for animal welfare. Verified moderators triage cases, filter sensitive images, and coordinate transport.
                </p>
              </div>
              <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <Radio className="h-12 w-12 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-3 text-white">Sighting Intelligence</h3>
                <p className="text-zinc-400 leading-relaxed">
                  AI-driven clustering identifies if three different people reported the same dog from different angles, merging them into one "Incident."
                </p>
              </div>
            </div>

            {/* Geofence Computation */}
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-12">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Map className="h-6 w-6 text-teal" /> Dynamic Geofence Computation
              </h3>
              <p className="text-zinc-400 mb-6">
                Radius is computed as a function of time, species, environment, and sighting clustering. It expands over time but contracts around fresh sightings.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Dog Model</h4>
                  <p className="text-sm text-zinc-500">Faster expansion. Considers road density and travel corridors.</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Cat Model</h4>
                  <p className="text-sm text-zinc-500">Slower expansion. Prioritizes near-home search initially.</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Indoor-Only</h4>
                  <p className="text-sm text-zinc-500">Reduced early radius. Requires strong evidence for public escalation.</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Severe Weather</h4>
                  <p className="text-sm text-zinc-500">Increased urgency. Prefers responder networks over public spam.</p>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-lg bg-teal/10 border border-teal/30">
                <p className="text-sm text-teal">
                  <strong>Sighting-Driven Re-centering:</strong> When multiple sightings cluster around a location, the geofence re-centers on the cluster centroid. Single low-trust reports are ignored. Both original and active geofences persist for auditability.
                </p>
              </div>
            </div>

            {/* 7 Alert Channels */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">7 Alert Channels</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Mobile Push", desc: "Opt-in users, pet owners, community members", gate: "Consent + rate limits", color: "blue" },
                  { name: "SMS", desc: "High-urgency verified cases only", gate: "Verified + strict TTL", color: "green" },
                  { name: "Email", desc: "Low urgency summaries, follow-ups", gate: "Standard consent", color: "zinc" },
                  { name: "Shelter Console", desc: "Operational inbox for shelter staff", gate: "Shelter affiliation", color: "amber" },
                  { name: "Responder Network", desc: "USPS, UPS, FedEx, Uber, Lyft, municipal", gate: "Verified + partner contract", color: "yellow" },
                  { name: "Public Displays", desc: "Gas stations, kiosks, digital billboards", gate: "Human review required", color: "orange" },
                  { name: "Camera/IoT", desc: "Ring-style ecosystems, smart cameras", gate: "Partner permissioning", color: "purple" },
                ].map((channel, idx) => {
                  let borderColorClass = "";
                  let textColorClass = "";

                  switch (channel.color) {
                    case "blue":
                      borderColorClass = "border-blue-500/30 hover:border-blue-500/50";
                      textColorClass = "text-blue-400";
                      break;
                    case "green":
                      borderColorClass = "border-green-500/30 hover:border-green-500/50";
                      textColorClass = "text-green-400";
                      break;
                    case "zinc":
                      borderColorClass = "border-zinc-500/30 hover:border-zinc-500/50";
                      textColorClass = "text-zinc-400";
                      break;
                    case "amber":
                      borderColorClass = "border-amber-500/30 hover:border-amber-500/50";
                      textColorClass = "text-amber-400";
                      break;
                    case "yellow":
                      borderColorClass = "border-yellow-500/30 hover:border-yellow-500/50";
                      textColorClass = "text-yellow-400";
                      break;
                    case "orange":
                      borderColorClass = "border-orange-500/30 hover:border-orange-500/50";
                      textColorClass = "text-orange-400";
                      break;
                    case "purple":
                      borderColorClass = "border-purple-500/30 hover:border-purple-500/50";
                      textColorClass = "text-purple-400";
                      break;
                    default:
                      borderColorClass = "border-zinc-800";
                      textColorClass = "text-foreground";
                  }

                  return (
                    <div key={idx} className={`p-4 rounded-lg bg-zinc-900 border transition-colors ${borderColorClass}`}>
                      <h4 className={`font-semibold mb-1 ${textColorClass}`}>{channel.name}</h4>
                      <p className="text-xs text-zinc-500 mb-2">{channel.desc}</p>
                      <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">{channel.gate}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The Anti-Fraud Locker */}
            <section className="py-24 bg-red-950/10 border-y border-red-900/20" id="safety">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1">
                    <Badge variant="destructive" className="mb-4 bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30">Zero Tolerance</Badge>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                      Ending the<br />
                      <span className="text-red-500">Desperation Economy.</span>
                    </h2>
                    <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
                      Scammers prey on people in their worst moments. They scrape phone numbers from posters, demand ransoms, and sell false hope.
                    </p>
                    <p className="text-lg text-zinc-400 mb-8">
                      Pet911 destroys this business model by removing the <em className="text-white not-italic">opportunity</em> to scam.
                    </p>

                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">Identity-Verified Communication</h4>
                          <p className="text-zinc-400 text-sm">
                            No anonymous texts. All communication flows through our secure, monitored relay. If they can't verify their identity, they can't message you.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <UserCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">The "Proof of Life" Protocol</h4>
                          <p className="text-zinc-400 text-sm">
                            Our system demands metadata-verified photos (time + location stamped) before a "Found" claim can be submitted. No stock photos. No vague threats.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">Ransomware Detection</h4>
                          <p className="text-zinc-400 text-sm">
                            AI analysis flags common scam scripts ("I have your dog, send money via Zelle") and auto-bans the actor instantly across the entire network.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 relative">
                    {/* Visual: The Locker */}
                    <div className="relative rounded-2xl border border-red-900/50 bg-black/50 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />

                      <div className="relative p-8">
                        <div className="flex items-center justify-between border-b border-red-900/30 pb-4 mb-6">
                          <div className="flex items-center gap-2 text-red-500 font-mono text-sm">
                            <Shield className="h-4 w-4" />
                            <span>ANTI_FRAUD_LOCKER_V2</span>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-red-900 rounded-full" />
                          </div>
                        </div>

                        <div className="space-y-4 font-mono text-xs md:text-sm">
                          {/* Simulated System Log */}
                          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-red-400">
                            <span className="opacity-50">[10:42:15]</span> INCOMING_MSG_BLOCKED<br />
                            <span className="text-white">Reason:</span> Suspicious Pattern Match (Cash Demand)<br />
                            <span className="text-white">Action:</span> USER_BAN + IP_BLACKLIST
                          </div>

                          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded text-zinc-400">
                            <span className="opacity-50">[10:42:16]</span> AUDIT_LOG_ENTRY<br />
                            Report #88219 preserved. Owner notified of blocked attempt.
                          </div>

                          <div className="p-3 bg-green-950/20 border border-green-900/30 rounded text-green-400">
                            <span className="opacity-50">[10:45:00]</span> VERIFIED_MATCH<br />
                            <span className="text-white">Source:</span> Shelter Partner (Kanawha)<br />
                            <span className="text-white">Metadata:</span> GPS_MATCH + CHIP_SCAN<br />
                            <span className="text-white">Status:</span> <strong>REUNITE_PENDING</strong>
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-red-900/30 text-center">
                          <p className="text-zinc-500 text-xs mb-2">PROTECTION LEVEL</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            <ShieldCheck className="h-4 w-4" />
                            MILITARY-GRADE
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Ecosystem */}
        <section className="py-24 bg-muted/30 border-y border-border" id="ecosystem">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">The Network</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Unified Command</h2>
              <p className="text-xl text-muted-foreground">
                Everyone plays a role, but they play from the same sheet of music.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {/* Finder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Finder App</h3>
                <p className="text-sm text-muted-foreground">Public PWA for rapid reporting, location tagging, and photo submission. Works offline.</p>
              </motion.div>

              {/* Owner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Owner Portal</h3>
                <p className="text-sm text-muted-foreground">Secure lost report filing. Proof of ownership verification. Notification center.</p>
              </motion.div>

              {/* Shelter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Shelter Console</h3>
                <p className="text-sm text-muted-foreground">Intake prioritization. Automatic matching with lost reports. Custody tracking.</p>
              </motion.div>

              {/* Vet */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <HeartHandshake className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Vet Network</h3>
                <p className="text-sm text-muted-foreground">Trusted confirmation points. Microchip registry lookup. Medical hold status.</p>
              </motion.div>
            </div>

            {/* Detailed Vet Section */}
            <div className="p-8 rounded-2xl bg-green-950/10 border border-green-500/20">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4 border-green-500/50 text-green-500">Veterinary Partners</Badge>
                  <h3 className="text-2xl font-bold mb-4">Why Vets Are Central to Pet911</h3>
                  <p className="text-muted-foreground mb-6">
                    Veterinarians are trusted confirmation points. Lost pets often arrive at clinics without context.
                    Pet911 replaces fragmented social media chaos with one verified, structured case per lost pet.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Lost pet cases visible</span>
                        <span className="text-muted-foreground"> - See current local lost-pet cases (opt-in)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Faster resolution</span>
                        <span className="text-muted-foreground"> - Confirm or resolve cases directly</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Fewer frantic calls</span>
                        <span className="text-muted-foreground"> - Owners stop calling every clinic individually</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Minimal data sharing</span>
                        <span className="text-muted-foreground"> - No medical records stored or requested</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-background border border-border">
                  <h4 className="font-bold mb-4 text-center">What Pet911 Does NOT Ask of Vets</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <X className="h-5 w-5 text-red-500 shrink-0" />
                      <span className="text-sm">No requirement to treat animals differently</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <X className="h-5 w-5 text-red-500 shrink-0" />
                      <span className="text-sm">No diagnostic responsibility</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <X className="h-5 w-5 text-red-500 shrink-0" />
                      <span className="text-sm">No constant notifications</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <X className="h-5 w-5 text-red-500 shrink-0" />
                      <span className="text-sm">No patient data sharing beyond what is appropriate</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">Participation is opt-in and limited.</p>
                </div>
              </div>
            </div>

            {/* What Pet911 Is NOT */}
            <div className="mt-12 p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-6 text-center">What Pet911 Is NOT</h3>
              <p className="text-center text-zinc-400 mb-6">Pet911 is a lost-and-found and reunification system for pets. It is explicitly <strong className="text-white">NOT</strong>:</p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                  <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">A veterinary triage or diagnosis system</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                  <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">A replacement for emergency veterinary care</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                  <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">A replacement for 911 or emergency dispatch</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                  <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">A crowdsourced "panic alert" app</p>
                </div>
              </div>
              <p className="text-center text-zinc-500 text-sm mt-6">Pet911 does not give medical advice, assess injuries, or direct treatment decisions.</p>
            </div>
          </div>
        </section>



        {/* AI Support Counselor */}
        <section className="py-24 bg-zinc-900/30 border-y border-zinc-800" id="counselor">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Chat UI Mockup */}
                <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <HeartHandshake className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Pet Crisis Companion</p>
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm font-medium">
                    <div className="bg-indigo-500/10 text-indigo-200 p-3 rounded-bl-none rounded-2xl border border-indigo-500/20 max-w-[85%]">
                      I hear how devastating this is. You aren't alone in this feeling. Are you keeping yourself safe right now?
                    </div>
                    <div className="bg-zinc-800 text-zinc-300 p-3 rounded-br-none rounded-2xl ml-auto max-w-[85%]">
                      It just hurts so much. I don't know what to do.
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-200 p-3 rounded-bl-none rounded-2xl border border-indigo-500/20 max-w-[85%]">
                      That pain is valid. We can take this one breath at a time. I'm here.
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-2">
                    <div className="h-2 w-2 bg-zinc-700 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-zinc-700 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-zinc-700 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <Badge variant="outline" className="mb-4 border-indigo-500/50 text-indigo-400">Bishop Protocol Enabled</Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Emotional First Aid.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Losing a pet is a trauma. Our AI Support Counselor is trained in <strong>Pet Loss Grief</strong> and <strong>Crisis Intervention</strong>.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Suicide & Crisis Guardrails</span>
                      <span className="text-muted-foreground text-sm">Detects intent, active risk, and distress markers, auto-escalating to human lifelines when needed.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Grief Paralysis Support</span>
                      <span className="text-muted-foreground text-sm">Helps users paralyzed by shock to take the next necessary step for their pet.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Traumatic Loss Navigation</span>
                      <span className="text-muted-foreground text-sm">Specialized workflows for sudden tragedy, euthanasia decisions, and unknown outcomes.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Compliance */}
        <section className="py-24 px-4 relative overflow-hidden" id="compliance">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4">Trust & Safety</Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Fail-Closed Privacy.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  We protect the finders and the owners. Matches are only revealed when confirmed by a certified moderator.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>No public address publishing for finders</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>"False Hope" Prevention Protocols</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>Immutable Audit Logs for Custody</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
                <h3 className="font-mono text-sm text-zinc-500 mb-4 border-b border-zinc-800 pb-2">SYSTEM_STATUS: <span className="text-green-500">OPERATIONAL</span></h3>
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Region</span>
                    <span className="text-white">US-WV-PILOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Uptime</span>
                    <span className="text-white">99.98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Active Incidents</span>
                    <span className="text-green-400">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Reunites (TYD)</span>
                    <span className="text-blue-400">142</span>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
                  <p className="text-xs text-zinc-500 mb-2">Powered by</p>
                  <span className="text-lg font-bold tracking-tight text-white/50">PROVENIQ</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-zinc-950 border-t border-zinc-900 text-center text-sm text-zinc-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="mb-4">© 2026 PROVENIQ Foundation. All rights reserved. <span className="text-zinc-700 ml-2">v0.1.1 (Build Jan 10)</span></p>
            <div className="flex justify-center gap-8 mb-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-white transition-colors">Canonical Law</a>
            </div>
            <div className="flex justify-center gap-8 border-t border-zinc-800 pt-4">
              <Link href="/advocacy" className="hover:text-amber-400 transition-colors">🐕 B.A.R.K. Act</Link>
              <Link href="/training" className="hover:text-white transition-colors">Training Center</Link>
              <Link href="/admin/mods" className="hover:text-white transition-colors">Moderator Access</Link>
              <Link href="/admin/sysop" className="hover:text-white transition-colors">SYSOP Admin</Link>
            </div>
          </div>
        </footer>
      </main>
    </div >
  );
}
