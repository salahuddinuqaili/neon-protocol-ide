"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-background text-text-main p-8">
          <div className="w-full max-w-md bg-surface border border-accent-error p-6">
            <div className="flex items-center gap-2 mb-4 text-accent-error">
              <span className="material-symbols-outlined text-xl">error</span>
              <h2 className="text-sm font-bold uppercase tracking-widest">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
            </div>
            <p className="text-xs font-mono text-muted mb-4 break-all">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-background text-xs font-bold uppercase tracking-widest hover:bg-[#0cf1f1] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
