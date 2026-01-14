'use client';

import { useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step7_Review({ data, onComplete, onBack }: { data: RegistrationData, onComplete: () => void, onBack: () => void }) {
    const [confirmed, setConfirmed] = useState(false);

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold text-white mb-2">Review Summary</h2>
            <p className="text-slate-400 mb-8">Confirm the details before anchoring to the Identity Graph.</p>

            <div className="space-y-6 mb-8">
                {/* Pet Card Preview */}
                <Card className="bg-slate-800 border-slate-700 overflow-hidden ring-2 ring-blue-500/20 shadow-2xl">
                    <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-black text-xl tracking-tight">{data.petName}</h3>
                        <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Pre-registered</span>
                    </div>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-2">
                            <div className="h-48 bg-slate-900 border-r border-slate-700 flex items-center justify-center">
                                <span className="text-xs text-slate-700 font-mono tracking-tighter uppercase">[PHOTO_PLACEHOLDER]</span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Basic Info</p>
                                    <p className="text-white text-sm font-medium">{data.sex} {data.breed}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Location</p>
                                    <p className="text-white text-sm font-medium">{data.county}, WV {data.zipCode}</p>
                                </div>
                                {data.microchipNumber && (
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Microchip</p>
                                        <p className="text-blue-400 text-xs font-mono">{data.microchipNumber.slice(0, 6)}...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700/50 bg-slate-800/50">
                            <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Behavioral Warnings</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(data.behaviorFlags).map(([key, value]) => value && (
                                    <span key={key} className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-medium">
                                        {key === 'boltIfChased' ? '⚠️ May bolt if chased' : key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                    </span>
                                ))}
                                {!Object.values(data.behaviorFlags).some(v => v) && <span className="text-slate-600 text-[10px]">No behavioral flags set</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Owner Contact */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-white">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Owner Contact</h4>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold">{data.ownerName}</p>
                                <p className="text-slate-400 text-xs">{data.phone}</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Trust Protected</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-8 p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 leading-relaxed font-medium">
                        I confirm this information is accurate to the best of my knowledge. I understand this data is used for reunification purposes within the PetNexus Mayday network.
                    </span>
                </label>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={onBack}>
                    <ChevronLeft className="mr-2 w-5 h-5" />
                    Back
                </Button>
                <Button size="lg" className="flex-[2] bg-blue-600 hover:bg-blue-500" disabled={!confirmed} onClick={onComplete}>Register Pet</Button>
            </div>
        </div>
    );
}
