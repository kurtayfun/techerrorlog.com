import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | TechErrorLog',
  description: 'Review the terms of use and professional liability disclaimers for executing administrative command logs and tools.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div id="terms-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main id="terms-container" className="flex-grow bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
          
          <h1 className="text-slate-900 font-extrabold text-3.5xl md:text-4xl tracking-tight mb-6 leading-tight">
            Terms of Service
          </h1>
          
          <p className="text-slate-400 text-xs font-mono mb-8 uppercase tracking-wider">
            Last Updated: June 8, 2026
          </p>

          <section className="space-y-6 text-slate-600 text-xs leading-relaxed font-sans font-normal">
            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using TechErrorLog, you agree to comply with and be bound by the following terms, disclaimers, and conditions of use. If you do not accept these specifications, you are advised to exit our directory.
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">2. Educational & Informational Disclaimer</h2>
            <p className="font-semibold text-slate-800">
              Disclaimer: The diagnostic resolutions, command lines (including DISM, SFC, registry modifications), and tools described on our pages are compiled solely for informational and educational diagnostics.
            </p>
            <p>
              While our technical staff validates all steps, executing operational commands or editing systems files carries risks of software conflicts. TechErrorLog, its team members, and associates cannot be held responsible for system crashes, data loss, or boot errors occurring as a consequence of executing instructions published inside these directories.
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">3. Proprietary Material and Layouts</h2>
            <p>
              The visual structure, branding, custom SVG code layouts, and parsed descriptions of these guides are the intellectual property of TechErrorLog. Direct scraping, republishing, or cloning of these directories without credit violates trademark protections.
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">4. Scope Changes</h2>
            <p>
              We reserve complete authority to update, replace, or archive guide references or categories at any time without prior notifications.
            </p>
          </section>

          {/* Removed middle links card to prevent duplication with footer */}

        </div>
      </main>

      {/* Standardized Core Global Footer */}
      <footer id="app-footer" className="bg-white border-t border-slate-100/90 py-6 text-center text-xs text-slate-400 font-mono select-none mt-auto">
        <div id="footer-inner" className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span>© {new Date().getFullYear()} TechErrorLog.com</span>
            <div className="flex items-center justify-center gap-3">
              <Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            </div>
          </div>
          <span className="flex items-center gap-2 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Systems Operational</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
