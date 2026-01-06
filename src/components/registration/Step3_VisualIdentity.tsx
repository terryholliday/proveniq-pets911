'use client';

import { Camera, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RegistrationData } from './RegisterFlow';

export function Step3_VisualIdentity({ data, update, onNext, onBack }: { data: RegistrationData, update: (u: Partial<RegistrationData>) => void, onNext: () => void, onBack: () => void }) {
    const isComplete = !!(data.photos.fullBody && data.photos.face && data.photos.distinctive);

    const handlePhotoUpload = (category: keyof typeof data.photos) => {
        // Mock upload - in real app would use a file input and a service
        const mockUrl = `/api/mock-upload?cat=${category}&t=${Date.now()}`;
        update({
            photos: {
                ...data.photos,
                [category]: mockUrl
            }
        });
    };

    const PhotoSlot = ({ category, label, description }: { category: keyof typeof data.photos, label: string, description: string }) => {
        const isUploaded = !!data.photos[category];
        return (
            <div
                onClick={() => handlePhotoUpload(category)}
                className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isUploaded ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-blue-500 hover:bg-slate-800'}`}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold ${isUploaded ? 'text-emerald-400' : 'text-slate-300 group-hover:text-blue-400'}`}>{label}</h4>
                        {isUploaded ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Camera className="w-5 h-5 text-slate-600 group-hover:text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{description}</p>

                    {isUploaded ? (
                        <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center border border-emerald-500/30">
                            <span className="text-xs text-emerald-500/70 font-mono">PHOTO_HASH_READY</span>
                        </div>
                    ) : (
                        <div className="h-32 bg-slate-900/80 rounded-lg flex flex-col items-center justify-center border border-slate-700">
                            <span className="text-xs text-slate-700">Tap to upload</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Visual Identity</h2>
            <p className="text-slate-400 mb-8">Clear photos dramatically increase recovery speed.</p>

            <div className="space-y-4 mb-4">
                <PhotoSlot
                    category="fullBody"
                    label="1. Full Body"
                    description="Standing if possible. Shows size and coat pattern."
                />
                <PhotoSlot
                    category="face"
                    label="2. Face / Head"
                    description="Front-facing. Eyes and ears clearly visible."
                />
                <PhotoSlot
                    category="distinctive"
                    label="3. Unique Feature"
                    description="Marking, tail, ear, or other unique trait."
                />
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-8">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                        <strong>Smart Guidance:</strong> Our system performs passive quality checks on upload. Blurry or duplicate photos may be flagged for review.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 bg-slate-800 border-slate-700 text-slate-300"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    size="lg"
                    className="flex-[2] bg-blue-600 hover:bg-blue-500"
                    disabled={!isComplete}
                    onClick={onNext}
                >
                    Photos Look Good
                    <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
