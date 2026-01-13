'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CertificationStatus } from '@/types/training';

interface VerificationResult {
  valid: boolean;
  certificate?: {
    certificateNumber: string;
    holderName: string;
    title: string;
    issuedAt: string;
    expiresAt?: string;
    status: CertificationStatus;
  };
  error?: string;
}

export function CertificateVerificationPage() {
  const params = useParams();
  const hash = params?.hash as string;
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (hash) {
      verifyCertificate(hash);
    }
  }, [hash]);

  const verifyCertificate = async (verificationHash: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/training/verify/${verificationHash}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: 'Failed to verify certificate. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This verification link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig: Record<CertificationStatus, { color: string; label: string; icon: string }> = {
    active: { color: 'green', label: 'Active', icon: '✓' },
    expired: { color: 'gray', label: 'Expired', icon: '⏰' },
    suspended: { color: 'amber', label: 'Suspended', icon: '⚠️' },
    revoked: { color: 'red', label: 'Revoked', icon: '✗' },
    superseded: { color: 'blue', label: 'Superseded', icon: '↑' },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PetMayday Certificate Verification</h1>
          <p className="text-gray-600 mt-1">Official verification of volunteer credentials</p>
        </div>

        {/* Result Card */}
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
          result.valid ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
        }`}>
          {/* Status Banner */}
          <div className={`px-6 py-4 ${result.valid ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="flex items-center justify-center gap-3 text-white">
              <span className="text-2xl">{result.valid ? '✓' : '✗'}</span>
              <span className="text-xl font-semibold">
                {result.valid ? 'Valid Certificate' : 'Invalid Certificate'}
              </span>
            </div>
          </div>

          <div className="p-6">
            {result.valid && result.certificate ? (
              <>
                {/* Certificate Details */}
                <div className="space-y-4">
                  {/* Holder Name */}
                  <div className="text-center pb-4 border-b">
                    <p className="text-sm text-gray-500">Certificate Holder</p>
                    <p className="text-2xl font-bold text-gray-900">{result.certificate.holderName}</p>
                  </div>

                  {/* Certification */}
                  <div className="text-center pb-4 border-b">
                    <p className="text-sm text-gray-500">Certification</p>
                    <p className="text-lg font-semibold text-gray-900">{result.certificate.title}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Certificate Number</p>
                      <p className="font-medium text-gray-900">{result.certificate.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-${statusConfig[result.certificate.status].color}-100 text-${statusConfig[result.certificate.status].color}-800`}>
                        {statusConfig[result.certificate.status].icon}
                        {statusConfig[result.certificate.status].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(result.certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {result.certificate.expiresAt ? 'Expiration Date' : 'Validity'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {result.certificate.expiresAt 
                          ? new Date(result.certificate.expiresAt).toLocaleDateString()
                          : 'No Expiration'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Verified by PetMayday Training Academy</p>
                      <p className="text-sm text-green-600">
                        Verified at {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Error Details */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">❌</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {result.error || 'This certificate could not be verified.'}
                  </p>
                  
                  {result.certificate && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                      <p className="text-sm text-gray-500 mb-2">Certificate Details:</p>
                      <p className="font-medium">{result.certificate.holderName}</p>
                      <p className="text-sm text-gray-600">{result.certificate.title}</p>
                      <p className="text-sm text-red-600 mt-2">
                        Status: {statusConfig[result.certificate.status]?.label || result.certificate.status}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Questions about this certificate?</p>
          <a href="mailto:verify@PetMayday.org" className="text-blue-600 hover:underline">
            Contact verify@PetMayday.org
          </a>
        </div>

        {/* PetMayday Branding */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <span className="text-xl">🐾</span>
            <span className="font-medium">PetMayday Training Academy</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            PROVENIQ Charitable Trust
          </p>
        </div>
      </div>
    </div>
  );
}

export default CertificateVerificationPage;
