import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TechErrorLog',
  description: 'Understand how TechErrorLog collects, safeguards, and handles analytical cookie tokens and administrative details.',
  alternates: {
    canonical: 'https://techerrorlog.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div id="privacy-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main id="privacy-container" className="flex-grow bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
          
          <h1 className="text-slate-900 font-extrabold text-3.5xl md:text-4xl tracking-tight mb-6 leading-tight">
            Privacy Policy
          </h1>
          
          <p className="text-slate-400 text-xs font-mono mb-8 uppercase tracking-wider">
            Last Updated: June 8, 2026
          </p>

          <section className="space-y-6 text-slate-600 text-xs leading-relaxed font-sans font-normal">
            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">1. Information We Collect</h2>
            <p>
              TechErrorLog is primarily an informational search directory. We do not require account registration from standard readers. We only collect standard non-identifying technical logs automatically provided by your browser (e.g., User-Agent string, browser language preferences, IP address metrics, and search queries).
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">2. Cookies and Advertisements</h2>
            <p>
              We integrate official partners (such as Google AdSense) to show relevant, interest-based advertisements inside our layout grid. These networks use standard cookies (like double-click tokens) to serve ads based on your visits to our pages and other properties across the web.
            </p>
            <p>
              You may opt out of personalized browsing advertisements at any time by configuring your browser to block third-party cookies or adjusting settings inside Google Account Profiles.
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">3. Analytic Systems</h2>
            <p>
              To maintain the performance and security of our diagnostic directories, we inspect standard web traffic patterns. This helps us prioritize which Windows error codes and DLL problems are currently most cataloged or trending globally.
            </p>

            <h2 className="text-slate-900 font-bold text-base tracking-tight mb-2">4. Third-Party Connections and Outbound Links</h2>
            <p>
              Our playbooks reference official resource packages, such as Microsoft Support and the Microsoft Update Catalog. This policy governs only this Web domain; once you navigate to external domains, their corresponding privacy terms apply immediately.
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
