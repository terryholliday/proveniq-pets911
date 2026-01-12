'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShadowingManagement } from '@/components/training/ShadowingManagement';

interface ModuleShadowingData {
  moduleId: string;
  moduleTitle: string;
  requiredHours: number;
  records: {
    id: string;
    moduleId: string;
    moduleTitle: string;
    mentorId: string;
    mentorName: string;
    mentorEmail?: string;
    sessionDate: Date;
    hours: number;
    activityType: string;
    activityDescription?: string;
    location?: string;
    verified: boolean;
    verifiedAt?: Date;
    mentorNotes?: string;
    mentorRating?: number;
    createdAt: Date;
  }[];
  availableMentors: {
    id: string;
    name: string;
    email: string;
    certifications: string[];
    location?: string;
  }[];
}

export default function LogShadowingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [data, setData] = useState<ModuleShadowingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchShadowingData();
    }
  }, [slug]);

  const fetchShadowingData = async () => {
    try {
      const response = await fetch(`/api/training/module/${slug}/shadowing`);
      if (!response.ok) {
        throw new Error('Failed to fetch shadowing data');
      }
      const shadowingData = await response.json();
      setData(shadowingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shadowing log...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Failed to load shadowing data'}</p>
          <button
            onClick={() => router.push(`/admin/training/${slug}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/admin/training/${slug}`)}
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          ← Back to {data.moduleTitle}
        </button>

        {/* Shadowing Management Component */}
        <ShadowingManagement
          userId="" // Will be populated from session
          moduleId={data.moduleId}
          moduleTitle={data.moduleTitle}
          requiredHours={data.requiredHours}
          existingRecords={data.records}
          availableMentors={data.availableMentors}
          onRecordAdded={(record) => {
            setData(prev => prev ? {
              ...prev,
              records: [record, ...prev.records]
            } : null);
          }}
        />

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Shadowing Guidelines
          </h3>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Find a Certified Mentor</p>
                <p>Connect with a certified volunteer in your area who can supervise your practice sessions.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Schedule Sessions</p>
                <p>Coordinate with your mentor to schedule shadowing sessions. Sessions should be at least 30 minutes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Log Your Hours</p>
                <p>After each session, log your hours here. Your mentor will receive a verification request.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Await Verification</p>
                <p>Your mentor will verify each session. Once all hours are verified, you can proceed to certification.</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Need help finding a mentor?</strong> Contact{' '}
              <a href="mailto:mentors@pet911.org" className="text-indigo-600 hover:underline">
                mentors@pet911.org
              </a>{' '}
              and we'll connect you with someone in your area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
