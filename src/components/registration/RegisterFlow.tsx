'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Step0_Entry } from './Step0_Entry';
import { Step1_Owner } from './Step1_Owner';
import { Step2_PetBasics } from './Step2_PetBasics';
import { Step3_VisualIdentity } from './Step3_VisualIdentity';
import { Step4_Marks } from './Step4_Marks';
import { Step5_Behavior } from './Step5_Behavior';
import { Step6_Microchip } from './Step6_Microchip';
import { Step7_Review } from './Step7_Review';
import { Step8_Success } from './Step8_Success';

export interface RegistrationData {
    // Screen 1: Owner Context
    ownerName: string;
    phone: string;
    email: string;
    zipCode: string;
    county: string;

    // Screen 2: Pet Basics
    petName: string;
    species: 'Dog' | 'Cat' | '';
    breed: string;
    sex: 'Male' | 'Female' | '';
    size: 'Small' | 'Medium' | 'Large' | 'XL' | '';
    approxAge: number;
    isNeutered: boolean | null;

    // Screen 3: Visual Identity
    photos: {
        fullBody: string | null;
        face: string | null;
        distinctive: string | null;
    };

    // Screen 4: Distinctive Marks
    marks: {
        id: string;
        type: string;
        location: string;
        description: string;
    }[];

    // Screen 5: Collar & Behavior
    hasCollar: boolean | null;
    collarColors: string;
    hasHarness: boolean | null;
    hasTags: boolean | null;
    gpsBrand: string;
    behaviorFlags: {
        friendly: boolean;
        shy: boolean;
        boltIfChased: boolean;
        respondsToName: boolean;
        foodMotivated: boolean;
    };

    // Screen 6: Microchip
    microchipNumber: string;
    microchipRegistry: string;
    implantLocation: string;
}

const INITIAL_DATA: RegistrationData = {
    ownerName: '',
    phone: '',
    email: '',
    zipCode: '',
    county: '',
    petName: '',
    species: '',
    breed: '',
    sex: '',
    size: '',
    approxAge: 1,
    isNeutered: null,
    photos: {
        fullBody: null,
        face: null,
        distinctive: null,
    },
    marks: [],
    hasCollar: null,
    collarColors: '',
    hasHarness: null,
    hasTags: null,
    gpsBrand: '',
    behaviorFlags: {
        friendly: false,
        shy: false,
        boltIfChased: false,
        respondsToName: false,
        foodMotivated: false,
    },
    microchipNumber: '',
    microchipRegistry: '',
    implantLocation: 'Standard (Between shoulder blades)',
};

const STEPS = [
    'Welcome',
    'Owner Context',
    'Pet Basics',
    'Visual Identity',
    'Distinctive Marks',
    'Collar & Behavior',
    'Microchip',
    'Review',
    'Success'
];

export function RegisterFlow() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<RegistrationData>(INITIAL_DATA);

    // Load saved progress
    useEffect(() => {
        const saved = localStorage.getItem('pets911_registration_draft');
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved registration', e);
            }
        }
    }, []);

    // Save progress on change
    useEffect(() => {
        if (currentStep > 0 && currentStep < 8) {
            localStorage.setItem('pets911_registration_draft', JSON.stringify(data));
        }
    }, [data, currentStep]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const updateData = (updates: Partial<RegistrationData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleComplete = () => {
        // In a real app, this would send to Supabase/Backend
        console.log('Final Registration Data:', data);
        localStorage.removeItem('pets911_registration_draft');
        handleNext(); // To success state
    };

    return (
        <div className="min-h-screen bg-slate-900 pb-20">
            {/* Progress Bar (Visible from Step 1 onwards) */}
            {currentStep > 0 && currentStep < 8 && (
                <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-800 z-50">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>
            )}

            <div className="max-w-xl mx-auto px-4 pt-12">
                {currentStep === 0 && <Step0_Entry onNext={handleNext} />}
                {currentStep === 1 && <Step1_Owner data={data} update={updateData} onNext={handleNext} />}
                {currentStep === 2 && <Step2_PetBasics data={data} update={updateData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 3 && <Step3_VisualIdentity data={data} update={updateData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 4 && <Step4_Marks data={data} update={updateData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 5 && <Step5_Behavior data={data} update={updateData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 6 && <Step6_Microchip data={data} update={updateData} onNext={handleNext} onBack={handleBack} />}
                {currentStep === 7 && <Step7_Review data={data} onComplete={handleComplete} onBack={handleBack} />}
                {currentStep === 8 && <Step8_Success onReset={() => router.push('/')} />}
            </div>
        </div>
    );
}
