'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Resolved Error Boundary:', error);
  }, [error]);

  return (
    <div id="error-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main id="error-container" className="flex-grow flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide">System Diagnostic Event</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">Diagnostic Error</h1>
          <p className="mt-2 text-base text-slate-500">An unexpected system diagnostic event has occurred during compilation or rendering.</p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Retry Session
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Go back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
