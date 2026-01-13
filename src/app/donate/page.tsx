'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, DollarSign, Shield, CheckCircle, ArrowRight,
  Truck, Home, Stethoscope, Users, Award, Clock
} from 'lucide-react';

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

const IMPACT_TIERS = [
  { amount: 25, impact: 'Provides emergency food for a rescued animal for one week', icon: Heart },
  { amount: 50, impact: 'Covers basic veterinary exam for a stray animal', icon: Stethoscope },
  { amount: 100, impact: 'Funds one complete transport mission (gas, supplies)', icon: Truck },
  { amount: 250, impact: 'Sponsors a foster home setup kit for new volunteers', icon: Home },
  { amount: 500, impact: 'Covers emergency vet care for a critically injured animal', icon: Shield },
];

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    anonymous: false,
    dedication: '',
  });

  const actualAmount = selectedAmount === 'custom' ? parseInt(customAmount) || 0 : selectedAmount;

  const handleDonate = async () => {
    if (actualAmount < 5) {
      alert('Minimum donation is $5');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/donate/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: actualAmount,
          isMonthly,
          donorName: donorInfo.anonymous ? 'Anonymous' : donorInfo.name,
          donorEmail: donorInfo.email,
          dedication: donorInfo.dedication,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        alert(data.error);
      } else {
        alert('Stripe is not configured yet. Please check back soon!');
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Unable to process donation. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentImpact = IMPACT_TIERS.find(t => t.amount <= actualAmount);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-pet-profiles.ico" alt="PetMayday" className="h-8 w-8" />
            <span className="font-bold">PetMayday</span>
          </Link>
          <Badge variant="outline" className="border-amber-500 text-amber-400">
            PROVENIQ Foundation 501(c)(3)
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-amber-900/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <Badge className="bg-amber-600 mb-4">100% Tax Deductible</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Every Dollar Saves Lives
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Your donation directly funds emergency pet rescue, transport, and veterinary care 
            across West Virginia's 55 counties.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Donation Form */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Make a Donation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* One-time vs Monthly */}
                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                  <button
                    onClick={() => setIsMonthly(false)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      !isMonthly ? 'bg-amber-600 text-black' : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    One-Time
                  </button>
                  <button
                    onClick={() => setIsMonthly(true)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      isMonthly ? 'bg-amber-600 text-black' : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Select Amount</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {PRESET_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`py-3 px-4 rounded-lg border font-bold text-lg transition-all ${
                          selectedAmount === amount
                            ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                            : 'border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedAmount('custom')}
                      className={`py-3 px-4 rounded-lg border font-medium transition-all ${
                        selectedAmount === 'custom'
                          ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {selectedAmount === 'custom' && (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="5"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Impact Preview */}
                {currentImpact && actualAmount >= 25 && (
                  <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <currentImpact.icon className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-400">Your Impact</p>
                        <p className="text-sm text-zinc-300">{currentImpact.impact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Donor Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Name</label>
                    <input
                      type="text"
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                      disabled={donorInfo.anonymous}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email (for receipt)</label>
                    <input
                      type="email"
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={donorInfo.anonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, anonymous: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Make this donation anonymous</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dedication (optional)</label>
                    <input
                      type="text"
                      value={donorInfo.dedication}
                      onChange={(e) => setDonorInfo({ ...donorInfo, dedication: e.target.value })}
                      placeholder="In memory of... / In honor of..."
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleDonate}
                  disabled={isProcessing || actualAmount < 5 || !donorInfo.email}
                  className="w-full h-14 text-lg bg-amber-600 hover:bg-amber-500 text-black font-bold"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      Donate ${actualAmount || 0}{isMonthly ? '/month' : ''}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trust Indicators */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Your Trust is Sacred
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>501(c)(3) tax-deductible (EIN pending)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>100% goes to animal rescue operations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Quarterly transparency reports published</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>No admin salaries - 100% volunteer-run</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Stats */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  2026 Impact (YTD)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">247</div>
                    <div className="text-xs text-zinc-500">Animals Rescued</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">89</div>
                    <div className="text-xs text-zinc-500">Reunifications</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">156</div>
                    <div className="text-xs text-zinc-500">Transports</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">42</div>
                    <div className="text-xs text-zinc-500">Counties Served</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Benefits */}
            {!isMonthly && (
              <Card className="bg-amber-900/20 border-amber-700/50">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3 text-amber-400">Become a Monthly Supporter</h3>
                  <ul className="text-sm space-y-2 text-zinc-300">
                    <li>• Predictable funding for emergency operations</li>
                    <li>• Exclusive quarterly impact reports</li>
                    <li>• Recognition on our Donor Wall</li>
                    <li>• Cancel anytime</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsMonthly(true)}
                    className="w-full mt-4 border-amber-600 text-amber-400 hover:bg-amber-900/30"
                  >
                    Switch to Monthly
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-sm text-zinc-500">
        <p>PROVENIQ Foundation is a 501(c)(3) nonprofit organization.</p>
        <p className="mt-2">All donations are tax-deductible to the extent allowed by law.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-zinc-300">Terms of Service</Link>
          <Link href="/" className="hover:text-zinc-300">Return to Home</Link>
        </div>
      </footer>
    </div>
  );
}
