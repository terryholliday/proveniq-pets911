'use client';

/**
 * Zero Tolerance Section - "Ending the Desperation Economy"
 * 
 * Landing page section showcasing the ANTI_FRAUD_LOCKER_V2 features.
 * Matches the screenshot design exactly.
 */

import React from 'react';
import { MessageSquare, Camera, AlertTriangle, Shield } from 'lucide-react';
import { AntiFraudTerminal, ProtectionLevelBadge, AntiFraudFeatureCard } from './AntiFraudTerminal';

export function ZeroToleranceSection() {
  return (
    <section className="relative py-20 bg-[#0a0a0a] overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4">
        {/* Zero Tolerance Badge */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-full">
            Zero Tolerance
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Main Headline */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Ending the
              </h2>
              <h2 className="text-4xl md:text-5xl font-bold text-red-500">
                Desperation Economy.
              </h2>
            </div>

            {/* Description */}
            <div className="space-y-4 text-gray-400 max-w-lg">
              <p>
                Scammers prey on people in their worst moments. They scrape 
                phone numbers from posters, demand ransoms, and sell false hope.
              </p>
              <p>
                petmayday destroys this business model by removing the{' '}
                <span className="text-white font-semibold">opportunity</span> to scam.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6 pt-4">
              {/* Identity-Verified Communication */}
              <AntiFraudFeatureCard
                icon={<MessageSquare className="w-5 h-5 text-pink-400" />}
                title="Identity-Verified Communication"
                description="No anonymous texts. All communication flows through our secure, monitored relay. If they can't verify their identity, they can't message you."
              />

              {/* Proof of Life Protocol */}
              <AntiFraudFeatureCard
                icon={<Camera className="w-5 h-5 text-red-400" />}
                title='The "Proof of Life" Protocol'
                description='Our system demands metadata-verified photos (time + location stamped) before a "Found" claim can be submitted. No stock photos. No vague threats.'
              />

              {/* Ransomware Detection */}
              <AntiFraudFeatureCard
                icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
                title="Ransomware Detection"
                description='AI analysis flags common scam scripts ("I have your dog, send money via Zelle") and auto-bans the actor instantly across the entire network.'
              />
            </div>
          </div>

          {/* Right Column - Terminal Display */}
          <div className="space-y-6">
            <AntiFraudTerminal animated={true} />
            
            {/* Protection Level Badge */}
            <div className="flex justify-center">
              <ProtectionLevelBadge />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ZeroToleranceSection;
