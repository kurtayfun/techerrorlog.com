import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | TechErrorLog',
  description: 'Learn about our mission to curate precise, verified, and clutter-free diagnostic workflows for Windows operating systems.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div id="about-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main id="about-container" className="flex-grow bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
          
          <h1 className="text-slate-900 font-extrabold text-3.5xl md:text-4xl tracking-tight mb-6 leading-tight">
            About TechErrorLog
          </h1>
          
          <p className="text-slate-500 text-sm leading-relaxed mb-8 font-sans">
            TechErrorLog is a highly specialized, clutter-free diagnostic directory designed to help system administrators, IT professionals, developers, and power users resolve operating system errors quickly and safely.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/30">
              <h2 className="text-slate-900 font-bold text-base mb-3 tracking-tight">Our Mission</h2>
              <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal">
                To isolate complex error chains (DLL files, Blue Screen kernel crashes, failed update packages) and provide verified, sequential checklists containing official Windows administrative tools—excluding the heavy advertisements and fluff typical of technical blogs.
              </p>
            </div>
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/30">
              <h2 className="text-slate-900 font-bold text-base mb-3 tracking-tight">Curation Standards</h2>
              <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal">
                Every guide published on our directory undergoes a strict replication test to define the precise root cause, high-probability resolution vectors, and standard security boundaries across active Windows partitions.
              </p>
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-slate-900 font-bold text-lg tracking-tight">Zero Placement Distractions</h2>
            <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal">
              We design are structures specifically around page-load efficiency and user ergonomics. Standard banner placements are reserved cleanly inside the grid alignment layout to prevent Cumulative Layout Shift (CLS) or cognitive overload during high-stress troubleshooting situations.
            </p>
            
            <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal">
              Need to contact our technical team? We maintain complete repositories to assist our readers on active forums and updates. Browse our dynamic guides to start debugging.
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
