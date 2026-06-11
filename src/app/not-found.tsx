import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div id="notfound-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main id="notfound-container" className="flex-grow flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">404 Error</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">Page not found</h1>
          <p className="mt-2 text-base text-slate-500">Sorry, we couldn’t find the page you’re looking for or the diagnostics document.</p>
          <div className="mt-6">
            <Link
              id="notfound-back-home"
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
