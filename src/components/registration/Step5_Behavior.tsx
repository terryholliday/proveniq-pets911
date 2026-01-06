'use client';

import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step5_Behavior({ data, update, onNext, onBack }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void, onBack: () => void }) {
    const toggleFlag = (flag: keyof typeof data.behaviorFlags) => {
        update({
            behaviorFlags: {
                ...data.behaviorFlags,
                [flag]: !data.behaviorFlags[flag]
            }
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Collar & Behavior</h2>
            <p className="text-slate-400 mb-8">Critical behavioral markers for safe recovery.</p>

            <div className="space-y-6 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Gear</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-1">
                                <span className="text-white text-sm">Wears a collar?</span>
                                <div className="flex gap-2">
                                    <button onClick={() => update({ hasCollar: true })} className={`px-4 py-2 rounded-lg text-xs font-bold ${data.hasCollar === true ? 'bg-blue-600' : 'bg-slate-900 text-slate-500'}`}>Yes</button>
                                    <button onClick={() => update({ hasCollar: false })} className={`px-4 py-2 rounded-lg text-xs font-bold ${data.hasCollar === false ? 'bg-slate-700' : 'bg-slate-900 text-slate-500'}`}>No</button>
                                </div>
                            </div>
                            {data.hasCollar && (
                                <input
                                    type="text"
                                    placeholder="Collar color(s)"
                                    value={data.collarColors}
                                    onChange={(e) => update({ collarColors: e.target.value })}
                                    className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-3 text-white text-sm"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Behavior Flags</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { key: 'friendly', label: 'Friendly with strangers' },
                                { key: 'shy', label: 'Shy / Fearful' },
                                { key: 'boltIfChased', label: 'May bolt if chased ⚠️' },
                                { key: 'respondsToName', label: 'Responds to name' },
                                { key: 'foodMotivated', label: 'Food-motivated' },
                            ].map((flag) => (
                                <button
                                    key={flag.key}
                                    onClick={() => toggleFlag(flag.key as any)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${data.behaviorFlags[flag.key as keyof typeof data.behaviorFlags] ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                >
                                    <span className="text-sm font-medium">{flag.label}</span>
                                    {data.behaviorFlags[flag.key as keyof typeof data.behaviorFlags] && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>Back</Button>
                <Button size="lg" className="flex-[2]" onClick={onNext}>Next</Button>
            </div>
        </div>
    );
}
