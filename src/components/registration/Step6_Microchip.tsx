'use client';

import { Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step6_Microchip({ data, update, onNext, onBack }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void, onBack: () => void }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Microchip</h2>
            <p className="text-slate-400 mb-8">Preparation is better than panic. Add this if known.</p>

            <Card className="bg-slate-800 border-slate-700 mb-8">
                <CardContent className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Microchip Number</label>
                        <input
                            type="text"
                            value={data.microchipNumber}
                            onChange={(e) => update({ microchipNumber: e.target.value })}
                            className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 uppercase font-mono tracking-wider"
                            placeholder="e.g. 985112000000000"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Registry</label>
                        <input
                            type="text"
                            value={data.microchipRegistry}
                            onChange={(e) => update({ microchipRegistry: e.target.value })}
                            className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. HomeAgain, AKC, Not sure"
                        />
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            If your pet isn&apos;t chipped yet, or you don&apos;t have the details handy, you can finalize this later. This step is not required to register.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>Back</Button>
                <Button size="lg" className="flex-[2]" onClick={onNext}>Review & Save</Button>
            </div>
        </div>
    );
}
