'use client';

import { useState } from 'react';
import Link from 'next/link';

const COUNTY_DATA = [
  { county: 'Barbour', agency: 'Dog Warden', facility: 'Barbour County Animal Control', notes: 'Follows state code; 5-day hold', harboring: '5-day', pet911Score: 'C', phone: '(304) 823-1330', email: '', address: 'Philippi, WV 26416' },
  { county: 'Berkeley', agency: 'Animal Control (County)', facility: 'Berkeley County Animal Shelter', notes: '3-day harboring rule; progressive TNR policy', harboring: '3-day', pet911Score: 'B', phone: '(304) 267-8889', email: 'animalcontrol@berkeleywv.org', address: '554 Dry Run Rd, Martinsburg, WV 25404' },
  { county: 'Boone', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 369-9913', email: '', address: 'Madison, WV 25130' },
  { county: 'Braxton', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 765-2335', email: '', address: 'Sutton, WV 26601' },
  { county: 'Brooke', agency: 'Dog Warden', facility: 'Brooke County Animal Shelter', notes: 'Strict leash law; zero tolerance cruelty', harboring: '5-day', pet911Score: 'B', phone: '(304) 737-3660', email: 'brookeanimalshelter@gmail.com', address: '101 Shelter Rd, Wellsburg, WV 26070' },
  { county: 'Cabell', agency: 'HCW Control Board', facility: 'Huntington Cabell Wayne Shelter', notes: 'Joint Authority; 5-day hold; $50 reclaim', harboring: '5-day', pet911Score: 'A', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704' },
  { county: 'Calhoun', agency: 'Sheriff Dept', facility: 'No dedicated shelter', notes: 'Transport to neighboring facilities required', harboring: '5-day', pet911Score: 'F', phone: '(304) 354-6118', email: '', address: 'Grantsville, WV 26147' },
  { county: 'Clay', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 587-4260', email: '', address: 'Clay, WV 25043' },
  { county: 'Doddridge', agency: 'Humane Officer', facility: 'County Contract', notes: 'Roles consolidated with law enforcement', harboring: '5-day', pet911Score: 'C', phone: '(304) 873-2631', email: '', address: 'West Union, WV 26456' },
  { county: 'Fayette', agency: 'Animal Control', facility: 'County Shelter', notes: 'Oak Hill has 3-day "fed or sheltered" rule', harboring: '3-day', pet911Score: 'C', phone: '(304) 574-1200', email: '', address: 'Fayetteville, WV 25840' },
  { county: 'Gilmer', agency: 'Sheriff / Warden', facility: 'No dedicated shelter', notes: 'Glenville has chaining/tying laws', harboring: '5-day', pet911Score: 'F', phone: '(304) 462-7454', email: '', address: 'Glenville, WV 26351' },
  { county: 'Grant', agency: 'Assessor/Warden', facility: 'County Pound', notes: 'Strict license tax collection ($3/$6)', harboring: '5-day', pet911Score: 'C', phone: '(304) 257-4422', email: '', address: 'Petersburg, WV 26847' },
  { county: 'Greenbrier', agency: 'Humane Society', facility: 'Greenbrier Humane Society', notes: 'Strong partnership with private humane society', harboring: '5-day', pet911Score: 'B', phone: '(304) 645-4775', email: 'ghs@greenbrierhumanesociety.com', address: '151 Holiday Lane, Lewisburg, WV 24901' },
  { county: 'Hampshire', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 822-3114', email: '', address: 'Romney, WV 26757' },
  { county: 'Hancock', agency: 'Dog Warden', facility: 'Hancock County Animal Shelter', notes: 'Emergency service; focus on cruelty/neglect', harboring: '5-day', pet911Score: 'B', phone: '(304) 564-3311', email: '', address: 'New Cumberland, WV 26047' },
  { county: 'Hardy', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 530-0222', email: '', address: 'Moorefield, WV 26836' },
  { county: 'Harrison', agency: 'Dog Warden', facility: 'Harrison County Animal Control', notes: 'MANDATORY MICROCHIPPING for reclaims', harboring: '5-day', pet911Score: 'A', phone: '(304) 423-7760', email: 'hcac@harrisoncountywv.com', address: '279 W Main St, Clarksburg, WV 26301' },
  { county: 'Jackson', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 372-2290', email: '', address: 'Ripley, WV 25271' },
  { county: 'Jefferson', agency: 'Animal Control', facility: 'Animal Welfare Society', notes: 'High compliance; strong licensing ($3/$6)', harboring: '5-day', pet911Score: 'A', phone: '(304) 725-0589', email: 'info@baacwv.org', address: '60 Eastwood Dr, Kearneysville, WV 25430' },
  { county: 'Kanawha', agency: 'KCHA', facility: 'KCHA Shelter', notes: 'ANTI-TETHERING; adoption reservation system', harboring: '5-day', pet911Score: 'A+', phone: '(304) 342-1576', email: 'info@kchaonline.org', address: '1248 Greenbrier St, Charleston, WV 25311' },
  { county: 'Lewis', agency: 'Sheriff / Warden', facility: 'Lewis-Upshur Facility', notes: 'Shared facility with Upshur', harboring: '5-day', pet911Score: 'C', phone: '(304) 269-8251', email: '', address: 'Weston, WV 26452' },
  { county: 'Lincoln', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 824-3336', email: '', address: 'Hamlin, WV 25523' },
  { county: 'Logan', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 792-8520', email: '', address: 'Logan, WV 25601' },
  { county: 'Marion', agency: 'Humane Society', facility: 'Marion County Humane Society', notes: 'NO-KILL facility; strong adoption focus', harboring: '5-day', pet911Score: 'A', phone: '(304) 366-1098', email: 'mchumanesociety@gmail.com', address: '2731 Locust Ave, Fairmont, WV 26554' },
  { county: 'Marshall', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 845-1600', email: '', address: 'Moundsville, WV 26041' },
  { county: 'Mason', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 675-3838', email: '', address: 'Point Pleasant, WV 25550' },
  { county: 'McDowell', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 436-8531', email: '', address: 'Welch, WV 24801' },
  { county: 'Mercer', agency: 'Animal Control', facility: 'Mercer County Animal Shelter', notes: '15-DAY HARBORING (Gold Standard); Spay/Neuter ordinance', harboring: '15-day', pet911Score: 'A+', phone: '(304) 425-2838', email: 'mcas@mercercounty.wv.gov', address: '614 Glenwood Park Rd, Princeton, WV 24740' },
  { county: 'Mineral', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 788-1314', email: '', address: 'Keyser, WV 26726' },
  { county: 'Mingo', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 235-0360', email: '', address: 'Williamson, WV 25661' },
  { county: 'Monongalia', agency: 'Canine Adoption Ctr', facility: 'Canine Adoption Center', notes: '3-day harboring; strict weather tethering bans', harboring: '3-day', pet911Score: 'B', phone: '(304) 291-7267', email: 'mccac@monongaliacounty.gov', address: '351 S Pierpont St, Morgantown, WV 26501' },
  { county: 'Monroe', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 772-3018', email: '', address: 'Union, WV 24983' },
  { county: 'Morgan', agency: 'Animal Control', facility: 'County Shelter', notes: 'Focus on outdoor enclosure standards', harboring: '5-day', pet911Score: 'C', phone: '(304) 258-8546', email: '', address: 'Berkeley Springs, WV 25411' },
  { county: 'Nicholas', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 872-7850', email: '', address: 'Summersville, WV 26651' },
  { county: 'Ohio', agency: 'SPCA / Warden', facility: 'Ohio County SPCA', notes: 'Vicious dog and noise ordinances', harboring: '5-day', pet911Score: 'B', phone: '(304) 232-1922', email: 'ohiocountyspca@gmail.com', address: '3 Orchard Rd, Wheeling, WV 26003' },
  { county: 'Pendleton', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 358-2214', email: '', address: 'Franklin, WV 26707' },
  { county: 'Pleasants', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 684-2234', email: '', address: 'St Marys, WV 26170' },
  { county: 'Pocahontas', agency: 'Sheriff (Designee)', facility: 'Pocahontas County Animal Shelter', notes: 'Sheriff designates wardens; focus on leash laws', harboring: '5-day', pet911Score: 'C', phone: '(304) 799-4445', email: '', address: 'Marlinton, WV 24954' },
  { county: 'Preston', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 329-0070', email: '', address: 'Kingwood, WV 26537' },
  { county: 'Putnam', agency: 'Animal Services', facility: 'Putnam County Animal Shelter', notes: '"Adopt a Kennel" program; sustainable care', harboring: '5-day', pet911Score: 'B', phone: '(304) 586-0249', email: 'putnamcountyanimalshelter@gmail.com', address: '1 Armory Dr, Eleanor, WV 25070' },
  { county: 'Raleigh', agency: 'Sheriff / Warden', facility: 'Raleigh County Humane Society', notes: '"One dog at large per 12hr" rule', harboring: '5-day', pet911Score: 'B', phone: '(304) 253-8921', email: '', address: '325 Gray Flats Rd, Beckley, WV 25801' },
  { county: 'Randolph', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 636-2100', email: '', address: 'Elkins, WV 26241' },
  { county: 'Ritchie', agency: 'Humane Society', facility: 'Ritchie County Humane Society', notes: 'Contracted shelter services', harboring: '5-day', pet911Score: 'C', phone: '(304) 643-4721', email: '', address: 'Harrisville, WV 26362' },
  { county: 'Roane', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 927-2860', email: '', address: 'Spencer, WV 25276' },
  { county: 'Summers', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 466-3155', email: '', address: 'Hinton, WV 25951' },
  { county: 'Taylor', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 265-3365', email: '', address: 'Grafton, WV 26554' },
  { county: 'Tucker', agency: 'Dog Warden', facility: 'Tucker County Dog Pound', notes: 'Basic pound services; limited hours', harboring: '5-day', pet911Score: 'D', phone: '(304) 478-2913', email: '', address: 'Parsons, WV 26287' },
  { county: 'Tyler', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 758-2141', email: '', address: 'Middlebourne, WV 26149' },
  { county: 'Upshur', agency: 'Warden', facility: 'Lewis-Upshur Facility', notes: 'Shared facility with Lewis', harboring: '5-day', pet911Score: 'C', phone: '(304) 472-1180', email: '', address: 'Buckhannon, WV 26201' },
  { county: 'Wayne', agency: 'HCW Control Board', facility: 'Huntington Cabell Wayne Shelter', notes: 'Joint Authority with Cabell', harboring: '5-day', pet911Score: 'A', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704' },
  { county: 'Webster', agency: 'City Control', facility: 'City of Webster Control', notes: 'City-level control; 3-day harboring implied', harboring: '3-day', pet911Score: 'C', phone: '(304) 847-2423', email: '', address: 'Webster Springs, WV 26288' },
  { county: 'Wetzel', agency: 'Animal Shelter', facility: 'Wetzel County Animal Shelter', notes: 'Basic shelter operations', harboring: '5-day', pet911Score: 'C', phone: '(304) 455-2510', email: '', address: 'New Martinsville, WV 26155' },
  { county: 'Wirt', agency: 'Sheriff / Warden', facility: 'No dedicated shelter', notes: 'New leash law (2025); reliance on Sheriff', harboring: '5-day', pet911Score: 'F', phone: '(304) 275-4200', email: '', address: 'Elizabeth, WV 26143' },
  { county: 'Wood', agency: 'Humane Society', facility: 'HS of Parkersburg', notes: 'Privatized enforcement; police powers', harboring: '5-day', pet911Score: 'A', phone: '(304) 422-5541', email: 'info@hspwv.org', address: '530 29th St, Parkersburg, WV 26101' },
  { county: 'Wyoming', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Nuisance animal focus', harboring: '5-day', pet911Score: 'D', phone: '(304) 732-8000', email: '', address: 'Pineville, WV 24874' },
];

const COMPLIANCE_PILLARS = [
  { id: 'scanning', name: 'Universal Scanning', icon: '📡', description: 'Every animal scanned for microchip upon intake' },
  { id: 'digital', name: 'Digital Transparency', icon: '📱', description: 'Photos posted online within 24 hours of intake' },
  { id: 'holding', name: 'Extended Holding', icon: '⏳', description: '5+ day hold with adoption reservation' },
  { id: 'immunity', name: 'Finder Immunity', icon: '🛡️', description: '14+ day safe harbor for Good Samaritans' },
];

const SCORE_COLORS: Record<string, string> = {
  'A+': 'bg-green-600 text-white',
  'A': 'bg-green-700 text-white',
  'B': 'bg-blue-700 text-white',
  'C': 'bg-yellow-700 text-black',
  'D': 'bg-orange-700 text-white',
  'F': 'bg-red-700 text-white',
};

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'counties' | 'deadzones' | 'laws'>('overview');
  const [searchCounty, setSearchCounty] = useState('');
  const [filterScore, setFilterScore] = useState<string | null>(null);

  const scoreStats = {
    excellent: COUNTY_DATA.filter(c => c.pet911Score === 'A+' || c.pet911Score === 'A').length,
    good: COUNTY_DATA.filter(c => c.pet911Score === 'B').length,
    fair: COUNTY_DATA.filter(c => c.pet911Score === 'C').length,
    poor: COUNTY_DATA.filter(c => c.pet911Score === 'D').length,
    failing: COUNTY_DATA.filter(c => c.pet911Score === 'F').length,
  };

  const filteredCounties = COUNTY_DATA.filter(county => {
    if (searchCounty && !county.county.toLowerCase().includes(searchCounty.toLowerCase())) return false;
    if (filterScore && county.pet911Score !== filterScore) return false;
    return true;
  });

  const deadzoneCounties = COUNTY_DATA.filter(c => c.pet911Score === 'F' || c.notes.includes('No dedicated shelter'));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/" className="text-blue-400 text-sm hover:underline">← Back to Pet911</Link>
          <h1 className="text-4xl font-bold mt-4">📊 Compliance & Resources</h1>
          <p className="text-xl text-zinc-300 mt-2">West Virginia Animal Control Compliance Directory</p>
          <p className="text-sm text-zinc-400 mt-1">Assessing county compliance with Pet911 standards</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: '📊 Overview', icon: '' },
              { id: 'counties', label: '🗺️ County Directory', icon: '' },
              { id: 'deadzones', label: '🚨 Dead Zones', icon: '' },
              { id: 'laws', label: '⚖️ State Law', icon: '' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Score Summary */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{scoreStats.excellent}</div>
                <div className="text-xs text-green-300">A/A+ Counties</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{scoreStats.good}</div>
                <div className="text-xs text-blue-300">B Counties</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{scoreStats.fair}</div>
                <div className="text-xs text-yellow-300">C Counties</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{scoreStats.poor}</div>
                <div className="text-xs text-orange-300">D Counties</div>
              </div>
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{scoreStats.failing}</div>
                <div className="text-xs text-red-300">F Counties</div>
              </div>
            </div>

            {/* Pet911 Compliance Pillars */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Pet911 Compliance Pillars</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {COMPLIANCE_PILLARS.map(pillar => (
                  <div key={pillar.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="text-2xl mb-2">{pillar.icon}</div>
                    <div className="font-medium text-zinc-200">{pillar.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">{pillar.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Key Compliance Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <div className="font-medium text-red-300">⚠️ Dead Zone Counties</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {deadzoneCounties.length} counties lack dedicated shelter facilities, 
                    creating significant gaps in animal welfare services.
                  </div>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4">
                  <div className="font-medium text-amber-300">⚠️ Digital Notice Gap</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    State law requires posting in the "county courthouse" - a 1951 requirement that ignores 
                    digital platforms. Many rural shelters technically comply while failing to provide meaningful notice.
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <div className="font-medium text-blue-300">📡 Harrison County Model</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    Mandatory microchipping for all reclaimed animals. If every reclaimed pet left with a chip, 
                    "unknown owner" strays would plummet over time.
                  </div>
                </div>
              </div>
            </div>

            {/* State Code Summary */}
            <div>
              <h2 className="text-lg font-semibold mb-4">WV Code Chapter 19-20 Summary</h2>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Minimum Hold Period</td>
                      <td className="px-4 py-3">5 days after notice (§ 19-20-8)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Notice Requirement</td>
                      <td className="px-4 py-3">Post in county courthouse (outdated)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Rabies Quarantine</td>
                      <td className="px-4 py-3">10 days observation; 6 months for unvaccinated exposed</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Hunting Dog Exemption</td>
                      <td className="px-4 py-3">Vaccinated dogs may run at large during lawful hunting</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Mandatory Scanning</td>
                      <td className="px-4 py-3 text-red-400">NOT REQUIRED by state law</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'counties' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="🔍 Search county..."
                value={searchCounty}
                onChange={(e) => setSearchCounty(e.target.value)}
                className="flex-1 max-w-xs bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
              />
              <select
                value={filterScore || ''}
                onChange={(e) => setFilterScore(e.target.value || null)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Scores</option>
                <option value="A+">A+ Only</option>
                <option value="A">A Only</option>
                <option value="B">B Only</option>
                <option value="C">C Only</option>
                <option value="D">D Only</option>
                <option value="F">F Only</option>
              </select>
              <span className="text-sm text-zinc-500">{filteredCounties.length} of 55 counties</span>
            </div>

            {/* County Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[1200px]">
                <thead className="bg-zinc-900/80">
                  <tr className="text-left text-xs text-zinc-400 uppercase">
                    <th className="px-3 py-3">County</th>
                    <th className="px-3 py-3">Facility</th>
                    <th className="px-3 py-3">📞 Phone</th>
                    <th className="px-3 py-3">✉️ Email</th>
                    <th className="px-3 py-3">📍 Address</th>
                    <th className="px-3 py-3">Hold</th>
                    <th className="px-3 py-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredCounties.map((county, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/50">
                      <td className="px-3 py-3 font-medium">{county.county}</td>
                      <td className="px-3 py-3 text-zinc-300">{county.facility}</td>
                      <td className="px-3 py-3">
                        {county.phone ? (
                          <a href={`tel:${county.phone}`} className="text-blue-400 hover:underline">
                            {county.phone}
                          </a>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {county.email ? (
                          <a href={`mailto:${county.email}`} className="text-blue-400 hover:underline text-xs">
                            {county.email}
                          </a>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-400">{county.address}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs px-2 py-1 bg-zinc-800 rounded">{county.harboring}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${SCORE_COLORS[county.pet911Score]}`}>
                          {county.pet911Score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deadzones' && (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-300 mb-2">🚨 Animal Control Dead Zones</h2>
              <p className="text-zinc-300">
                {deadzoneCounties.length} West Virginia counties lack dedicated animal shelter facilities, 
                creating critical gaps in animal welfare services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deadzoneCounties.map((county, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-red-400">{county.county} County</h3>
                      <p className="text-sm text-zinc-400 mt-1">{county.notes}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Agency: {county.agency} • Contact: {county.phone}
                      </p>
                    </div>
                    <span className="bg-red-700 text-white text-xs px-2 py-1 rounded">DEAD ZONE</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-300 mb-3">📋 Dead Zone Impact</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li>• Animals must be transported to neighboring counties (20+ miles in some cases)</li>
                <li>• Emergency response times exceed 2 hours in most dead zones</li>
                <li>• No local adoption services - residents must travel to adopt</li>
                <li>• Increased stray populations due to lack of accessible services</li>
                <li>• Higher euthanasia rates due to transport logistics and delays</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="space-y-6 max-w-4xl">
            {/* Improved State Law Formatting */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-amber-400">West Virginia Code Chapter 19, Article 20 - Dogs</h2>
              
              <div className="space-y-8">
                {/* Section 1: County Dog Warden */}
                <div className="border-l-4 border-amber-600 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-600 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-400 mb-3">
                        § 19-20-6: County Dog Warden
                      </h3>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-zinc-300 leading-relaxed">
                          The County Commission of each county shall appoint a dog warden and necessary deputies to enforce 
                          the provisions of the code. The Commission may employ a warden directly or appoint an officer of a 
                          humane society to serve in this capacity.
                        </p>
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <p className="text-xs text-zinc-500">
                            <strong>Key Point:</strong> This is the foundational authority for all county animal control operations in WV.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Impoundment and Hold Period */}
                <div className="border-l-4 border-blue-600 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-400 mb-3">
                        § 19-20-8: Impoundment and Hold Period
                      </h3>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-zinc-300 leading-relaxed mb-3">
                          All impounded dogs must be housed and fed for a period of 
                          <span className="text-blue-400 font-bold text-lg mx-2">five days</span>
                          after notice of seizure has been given or posted.
                        </p>
                        <div className="bg-blue-900/20 border border-blue-800 rounded p-3 mt-3">
                          <p className="text-sm text-blue-300">
                            <strong>Important:</strong> This is the absolute minimum standard - no county may reduce 
                            this period, though they may extend it.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Notice Requirements - CRITICAL GAP */}
                <div className="border-l-4 border-red-600 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-red-400 mb-3">
                        Notice Requirements (Critical Gap)
                      </h3>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-zinc-300 leading-relaxed mb-3">
                          For unknown owners, the warden must "post a notice in the county courthouse" describing the dog 
                          and place of seizure.
                        </p>
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-400 font-bold">⚠️ OUTDATED REQUIREMENT</span>
                          </div>
                          <p className="text-sm text-red-300">
                            This requirement is a relic of 1951 - it does not mandate digital 
                            notification, creating a compliance gap where rural counties may technically follow the law 
                            while failing to provide meaningful notice to pet owners.
                          </p>
                          <p className="text-xs text-red-400 mt-2">
                            The BARK Act would modernize this to require 24-hour digital posting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Rabies Control & Running at Large */}
                <div className="border-l-4 border-green-600 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-green-400 mb-3">
                        § 19-20A-8: Rabies Control & Running at Large
                      </h3>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-zinc-300 leading-relaxed mb-3">
                          Vaccinated dogs and cats may run at large unless in a quarantined area. The statute explicitly 
                          prohibits counties from preventing vaccinated dogs from running at large while engaged in lawful 
                          hunting, training, or herding activities.
                        </p>
                        <div className="bg-green-900/20 border border-green-800 rounded p-3 mt-3">
                          <p className="text-sm text-green-300">
                            <strong>Note:</strong> This "hunting dog exemption" complicates enforcement and creates 
                            loopholes that some counties struggle to manage.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Humane Officer Powers */}
                <div className="border-l-4 border-purple-600 pl-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-purple-400 mb-3">
                        § 7-10-1: Humane Officer Powers
                      </h3>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-zinc-300 leading-relaxed mb-3">
                          Humane officers are designated to investigate cruelty complaints and have authority to take 
                          possession of abandoned or neglected animals.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div className="bg-purple-900/20 border border-purple-800 rounded p-3">
                            <p className="text-xs text-purple-300">
                              <strong>✓ Mandatory Reporters:</strong> Veterinarians and professionals have mandatory 
                              reporter status
                            </p>
                          </div>
                          <div className="bg-purple-900/20 border border-purple-800 rounded p-3">
                            <p className="text-xs text-purple-300">
                              <strong>✓ Immunity Protection:</strong> Good-faith reports are protected from liability
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Box */}
              <div className="mt-8 bg-gradient-to-r from-amber-900/30 to-blue-900/30 border border-amber-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-300 mb-3">📋 State Law Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-300 mb-2">
                      <span className="text-green-400">✓</span> Minimum 5-day hold period statewide
                    </p>
                    <p className="text-zinc-300 mb-2">
                      <span className="text-green-400">✓</span> County authority to appoint wardens
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-green-400">✓</span> Humane officer enforcement powers
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-300 mb-2">
                      <span className="text-red-400">✗</span> No mandatory microchip scanning
                    </p>
                    <p className="text-zinc-300 mb-2">
                      <span className="text-red-400">✗</span> Outdated courthouse notice requirement
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-yellow-400">⚠</span> Hunting dog exemptions create gaps
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
