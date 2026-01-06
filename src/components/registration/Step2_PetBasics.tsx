'use client';

import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step2_PetBasics({ data, update, onNext, onBack }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void, onBack: () => void }) {
    const isValid = data.petName.trim() && data.species && data.breed.trim() && data.sex && data.size;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Pet Basics</h2>
            <p className="text-slate-400 mb-8">Structured metadata for recovery precision.</p>

            <Card className="bg-slate-800 border-slate-700 shadow-2xl">
                <CardContent className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pet Name</label>
                        <input
                            type="text"
                            value={data.petName}
                            onChange={(e) => update({ petName: e.target.value })}
                            className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Luna"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Species</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => update({ species: 'Dog' })}
                                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${data.species === 'Dog' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                            >
                                🐶 Dog
                            </button>
                            <button
                                onClick={() => update({ species: 'Cat' })}
                                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${data.species === 'Cat' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                            >
                                🐱 Cat
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Breed</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="text"
                                value={data.breed}
                                onChange={(e) => update({ breed: e.target.value })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. Mixed / Unknown"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sex</label>
                            <select
                                value={data.sex}
                                onChange={(e) => update({ sex: e.target.value as any })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Size</label>
                            <select
                                value={data.size}
                                onChange={(e) => update({ size: e.target.value as any })}
                                className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-4 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="">Select</option>
                                <option value="Small">Small (0-20 lbs)</option>
                                <option value="Medium">Medium (21-50 lbs)</option>
                                <option value="Large">Large (51-90 lbs)</option>
                                <option value="XL">Extra Large (90+ lbs)</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4 mt-8">
                <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    onClick={onBack}
                >
                    <ChevronLeft className="mr-2 w-5 h-5" />
                    Back
                </Button>
                <Button
                    size="lg"
                    className="flex-[2] bg-blue-600 hover:bg-blue-500"
                    disabled={!isValid}
                    onClick={onNext}
                >
                    Next
                    <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
