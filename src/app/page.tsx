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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Siren className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Pet911</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#crisis" className="hover:text-primary transition-colors">The Crisis</a>
            <a href="#protocol" className="hover:text-primary transition-colors">The Protocol</a>
            <a href="#features" className="hover:text-primary transition-colors">Capabilities</a>
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
            <a href="#compliance" className="hover:text-primary transition-colors">Trust</a>
          </nav>
          <div className="flex items-center gap-4">
            {showHiddenLinks && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/admin/pigpig">Mod Console</Link>
              </Button>
            )}
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
                  href="#crisis"
                  className="inline-flex items-center justify-center h-14 px-8 bg-red-600 text-white font-bold text-lg rounded-md transition-all hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" /> Report Emergency
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

        {/* Tiered Escalation */}
        <section className="py-24 bg-zinc-950 text-white border-y border-zinc-800" id="escalation">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-yellow-500/50 text-yellow-500">Rapid Response Grid</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                  Tiered Escalation
                </h2>
                <p className="text-xl text-zinc-400 mb-8">
                  Not every missing pet is an emergency, but some are life-or-death.
                  Our system automatically escalates incidents based on risk factors (weather, injury, traffic).
                </p>

                <div className="space-y-6 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-zinc-800"></div>

                  {/* Tier 1 */}
                  <div className="relative pl-16">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-zinc-500">1</div>
                    <h3 className="text-lg font-bold text-white mb-1">Tier 1: Neighborhood Watch</h3>
                    <p className="text-sm text-zinc-500">
                      Routine sightings. Safe location.
                      <span className="block mt-1 text-zinc-400">→ Alerts nearby app users (10mi radius).</span>
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className="relative pl-16">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-yellow-900/20 border border-yellow-500/30 flex items-center justify-center font-bold text-yellow-500">2</div>
                    <h3 className="text-lg font-bold text-white mb-1">Tier 2: Tactical Alert</h3>
                    <p className="text-sm text-zinc-500">
                      Confirmed match or vulnerable animal.
                      <span className="block mt-1 text-yellow-500/90">→ Notifies Animal Control & Local Vets directly.</span>
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="relative pl-16">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-red-900/20 border border-red-500 flex items-center justify-center font-bold text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]">3</div>
                    <h3 className="text-lg font-bold text-red-500 mb-1">Tier 3: Emergency Broadcast</h3>
                    <p className="text-sm text-zinc-500">
                      Severe injury, traffic hazard, or extreme weather.
                      <span className="block mt-1 text-red-400 font-medium">→ Full Grid Activation: Police, Fire, ER Vets, & All Users.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-full flex items-center justify-center">
                {/* Visual of concentric circles or radar expanding */}
                <div className="relative w-full aspect-square max-w-md">
                  <div className="absolute inset-0 bg-red-500/5 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 bg-red-500/10 rounded-full animate-pulse delay-75"></div>
                  <div className="absolute inset-8 bg-red-500/15 rounded-full animate-pulse delay-150"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Signal className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <div className="bg-zinc-900/90 border border-red-500/50 px-4 py-2 rounded text-red-500 font-mono text-sm shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                        ALERT_LEVEL: CRITICAL
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Matrix */}
        <section className="py-24 bg-zinc-950 text-white" id="features">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tactical Advantages</h2>
              <p className="text-zinc-400">Why emergency services trust Pet911.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm text-muted-foreground">Public PWA for rapid reporting, location tagging, and symptom checking.</p>
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
                <p className="text-sm text-muted-foreground">Emergency stabilization alerts. Microchip registry lookup. Medical hold status.</p>
              </motion.div>
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
            <p className="mb-4">© 2026 PROVENIQ Foundation. All rights reserved.</p>
            <div className="flex justify-center gap-8">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-white transition-colors">Canonical Law</a>
            </div>
          </div>
        </footer>
      </main>
    </div >
  );
}
