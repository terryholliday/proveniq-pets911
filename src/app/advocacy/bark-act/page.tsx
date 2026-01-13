'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BARKActPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'legislation' | 'faq' | 'reform'>('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-900/40 to-green-900/40 border-b border-amber-700">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link href="/advocacy" className="text-amber-400 text-sm hover:underline">← Back to Advocacy</Link>
          <h1 className="text-4xl font-bold mt-4">🐕 B.A.R.K. Act</h1>
          <p className="text-xl text-zinc-300 mt-2">Breeder Accountability and Regulation for Kindness Act</p>
          <p className="text-sm text-zinc-400 mt-1">West Virginia Code Chapter 19, Article 36</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex space-x-1 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('legislation')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'legislation'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Full Legislation
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'faq'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('reform')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reform'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Reform Agenda
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📋 What is the BARK Act?</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                The Breeder Accountability and Regulation for Kindness (BARK) Act is comprehensive legislation 
                that would reform canine welfare in West Virginia. It addresses four critical areas:
              </p>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>Inadequate oversight</strong> of breeding operations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>Consumer deception</strong> and downstream shelter costs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>Weak traceability</strong> and reunification systems for lost dogs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span><strong>Harms associated</strong> with continuous tethering</span>
                </li>
              </ul>
            </div>

            {/* Key Provisions */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🎯 Key Provisions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">🏠 Finder Safe Harbor</h3>
                  <p className="text-sm text-zinc-300">
                    14-day protection for Good Samaritans who help stray animals
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">📱 Digital Notifications</h3>
                  <p className="text-sm text-zinc-300">
                    24-hour online posting of impounded animals
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">🤝 Regional Authorities</h3>
                  <p className="text-sm text-zinc-300">
                    Allows counties to pool resources for animal control
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">✅ Breeder Licensing</h3>
                  <p className="text-sm text-zinc-300">
                    Universal licensing with welfare standards
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">🔍 Microchip Scanning</h3>
                  <p className="text-sm text-zinc-300">
                    Required at intake to reunite lost pets faster
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-400 mb-2">⛓️ Anti-Tethering</h3>
                  <p className="text-sm text-zinc-300">
                    Restricts harmful continuous tethering practices
                  </p>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">⚙️ How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-600 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">Universal Breeder Licensing</h3>
                    <p className="text-sm text-zinc-400">
                      All breeders must obtain a license, with tiered fees based on operation size. 
                      The system is self-funding through license fees and penalties.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-600 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">Regular Inspections</h3>
                    <p className="text-sm text-zinc-400">
                      Unannounced inspections based on tier level with standardized evidence packs 
                      and public letter grades (A-D).
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-600 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">Consumer Protection</h3>
                    <p className="text-sm text-zinc-400">
                      Mandatory microchipping, health certificates, and disclosure requirements 
                      protect buyers from puppy mills.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-600 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold mb-1">Modern Animal Control</h3>
                    <p className="text-sm text-zinc-400">
                      Digital posting requirements and regional authorities help rural communities 
                      improve animal welfare services.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-amber-900/30 to-green-900/30 border border-amber-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📣 Take Action</h2>
              <p className="text-zinc-300 mb-6">
                The BARK Act needs your support to become law. Contact your legislators today and 
                ask them to co-sponsor this important animal welfare legislation.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/advocacy"
                  className="bg-amber-600 hover:bg-amber-700 text-black font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Find Your Legislators
                </Link>
                <Link
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('faq');
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Learn More (FAQ)
                </Link>
                <Link
                  href="#legislation"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('legislation');
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Read Full Text
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legislation' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📜 Full Legislation Text</h2>
              <p className="text-sm text-zinc-400 mb-6">
                West Virginia Code Chapter 19, Article 36 - Breeder Accountability and Regulation for Kindness Act
              </p>
              
              <div className="bg-zinc-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
{`WEST VIRGINIA LEGISLATURE
2026 REGULAR SESSION
HOUSE BILL No. ____
(By Delegate ________________)

A BILL to amend the Code of West Virginia, 1931, as amended, by adding thereto a new article,
designated §19-36-1 through §19-36-55, all relating to comprehensive canine welfare reform;
creating the Breeder Accountability and Regulation for Kindness Act;

Be it enacted by the Legislature of West Virginia:

CHAPTER 19. AGRICULTURE.
ARTICLE 36. BREEDER ACCOUNTABILITY AND REGULATION FOR KINDNESS ACT.

§19-36-1. Short title.
This article may be cited as the "Breeder Accountability and Regulation for Kindness Act" or the "BARK Act".

§19-36-2. Legislative findings and purpose.
The Legislature hereby finds and declares:
(a) The health and welfare of dogs bred and sold within this state is a matter of significant public concern...
(b) Unregulated large-scale commercial breeding operations contribute to animal suffering...
(c) Existing regulatory frameworks have proven insufficient to address these concerns...
(d) A comprehensive regulatory approach that includes universal breeder licensing is necessary...

[Continue with full text...]
`}
                </pre>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  This is a summary. For the complete legislation, download the full document.
                </p>
                <a
                  href="/BARK_Act_v13_FINAL_WV.docx"
                  download
                  className="bg-amber-600 hover:bg-amber-700 text-black text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  📥 Download Full Document
                </a>
              </div>
            </div>

            {/* Key Sections */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">📑 Key Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-1</span>
                  <span>Short Title</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-2</span>
                  <span>Legislative Findings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-3</span>
                  <span>Definitions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-6</span>
                  <span>License Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-11</span>
                  <span>Maximum Breeding Dogs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-14</span>
                  <span>Mandatory Inspections</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-15</span>
                  <span>Housing and Care Standards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-17</span>
                  <span>Microchip Requirements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-44</span>
                  <span>Intake Scanning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-46</span>
                  <span>Finder Protections</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-47</span>
                  <span>Tethering Restrictions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">§19-36-50</span>
                  <span>Joint Authorities</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">❓ Frequently Asked Questions</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Plain-language overview of the BARK Act (non-legal summary)
              </p>

              {/* FAQ Categories */}
              <div className="space-y-6">
                {/* Quick Orientation */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Quick Orientation</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is this FAQ?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        This is a plain-language overview of the draft West Virginia "Breeder Accountability and 
                        Regulation for Kindness Act" (the "BARK Act"). It is not legal advice and does not 
                        replace the bill text or agency rules.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What problems is the bill trying to solve?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The bill targets: (1) inadequate oversight of breeding operations, (2) consumer deception 
                        and downstream shelter costs, (3) weak traceability and reunification systems for 
                        lost/impounded dogs, and (4) harms associated with continuous tethering.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What are the biggest changes, at a glance?
                      </summary>
                      <ul className="mt-3 text-sm text-zinc-400 space-y-1">
                        <li>• Breeder licensing applies broadly (including non-commercial and hobby breeding)</li>
                        <li>• A 20-breeding-dog cap per operation and across "common control"</li>
                        <li>• Tier-based unannounced inspections with public letter grades (A-D)</li>
                        <li>• Microchipping requirements tied to transfer</li>
                        <li>• Universal intake microchip scanning and 24-hour digital posting</li>
                        <li>• Finder safe-harbor protections</li>
                        <li>• Statewide enforcement fund funded by fees/penalties</li>
                      </ul>
                    </details>
                  </div>
                </div>

                {/* Breeder Licensing */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Breeder Licensing and Caps</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        Do I need a breeder license if I only breed once?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Generally yes, unless you qualify for the one-time "accidental litter registration." 
                        The bill also states that more than one litter at the same residence triggers full licensing.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is the accidental litter registration?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        A one-time alternative to licensure for a single accidental litter, requiring a $25 fee, 
                        microchipping puppies before transfer, compliance with transfer rules, and spay/neuter 
                        of the dam within 30 days after transfer of the last puppy (unless medically contraindicated).
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is the cap on breeding dogs?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The baseline cap is 20 breeding dogs per operation and across operations under common control. 
                        Spayed/neutered dogs and puppies under six months do not count toward the cap.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        Is there any way to exceed 20 breeding dogs?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Yes, via a performance variance (up to 30) if the operation has years of clean compliance, 
                        meets staffing and space expansion thresholds, has annual veterinarian certification, 
                        and pays an additional variance fee.
                      </p>
                    </details>
                  </div>
                </div>

                {/* Inspections */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Inspections, Grading, and Evidence</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        How often will licensed breeders be inspected?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The bill sets tier-based minimums: at least one annual unannounced inspection for Tier 1; 
                        more frequent for higher tiers, with Tier 3 and variance holders receiving the most, 
                        plus additional inspections based on complaints and risk factors.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is an "evidence pack"?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        It is the standardized inspection documentation bundle: chain-of-custody log, 
                        timestamped photos/videos, climate readings, space/enrichment calculations, 
                        headcount attestation, checklist mapped to standards, corrective orders, and witness statements.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What do letter grades (A-D) do?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Inspection grades are displayed in the public registry and posted at the premises. 
                        A D grade triggers a mandatory reinspection within 30 days; failure to improve can 
                        trigger suspension pathways.
                      </p>
                    </details>
                  </div>
                </div>

                {/* Care Standards */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Care Standards</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What are the minimum housing and climate requirements?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The bill includes minimum space per dog (tiered by weight), daily cleaning and weekly 
                        sanitation, and climate/humidity ranges for housing areas, including higher neonatal 
                        temperature requirements.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What are the breeding limits for female dogs?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The bill sets minimum age requirements (18 months), maximum age limits (8 years with 
                        vet certification), spacing between litters (minimum 12 months), and a lifetime cap 
                        on litters (5 maximum).
                      </p>
                    </details>
                  </div>
                </div>

                {/* Microchipping and Transfers */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Microchipping, Transfers, and Marketplace Rules</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        When is microchipping required?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        A licensed breeder may not transfer a dog unless the dog is microchipped and 
                        registered with a nationally recognized database, with chain-of-custody steps at transfer.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What information must be disclosed to buyers?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        At transfer: recent veterinary health certificate, vaccination documentation, 
                        disclosure of known hereditary/congenital issues, breeder license ID, microchip 
                        information, and a written summary of buyer remedies.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        Are out-of-state sellers covered?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Yes. A seller outside WV who offers/transfers a dog to a WV consumer is subject to 
                        the article and is treated as having appointed the Secretary of State as agent for 
                        service of process.
                      </p>
                    </details>
                  </div>
                </div>

                {/* Finder Protections */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Finder Protections and Tethering Restrictions</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        If I find a stray dog, will I be treated as the owner?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        The bill creates a 14-day safe-harbor period where a good-faith finder is not deemed 
                        the owner/harborer if they make reasonable efforts to locate the owner, report within 
                        72 hours, and do not hold the dog out as their own.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        Can shelters charge me a surrender fee if I bring in a stray I found?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        A qualifying finder must not be charged surrender/intake fees for presenting the found 
                        dog during the safe-harbor period; the dog is treated as a stray rather than an owner surrender.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is the tethering rule?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Continuous tethering is limited (no more than 10 hours in a 24-hour period), with strong 
                        weather/temperature limits, equipment and length requirements, and specific prohibitions 
                        (e.g., puppies under six months; nursing/estrus females; certain chains/collars).
                      </p>
                    </details>
                  </div>
                </div>

                {/* Counties and Shelters */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Counties, Shelters, and Lost-Pet Reunification</h3>
                  <div className="space-y-4">
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is "universal intake scanning"?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Every facility receiving impounded or surrendered dogs must scan for a microchip 
                        immediately upon intake with a universal scanner.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        What is the 24-hour digital notice rule?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        Facilities must post a photo and key intake details publicly (or via the statewide 
                        database) within 24 hours, including intake location, intake ID, and contact info.
                      </p>
                    </details>
                    <details className="bg-zinc-800/50 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                        How long must a microchipped dog be held?
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400">
                        If a microchip is detected and owner contact information is available, the minimum 
                        hold is 10 days before disposition (subject to exceptions like affirmative surrender).
                      </p>
                    </details>
                  </div>
                </div>
              </div>

              {/* Download Link */}
              <div className="mt-8 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-sm text-zinc-400 mb-3">
                  This is a summary of the FAQ. Download the complete document for detailed information.
                </p>
                <a
                  href="/BARK_Act_FAQ_Draft.docx"
                  download
                  className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-black text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  📥 Download Full FAQ
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reform' && (
          <div className="space-y-6">
            {/* Reform Hero */}
            <div className="bg-gradient-to-r from-amber-900/30 to-green-900/30 border border-amber-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-medium uppercase tracking-wide">Reform Agenda</div>
                  <h2 className="text-2xl font-bold text-white mt-1">🐕 The B.A.R.K. Act</h2>
                  <p className="text-zinc-300 mt-1">Breeder Accountability and Regulation for Kindness Act</p>
                  <p className="text-sm text-zinc-400 mt-2">WV Code Chapter 19, Article 36 • 55 Sections • Effective July 1, 2026</p>
                </div>
                <div className="bg-amber-600 text-black text-xs font-bold px-3 py-1 rounded">HOUSE BILL</div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">20</div>
                <div className="text-xs text-zinc-500">Max Breeding Dogs</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">14</div>
                <div className="text-xs text-zinc-500">Day Finder Immunity</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">24hr</div>
                <div className="text-xs text-zinc-500">Digital Notice Req</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">10hr</div>
                <div className="text-xs text-zinc-500">Max Tether Time</div>
              </div>
            </div>

            {/* Core Pillars */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">📜 Six Core Pillars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <div className="text-blue-400 font-medium mb-2">🏷️ Universal Breeder Licensing</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Tier 1: 1-3 dogs ($100/yr)</li>
                    <li>• Tier 2: 4-10 dogs ($300+$10/dog)</li>
                    <li>• Tier 3: 11-20 dogs ($1000+$25/dog)</li>
                    <li>• No hobby breeder exemptions</li>
                    <li>• One-time accidental litter registration ($25)</li>
                  </ul>
                </div>
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                  <div className="text-green-400 font-medium mb-2">🐶 Animal Welfare Standards</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Dogs classified as "companion animals"</li>
                    <li>• Min 12-24 sq ft per dog (by size)</li>
                    <li>• 50-85°F temperature range</li>
                    <li>• 30 min daily exercise minimum</li>
                    <li>• Max 5 litters per lifetime</li>
                  </ul>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4">
                  <div className="text-amber-400 font-medium mb-2">🔍 Inspection & Grading</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Unannounced inspections</li>
                    <li>• Public letter grades (A-D)</li>
                    <li>• Standardized evidence packs</li>
                    <li>• D grade triggers 30-day reinspection</li>
                    <li>• Whistleblower protections</li>
                  </ul>
                </div>
                <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4">
                  <div className="text-purple-400 font-medium mb-2">📡 Traceability & Reunification</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Mandatory microchipping at transfer</li>
                    <li>• Universal intake scanning</li>
                    <li>• 24-hour digital posting</li>
                    <li>• 10-day hold for chipped dogs</li>
                    <li>• Statewide lost-pet database</li>
                  </ul>
                </div>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <div className="text-red-400 font-medium mb-2">🛡️ Finder Safe Harbor</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• 14-day protection period</li>
                    <li>• No surrender fees for finders</li>
                    <li>• 72-hour reporting window</li>
                    <li>• Good-faith presumption</li>
                    <li>• Liability shield for rescuers</li>
                  </ul>
                </div>
                <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-4">
                  <div className="text-cyan-400 font-medium mb-2">⛓️ Anti-Tethering</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Max 10 hours in 24-hour period</li>
                    <li>• Weather/temperature limits</li>
                    <li>• Equipment requirements</li>
                    <li>• No puppies under 6 months</li>
                    <li>• No nursing/estrus females</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current WV Law Problems */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">🚨 Current WV Law Problems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">No Breeder Licensing</p>
                      <p className="text-xs text-zinc-500">Anyone can breed unlimited dogs with zero oversight</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">No Mandatory Scanning</p>
                      <p className="text-xs text-zinc-500">Shelters not required to check for microchips</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">Courthouse Notice Only</p>
                      <p className="text-xs text-zinc-500">1951 law requires posting in courthouse, not online</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">No Finder Protections</p>
                      <p className="text-xs text-zinc-500">Good Samaritans face liability for helping strays</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">No Tethering Limits</p>
                      <p className="text-xs text-zinc-500">Dogs can be chained 24/7 with no restrictions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <div>
                      <p className="font-medium text-zinc-300">Dead Zone Counties</p>
                      <p className="text-xs text-zinc-500">3+ counties have no dedicated shelter facilities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How BARK Act Fixes It */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">✓ How the BARK Act Fixes It</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">Universal Breeder Licensing</p>
                      <p className="text-xs text-zinc-500">Tiered system with inspections and public grades</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">Mandatory Intake Scanning</p>
                      <p className="text-xs text-zinc-500">Every facility must scan with universal scanner</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">24-Hour Digital Posting</p>
                      <p className="text-xs text-zinc-500">Photos and details online within one day</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">14-Day Finder Safe Harbor</p>
                      <p className="text-xs text-zinc-500">Protection for Good Samaritans helping strays</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">10-Hour Tethering Limit</p>
                      <p className="text-xs text-zinc-500">With weather limits and equipment standards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <div>
                      <p className="font-medium text-zinc-300">Regional Joint Authorities</p>
                      <p className="text-xs text-zinc-500">Counties can pool resources to end dead zones</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-amber-900/30 to-blue-900/30 border border-amber-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-300 mb-3">📣 Support the BARK Act</h3>
              <p className="text-zinc-300 mb-4">
                Contact your legislators and ask them to co-sponsor this comprehensive animal welfare reform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/advocacy"
                  className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-black font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  📞 Contact Legislators
                </Link>
                <Link
                  href="/compliance"
                  className="inline-flex items-center bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  📊 View Compliance Data
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
