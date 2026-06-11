'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';

interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

interface BlogTOCProps {
  headings: TOCHeading[];
  variant?: 'sidebar' | 'mobile';
}

const headingTextMap: { [key: string]: string } = {
  'introduction': 'Overview',
  'overview': 'Overview',
  'symptoms-root-causes': 'What Causes This?',
  'deep-resolution-methods': 'Quick Fix Solution',
  'alternative-methods': 'Alternative Methods',
  'faq-assistance': 'FAQ Assistance',
  'related-error-codes': 'Related Error Codes',
};

// Default items if headings are empty during loading, keeping list complete
const defaultHeadingsList = [
  { id: 'introduction', text: 'Overview', level: 3 },
  { id: 'symptoms-root-causes', text: 'What Causes This?', level: 3 },
  { id: 'deep-resolution-methods', text: 'Quick Fix Solution', level: 3 },
  { id: 'alternative-methods', text: 'Alternative Methods', level: 3 },
  { id: 'faq-assistance', text: 'FAQ Assistance', level: 3 },
  { id: 'related-error-codes', text: 'Related Error Codes', level: 3 },
];

export default function BlogTOC({ headings, variant = 'sidebar' }: BlogTOCProps) {
  // Force exactly the 6-heading canonical structure for consistency across all articles
  const displayHeadings = defaultHeadingsList;

  const [activeId, setActiveId] = useState<string>(() => displayHeadings[0]?.id || '');
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (displayHeadings.length === 0) return;

    const handleScrollEvent = () => {
      // If programmatically scrolling from a click event, preserve current active selection and ignore intersections
      if (isScrollingRef.current) return;

      const windowScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      
      // Force active ID to be first if scrolled back up to top
      if (windowScrollY < 120) {
        setActiveId(displayHeadings[0]?.id || '');
        return;
      }

      // Check client rect tops from first to last to find the last elapsed heading block
      let activeHeadingId = displayHeadings[0]?.id || '';
      
      for (let i = 0; i < displayHeadings.length; i++) {
        const heading = displayHeadings[i];
        const element = document.getElementById(heading.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Offset conforms with header spacing and scrolling margins (145px)
          if (rect.top <= 145) {
            activeHeadingId = heading.id;
          }
        }
      }
      
      setActiveId(activeHeadingId);
    };

    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    handleScrollEvent(); // Trigger initial execution
    
    // Periodically run standard alignment sweeps to handle async content/font layouts
    const interval = setInterval(handleScrollEvent, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 4000);

    return () => {
      window.removeEventListener('scroll', handleScrollEvent);
      clearInterval(interval);
      clearTimeout(timeout);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [displayHeadings]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      isScrollingRef.current = true;
      setActiveId(id);

      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      
      window.history.pushState(null, '', `#${id}`);

      // Lift scroll locking once deceleration completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  if (variant === 'mobile') {
    return (
      <div id="blog-toc-mobile-container" className="bg-slate-50/80 border border-slate-200/75 rounded-2xl p-4.5 mb-6 select-none shadow-[0_1px_3px_rgba(0,0,0,0.015)] dark:bg-slate-900/30 dark:border-slate-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left text-slate-800 dark:text-slate-300 font-bold text-xs cursor-pointer"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <List className="w-3.5 h-3.5" />
            </div>
            <span className="uppercase font-mono font-extrabold tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
              Table of Contents
            </span>
          </div>
          <div className="text-slate-400 dark:text-slate-500">
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          </div>
        </button>

        {isOpen && (
          <nav id="blog-toc-mobile-navigation" className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-medium">
            {displayHeadings.map((heading) => {
              const isActive = activeId === heading.id;
              const displayLabel = headingTextMap[heading.id] || heading.text;
              
              return (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(e) => handleScroll(e, heading.id)}
                  className={`text-xs flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all duration-155 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 border-blue-200/70 text-blue-600 font-bold shadow-sm dark:bg-blue-950/20 dark:border-blue-500/35 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white hover:border-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <span className="truncate">{displayLabel}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0 ml-2 animate-pulse" />
                  )}
                </a>
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  return (
    <div id="blog-toc-container" className="sticky top-24 py-2 select-none">
      <h4 className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] mb-4 dark:text-slate-500">
        Table of Contents
      </h4>
      
      <nav id="blog-toc-navigation" className="space-y-1.5 flex flex-col">
        {displayHeadings.map((heading) => {
          const isActive = activeId === heading.id;
          const displayLabel = headingTextMap[heading.id] || heading.text;
          
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => handleScroll(e, heading.id)}
              className={`text-xs flex items-center justify-between px-3 py-2 rounded-r-md border-l-2 transition-all duration-155 group cursor-pointer ${
                isActive
                  ? 'bg-blue-50/70 border-blue-600 text-blue-600 font-bold dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800/30'
              }`}
            >
              <span className="truncate">{displayLabel}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0 ml-2 animate-pulse" />
              )}
            </a>
          );
        })}
      </nav>

      {/* Note in bottom corner */}
      <div id="blog-toc-help-note" className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-1.5">
        <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans tracking-tight">Need immediate help?</h5>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          Follow methods in sequence. Most systems recover fully by completing Method 1.
        </p>
      </div>
    </div>
  );
}
