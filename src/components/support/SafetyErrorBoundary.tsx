/**
 * SafetyErrorBoundary Component
 * Catches errors and displays a safe fallback with crisis hotline
 * Ensures users in crisis can still access help even if the app breaks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface SafetyErrorBoundaryProps {
  children: ReactNode;
  fallbackHotline?: string;
  fallbackHotlineName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface SafetyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that shows crisis hotline on error
 * Ensures users can still get help even if the app crashes
 */
export class SafetyErrorBoundary extends Component<
  SafetyErrorBoundaryProps,
  SafetyErrorBoundaryState
> {
  constructor(props: SafetyErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }
  
  static getDerivedStateFromError(error: Error): SafetyErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error but don't send to analytics in crisis context
    // to avoid leaking sensitive data
    console.error('Support Companion Error:', error, errorInfo);
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };
  
  render(): ReactNode {
    if (this.state.hasError) {
      const hotline = this.props.fallbackHotline || '988';
      const hotlineName = this.props.fallbackHotlineName || 'Suicide & Crisis Lifeline';
      
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              
              <h2 className="text-white text-2xl font-bold mb-2">
                Something went wrong
              </h2>
              
              <p className="text-slate-400 mb-6">
                We're sorry, but something unexpected happened. If you're in crisis, please reach out for help.
              </p>
            </div>
            
            <div className="space-y-4">
              <a
                href={`tel:${hotline}`}
                className="block w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl text-xl font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/50"
                role="button"
                aria-label={`Call ${hotlineName} at ${hotline}`}
              >
                📞 Call {hotline} Now
              </a>
              
              <p className="text-slate-500 text-sm">
                {hotlineName} — Available 24/7
              </p>
              
              <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm mb-3">
                  Or text HOME to 741741
                </p>
                
                <button
                  onClick={this.handleRetry}
                  className="text-slate-400 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default SafetyErrorBoundary;
