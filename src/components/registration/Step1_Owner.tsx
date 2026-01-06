'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step1_Owner({ data, update, onNext }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void }) {
    const isValid = data.ownerName.trim() && data.phone.trim() && data.zipCode.trim();

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Owner Context</h2>
            <p className="text-slate-400 mb-8">Establish responsibility without over-sharing.</p>

            <Card className="bg-slate-800 border-slate-700 shadow-2xl">
                <CardContent className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">First Name (Required)</label>
                        <input
                            type="text"
                            value={data.ownerName}
                            onChange={(e) => update({ ownerName: e.target.value })}
                            className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Terry"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number (Required)</label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => update({ phone: e.target.value })}
                            className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="(304) 555-0123"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Zip Code</label>
                            <input
                                type="text"
                                value={data.zipCode}
                                onChange={(e) => update({ zipCode: e.target.value })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="24901"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">County</label>
                            <select
                                value={data.county}
                                onChange={(e) => update({ county: e.target.value })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="">Select County</option>
                                <option value="GREENBRIER">Greenbrier</option>
                                <option value="KANAWHA">Kanawha</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-xs text-blue-300 leading-relaxed">
                            Your contact information is only shared with verified finders or shelters during an active lost case.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Button
                size="lg"
                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform"
                disabled={!isValid}
                onClick={onNext}
            >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
        </div>
    );
}
