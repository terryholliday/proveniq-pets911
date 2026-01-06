'use client';

import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step4_Marks({ data, update, onNext, onBack }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void, onBack: () => void }) {
    const addMark = () => {
        update({
            marks: [...data.marks, { id: crypto.randomUUID(), type: '', location: '', description: '' }]
        });
    };

    const removeMark = (id: string) => {
        update({ marks: data.marks.filter(m => m.id !== id) });
    };

    const updateMark = (id: string, updates: Partial<RegistrationData['marks'][0]>) => {
        update({
            marks: data.marks.map(m => m.id === id ? { ...m, ...updates } : m)
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">What makes your pet unique?</h2>
            <p className="text-slate-400 mb-8">Help finders distinguish your pet from others.</p>

            <div className="space-y-4 mb-8">
                {data.marks.map((mark) => (
                    <Card key={mark.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <select
                                    value={mark.type}
                                    onChange={(e) => updateMark(mark.id, { type: e.target.value })}
                                    className="bg-slate-900 border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select Mark Type</option>
                                    <option value="Scar">Scar</option>
                                    <option value="Marking">Unique Marking</option>
                                    <option value="Limb">Missing toe / limb</option>
                                    <option value="Tail">Docked tail</option>
                                    <option value="Ears">Cropped ears</option>
                                    <option value="Eyes">Different colored eyes</option>
                                    <option value="Gait">Limp / gait issue</option>
                                    <option value="Other">Other</option>
                                </select>
                                <button onClick={() => removeMark(mark.id)} className="text-slate-500 hover:text-red-400 p-1">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Where is it? (e.g. Left front paw)"
                                value={mark.location}
                                onChange={(e) => updateMark(mark.id, { location: e.target.value })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            <textarea
                                placeholder="Description (e.g. White patch shaped like a triangle)"
                                value={mark.description}
                                onChange={(e) => updateMark(mark.id, { description: e.target.value })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                            />
                        </CardContent>
                    </Card>
                ))}

                <button
                    onClick={addMark}
                    className="w-full py-6 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-400 transition-all"
                >
                    <Plus className="w-6 h-6" />
                    <span className="font-bold text-sm">Add a Unique Mark</span>
                </button>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>Back</Button>
                <Button size="lg" className="flex-[2]" onClick={onNext}>Next</Button>
            </div>
        </div>
    );
}
