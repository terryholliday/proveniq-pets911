'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackgroundCheck, BackgroundCheckStatus } from '@/types/training';

// ============================================================================
// TYPES
// ============================================================================

interface BackgroundCheckPageData {
  check: BackgroundCheck | null;
  requiredForModules: string[];
  provider: {
    name: string;
    estimatedDays: string;
    cost: string;
  };
}

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

const STATUS_CONFIG: Record<BackgroundCheckStatus, {
  icon: string;
  title: string;
  description: string;
  color: 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'purple';
  showProgress?: boolean;
  progressStep?: number;
}> = {
  not_started: {
    icon: '🔒',
    title: 'Background Check Required',
    description: 'Complete a background check to unlock field training modules.',
    color: 'gray',
    showProgress: true,
    progressStep: 0,
  },
  pending: {
    icon: '⏳',
    title: 'Verification In Progress',
    description: 'Your background check has been submitted and is being processed.',
    color: 'amber',
    showProgress: true,
    progressStep: 1,
  },
  in_review: {
    icon: '🔍',
    title: 'Under Manual Review',
    description: 'Your background check requires additional review by our team.',
    color: 'purple',
    showProgress: true,
    progressStep: 2,
  },
  cleared: {
    icon: '✅',
    title: 'Background Check Cleared',
    description: 'Congratulations! You can now access all training modules.',
    color: 'green',
    showProgress: true,
    progressStep: 3,
  },
  flagged: {
    icon: '⚠️',
    title: 'Review Required',
    description: 'Your background check has been flagged for review. Please contact support.',
    color: 'amber',
  },
  failed: {
    icon: '❌',
    title: 'Not Approved',
    description: 'Unfortunately, your background check was not approved.',
    color: 'red',
  },
  expired: {
    icon: '⏰',
    title: 'Background Check Expired',
    description: 'Your background check has expired. Please complete a new one.',
    color: 'gray',
    showProgress: true,
    progressStep: 0,
  },
};

const PROGRESS_STEPS = [
  { label: 'Submit', description: 'Provide information' },
  { label: 'Processing', description: '2-5 business days' },
  { label: 'Review', description: 'Final verification' },
  { label: 'Complete', description: 'Access granted' },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function BackgroundCheckPage() {
  const router = useRouter();
  const [data, setData] = useState<BackgroundCheckPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/training/background-check');
      if (!response.ok) throw new Error('Failed to fetch background check status');
      const pageData = await response.json();
      setData(pageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheck = async () => {
    setStarting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/training/background-check/start', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start background check');
      }

      if (result.redirectUrl) {
        // Redirect to external provider (e.g., Checkr)
        window.location.href = result.redirectUrl;
      } else {
        // Refresh data
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start background check');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Failed to load page'}</p>
          <button
            onClick={() => router.push('/admin/training')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Training
          </button>
        </div>
      </div>
    );
  }

  const status = data.check?.status || 'not_started';
  const config = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/training')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Training
        </button>

        {/* Header Card */}
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
          config.color === 'green' ? 'ring-2 ring-green-500' : ''
        }`}>
          {/* Status Banner */}
          <div className={`px-6 py-6 ${
            config.color === 'green' ? 'bg-green-500 text-white' :
            config.color === 'red' ? 'bg-red-500 text-white' :
            config.color === 'amber' ? 'bg-amber-500 text-white' :
            config.color === 'purple' ? 'bg-purple-500 text-white' :
            config.color === 'blue' ? 'bg-blue-500 text-white' :
            'bg-gray-100 text-gray-900'
          }`}>
            <div className="text-center">
              <div className="text-5xl mb-3">{config.icon}</div>
              <h1 className="text-2xl font-bold">{config.title}</h1>
              <p className={`mt-2 ${
                ['green', 'red', 'amber', 'purple', 'blue'].includes(config.color) 
                  ? 'text-white/90' 
                  : 'text-gray-600'
              }`}>
                {config.description}
              </p>
            </div>
          </div>

          {/* Progress Tracker */}
          {config.showProgress && (
            <div className="px-6 py-6 border-b">
              <div className="flex items-center justify-between">
                {PROGRESS_STEPS.map((step, index) => {
                  const isComplete = config.progressStep !== undefined && index < config.progressStep;
                  const isCurrent = config.progressStep === index;
                  const isPending = config.progressStep !== undefined && index > config.progressStep;

                  return (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          isComplete ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isComplete ? '✓' : index + 1}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium ${
                            isComplete || isCurrent ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-400 hidden sm:block">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < PROGRESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${
                          isComplete ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            {/* Not Started State */}
            {status === 'not_started' && (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">What's Included:</h3>
                  <ul className="space-y-2">
                    {[
                      'National criminal database search',
                      'Sex offender registry check',
                      'Identity verification',
                      'County court records (where available)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-blue-800">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {data.provider.cost}
                    </p>
                    <p className="text-sm text-gray-500">Cost to You</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {data.provider.estimatedDays}
                    </p>
                    <p className="text-sm text-gray-500">Processing Time</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">1 Year</p>
                    <p className="text-sm text-gray-500">Validity</p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Privacy Note:</strong> Your information is encrypted and only used for 
                    verification purposes. Results are handled according to FCRA guidelines.
                  </p>
                </div>

                <button
                  onClick={handleStartCheck}
                  disabled={starting}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {starting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    'Start Background Check'
                  )}
                </button>
              </>
            )}

            {/* Pending State */}
            {status === 'pending' && (
              <>
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Submitted on{' '}
                    <strong>
                      {data.check?.submittedAt 
                        ? new Date(data.check.submittedAt).toLocaleDateString()
                        : 'Recently'
                      }
                    </strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    You'll receive an email when processing is complete.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>What happens next?</strong> Our partner{' '}
                    {data.provider.name} is verifying your information. This usually takes{' '}
                    {data.provider.estimatedDays}. You can continue with non-field training while waiting.
                  </p>
                </div>
              </>
            )}

            {/* In Review State */}
            {status === 'in_review' && (
              <>
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    A member of our team is reviewing your background check.
                    We may contact you if additional information is needed.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Note:</strong> Manual review is standard procedure for certain cases 
                    and doesn't necessarily indicate an issue. Average review time is 1-2 business days.
                  </p>
                </div>
              </>
            )}

            {/* Cleared State */}
            {status === 'cleared' && (
              <>
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Your background check is valid until{' '}
                    <strong>
                      {data.check?.expiresAt 
                        ? new Date(data.check.expiresAt).toLocaleDateString()
                        : 'No expiration'
                      }
                    </strong>
                  </p>
                </div>

                <button
                  onClick={() => router.push('/admin/training')}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  Continue to Training →
                </button>
              </>
            )}

            {/* Flagged State */}
            {status === 'flagged' && (
              <>
                <div className="p-4 bg-amber-50 rounded-lg mb-6">
                  <p className="text-amber-800">
                    Our team needs to review your background check results. This may be due to 
                    a common name match or incomplete records. Please contact support for assistance.
                  </p>
                </div>

                <a
                  href="mailto:support@PetMayday.org?subject=Background%20Check%20Review"
                  className="block w-full py-3 bg-amber-600 text-white rounded-xl font-medium text-center hover:bg-amber-700"
                >
                  Contact Support
                </a>
              </>
            )}

            {/* Failed State */}
            {status === 'failed' && (
              <>
                <div className="p-4 bg-red-50 rounded-lg mb-6">
                  <p className="text-red-800">
                    Based on our volunteer safety requirements, we're unable to approve your 
                    background check at this time. If you believe this is an error, you may 
                    submit an appeal.
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href="mailto:appeals@PetMayday.org?subject=Background%20Check%20Appeal"
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-center hover:bg-gray-50"
                  >
                    Appeal Decision
                  </a>
                  <button
                    onClick={() => router.push('/admin/training')}
                    className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700"
                  >
                    Back to Training
                  </button>
                </div>
              </>
            )}

            {/* Expired State */}
            {status === 'expired' && (
              <>
                <div className="p-4 bg-gray-100 rounded-lg mb-6">
                  <p className="text-gray-700">
                    Your previous background check expired on{' '}
                    <strong>
                      {data.check?.expiresAt 
                        ? new Date(data.check.expiresAt).toLocaleDateString()
                        : 'an unknown date'
                      }
                    </strong>. 
                    Please complete a new background check to maintain access to field training.
                  </p>
                </div>

                <button
                  onClick={handleStartCheck}
                  disabled={starting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {starting ? 'Starting...' : 'Renew Background Check'}
                </button>
              </>
            )}

            {/* Modules Requiring Background Check */}
            {data.requiredForModules.length > 0 && status !== 'cleared' && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">
                  Unlocks Access To:
                </h3>
                <ul className="space-y-2">
                  {data.requiredForModules.map((module, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {module}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Why is a background check required?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-3 text-gray-600 text-sm">
                As a nonprofit working with vulnerable animals and community members, we follow 
                industry best practices (ASPCA, Best Friends) to ensure volunteer safety. 
                Background checks help protect everyone involved.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">What information do you check?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-3 text-gray-600 text-sm">
                We check national criminal databases, sex offender registries, and verify 
                your identity. We do NOT check credit scores, employment history, or social media.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Will a past record disqualify me?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-3 text-gray-600 text-sm">
                Not necessarily. We evaluate each case individually based on the nature of the 
                offense, how long ago it occurred, and the volunteer role. Certain serious 
                offenses may result in restrictions.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">How is my information protected?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-3 text-gray-600 text-sm">
                All data is encrypted and handled according to FCRA (Fair Credit Reporting Act) 
                guidelines. Only authorized personnel can view results, and information is 
                never shared with third parties.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
