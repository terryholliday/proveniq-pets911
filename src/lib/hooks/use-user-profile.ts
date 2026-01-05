'use client';

import { useState, useEffect } from 'react';
import type { County } from '@/lib/types';

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isCurrent: boolean;
  movedIn?: string;
  movedOut?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  county: County | '';
  addresses: Address[];
  completedOnboarding: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'proveniq_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  phone: '',
  email: '',
  county: '',
  addresses: [],
  completedOnboarding: false,
  createdAt: '',
};

/**
 * Hook to manage user profile stored in localStorage
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        setProfile(null);
      }
    }
    setIsLoading(false);
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates } as UserProfile;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  const hasCompletedOnboarding = profile?.completedOnboarding ?? false;

  const currentAddress = profile?.addresses.find(a => a.isCurrent);
  const previousAddresses = profile?.addresses.filter(a => !a.isCurrent) ?? [];

  return {
    profile,
    isLoading,
    hasCompletedOnboarding,
    currentAddress,
    previousAddresses,
    updateProfile,
    clearProfile,
  };
}

/**
 * Check if onboarding is needed (for use in pages)
 */
export function useOnboardingCheck() {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setNeedsOnboarding(true);
      return;
    }
    try {
      const profile = JSON.parse(stored);
      setNeedsOnboarding(!profile.completedOnboarding);
    } catch {
      setNeedsOnboarding(true);
    }
  }, []);

  return needsOnboarding;
}
