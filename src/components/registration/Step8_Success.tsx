'use client';

import { Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Step8_Success({ onReset }: { onReset: () => void }) {
    return (
        <div className="text-center pt-12 animate-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-600/20 flex items-center justify-center border-4 border-emerald-600/30">
                <Check className="w-12 h-12 text-emerald-500" />
            </div>

            <h1 className="text-3xl font-black text-white mb-4">Your pet is registered.</h1>
            <p className="text-slate-400 text-lg mb-10 max-w-sm mx-auto">
                Baseline truth established. If your pet is ever lost, you&apos;ll be able to activate recovery immediately.
            </p>

            <div className="space-y-4 mb-10">
                <div className="bg-slate-800 p-6 rounded-2xl text-left border border-slate-700">
                    <div className="flex gap-4">
                        <div className="p-3 bg-blue-600/20 rounded-xl">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm mb-1">What happens now?</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">Your data is stored in the Identity Graph. No AI match scoring is shown until you report a loss event.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Button size="lg" className="w-full bg-slate-800 hover:bg-slate-700 text-white mb-3" onClick={onReset}>
                Back to Dashboard
            </Button>
            <button className="text-blue-500 text-sm font-bold hover:underline" onClick={onReset}>Add another pet</button>
        </div>
    );
}
