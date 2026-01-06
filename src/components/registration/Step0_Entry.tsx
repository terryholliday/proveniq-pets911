'use client';

import { Heart, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Step0_Entry({ onNext }: { onNext: () => void }) {
    return (
        <div className="text-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-blue-600/20 backdrop-blur-xl flex items-center justify-center ring-1 ring-blue-500/30">
                <Heart className="w-10 h-10 text-blue-500 fill-blue-500/20" />
            </div>

            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                Register My Pet
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
                建立基線真相。 A pet known to the system is a pet that returns home.
            </p>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-10 text-left">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">Why Pre-register?</h3>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <div className="p-1 bg-blue-500/20 rounded-lg mt-0.5">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-slate-300 text-sm"><strong>Instant Response:</strong> No data entry needed during a crisis.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="p-1 bg-emerald-500/20 rounded-lg mt-0.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-slate-300 text-sm"><strong>Verified Identity:</strong> High-quality photos prevent false sightings.</p>
                    </li>
                </ul>
            </div>

            <Button size="massive" className="w-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20" onClick={onNext}>
                Start Registration
                <ChevronRight className="ml-2 w-6 h-6" />
            </Button>

            <p className="text-slate-500 text-sm mt-6">
                Takes about 5 minutes • Your data is private
            </p>
        </div>
    );
}
