'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Monitor, 
  RefreshCw, 
  Settings, 
  Cpu, 
  Wifi, 
  HardDrive, 
  ChevronRight, 
  Search, 
  FileText, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import AdSlot from './AdSlot';

interface DocMetadata {
  slug: string;
  title: string;
  description: string;
  errorCode: string;
  category: string;
  difficulty: string;
  estTime: string;
  successRate: string;
  date: string;
  author: string;
}

interface DashboardProps {
  initialDocs: DocMetadata[];
}

export default function Dashboard({ initialDocs }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Icon mapping helper
  const categoryIconMap: { [key: string]: any } = {
    windows: Monitor,
    update: RefreshCw,
    system: Settings,
    driver: Cpu,
    network: Wifi,
    hardware: HardDrive,
  };

  const baseCategories = useMemo(() => [
    {
      name: 'Windows',
      id: 'windows',
      icon: Monitor,
      description: 'Core operating system diagnostics, system files integrity (SFC), and kernel bugcheck reference logs.',
      issues: [
        { code: '0x0000007B', label: 'INACCESSIBLE_BOOT_DEVICE' },
        { code: 'CRITICAL_PROCESS_DIED', label: 'Unhandled kernel process exception' },
        { code: 'SFC_LOGS', label: 'System File Checker Repair Logs' }
      ]
    },
    {
      name: 'Update',
      id: 'update',
      icon: RefreshCw,
      description: 'Windows Update, KB catalog installations, WSUS synchronizations, and component store patch failures.',
      issues: [
        { code: '0x800f081f', label: 'Source files could not be found' },
        { code: '0x80244007', label: 'WSUS SOAP protocol synchronization error' },
        { code: '0x80073712', label: 'Component store is manifest-corrupt' }
      ]
    },
    {
      name: 'System',
      id: 'system',
      icon: Settings,
      description: 'Windows Service Control Manager, power states, DistributedCOM permissions, and Registry failures.',
      issues: [
        { code: 'SCM Error 7000', label: 'Service failed to respond on initialization' },
        { code: '0x0000009F', label: 'DRIVER_POWER_STATE_FAILURE' },
        { code: 'DCOM Event 10016', label: 'DistributedCOM local activation permission' }
      ]
    },
    {
      name: 'Driver',
      id: 'driver',
      icon: Cpu,
      description: 'Display driver watchdog timeouts (TDR), storage host controllers, and peripheral input failures.',
      issues: [
        { code: 'TDR nvlddmkm.sys', label: 'NVIDIA Display Driver Watchdog crash' },
        { code: '0x000000D1', label: 'DRIVER_IRQL_NOT_LESS_OR_EQUAL' },
        { code: 'USB_INPUT_0x44', label: 'HID Keyboard/Mouse device timeout' }
      ]
    },
    {
      name: 'Network',
      id: 'network',
      icon: Wifi,
      description: 'Routing tables, socket bindings, local DNS lookup faults, and NDIS physical card link-drops.',
      issues: [
        { code: '0x80072ee7', label: 'Server name or address could not be resolved' },
        { code: 'TCP_STACK_RESET', label: 'Winsock catalog integrity degradation' },
        { code: 'NDIS_MINIPORT', label: 'Network Adapter Interface Reset Event' }
      ]
    },
    {
      name: 'Hardware',
      id: 'hardware',
      icon: HardDrive,
      description: 'WHEA uncorrectable hardware halts, NTFS physical sector decay, and volatile RAM state testing.',
      issues: [
        { code: '0x00000124', label: 'WHEA_UNCORRECTABLE_ERROR (CPU/Bus)' },
        { code: 'NTFS_FILE_SYS', label: 'Disk MFT sector or index page decay' },
        { code: 'SMART_LIMIT_SSD', label: 'Solid State Drive remaining capacity warning' }
      ]
    }
  ], []);

  // Merge directory templates with parsed filesystem content
  const processedCategories = useMemo(() => {
    return baseCategories.map((cat) => {
      // Find matching dynamic files for this category
      const dynamicIssuesForCat = initialDocs
        .filter((doc) => doc.category.toLowerCase() === cat.id.toLowerCase())
        .map((doc) => ({
          code: doc.errorCode,
          label: doc.title,
          slug: doc.slug,
          isDynamic: true,
          badge: doc.successRate + ' Success'
        }));

      // Combine both lists. We put the active verified (dynamic) ones at the very top!
      const mergedIssues = [...dynamicIssuesForCat, ...cat.issues];

      return {
        ...cat,
        issues: mergedIssues,
      };
    });
  }, [baseCategories, initialDocs]);

  // Handle live query logic
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return processedCategories;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return processedCategories.map((cat) => {
      const matchesCategory = 
        cat.name.toLowerCase().includes(lowerQuery) || 
        cat.description.toLowerCase().includes(lowerQuery);

      const matchedIssues = cat.issues.filter(
        (issue) => 
          issue.code.toLowerCase().includes(lowerQuery) || 
          issue.label.toLowerCase().includes(lowerQuery)
      );

      // If category itself matches, keep all. Otherwise only keep matched issues.
      return {
        ...cat,
        issues: matchesCategory ? cat.issues : matchedIssues,
        isSearchMatch: matchesCategory || matchedIssues.length > 0,
      };
    }).filter((cat) => searchQuery.trim() === '' || cat.issues.length > 0 || cat.isSearchMatch);
  }, [processedCategories, searchQuery]);

  return (
    <div id="dashboard-interactive-root">
      
      {/* Search Input Section mapped directly from standard layout input */}
      <section id="hero-section" className="bg-slate-50 border-b border-slate-100/80 py-16 px-6 text-center">
        <div id="hero-limit-wrapper" className="max-w-4xl mx-auto">
          {/* Pill Badge */}
          <div 
            id="hero-pill-badge" 
            className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 mb-4 rounded-full border border-blue-100 mx-auto w-max flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Database Directives Synchronized</span>
          </div>

          {/* Headline Text with Operational System Highlighted */}
          <h1 
            id="hero-headline" 
            className="text-slate-900 font-extrabold text-4xl md:text-5xl tracking-tight mb-4"
          >
            A Unified Diagnostic Reference for <span className="text-blue-600 block sm:inline">Windows Updates & OS Errors</span>
          </h1>

          {/* Subtitle Text */}
          <p 
            id="hero-subtitle" 
            className="text-slate-500 text-sm max-w-2xl leading-relaxed mx-auto mb-8"
          >
            Consult curated diagnostic playbooks, error validation codes, and component correction procedures for enterprise administrative systems.
          </p>

          {/* Interactive Search Field */}
          <div id="hero-search-wrapper" className="max-w-2xl w-full mx-auto relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search error codes, dynamic playbooks, or categories (e.g. 0x80070002, Update)..."
              className="max-w-2xl w-full mx-auto bg-white border border-slate-200 shadow-sm rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>
      </section>

      {/* Production Seed Bulletin Feed */}
      {initialDocs.length > 0 && !searchQuery && (
        <section id="bulletin-board-section" className="max-w-6xl mx-auto pt-10 px-6">
          <div id="bulletin-banner" className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 mt-1">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded">
                      SEEDED RECORD
                    </span>
                    <span className="text-slate-400 text-xs">Latest Directive Published</span>
                  </div>
                  <h3 className="font-extrabold text-white text-base tracking-tight">
                    {initialDocs[0].title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                    {initialDocs[0].description}
                  </p>
                </div>
              </div>
              <Link 
                id="bulletin-cta-link"
                href={`/blog/${initialDocs[0].slug}`}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-5 rounded-lg inline-flex items-center gap-1.5 transition-colors self-start md:self-center shrink-0 border border-blue-500 shadow-sm"
              >
                Access Active File
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid View */}
      <section id="navigation-grid-section" className="max-w-6xl mx-auto py-12 px-6">
        <h2 id="grid-header" className="text-xl font-bold text-slate-900 mb-8 tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          {searchQuery ? 'Filtered Search Results' : 'Browse Core Technical Logs'}
        </h2>

        {filteredCategories.length === 0 ? (
          <div id="search-empty-state" className="text-center py-16 bg-white border border-slate-100 rounded-xl max-w-2xl mx-auto">
            <span className="text-4xl">🔍</span>
            <h3 className="text-slate-800 font-bold text-base mt-4">No matching diagnostic records</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed">
              We couldn&apos;t locate error code &quot;{searchQuery}&quot;. Access standard directories above or contact administration logs.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-500"
            >
              Reset search input
            </button>
          </div>
        ) : (
          <div 
            id="categories-grid" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCategories.map((category) => {
              const Icon = categoryIconMap[category.id] || Monitor;
              return (
                <div 
                  key={category.id}
                  id={`category-${category.id}`} 
                  className="border border-slate-100 bg-white p-6 rounded-xl shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between scroll-mt-6"
                >
                  <div id={`category-top-${category.id}`}>
                    {/* Icon wrapper */}
                    <div 
                      id={`category-icon-wrapper-${category.id}`}
                      className="bg-blue-50 text-blue-600 p-2.5 rounded-lg w-max mb-4 border border-blue-50/50"
                    >
                      <Icon id={`category-icon-${category.id}`} className="w-5 h-5" />
                    </div>

                    {/* Title */}
                    <h3 
                      id={`category-title-${category.id}`}
                      className="text-base font-bold text-slate-900 mb-2"
                    >
                      {category.name}
                    </h3>

                    {/* Description */}
                    <p 
                      id={`category-desc-${category.id}`}
                      className="text-slate-500 text-xs leading-relaxed mb-4"
                    >
                      {category.description}
                    </p>
                  </div>

                  {/* Diagnostic Quick Links List */}
                  <div id={`category-items-container-${category.id}`} className="border-t border-slate-50 pt-4 mt-2">
                    <span 
                      id={`category-items-header-${category.id}`}
                      className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2"
                    >
                      Common Failure Codes
                    </span>
                    <ul id={`category-list-${category.id}`} className="space-y-2">
                      {category.issues.map((issue: any, idx) => {
                        const isLive = 'isDynamic' in issue && issue.isDynamic;
                        
                        const itemContent = (
                          <>
                            <div className="flex flex-col">
                              <span 
                                id={`category-item-code-${category.id}-${idx}`}
                                className={`font-mono text-[11px] font-semibold ${isLive ? 'text-blue-600' : 'text-slate-700'}`}
                              >
                                {issue.code}
                              </span>
                              <span 
                                id={`category-item-label-${category.id}-${idx}`}
                                className="text-[10px] text-slate-500 truncate max-w-[190px]"
                              >
                                {issue.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isLive && (
                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                                  Live File
                                </span>
                              )}
                              <ChevronRight 
                                id={`category-item-icon-${category.id}-${idx}`}
                                className={`w-3.5 h-3.5 ${isLive ? 'text-blue-600' : 'text-slate-300'} group-hover:text-blue-600 transition-colors`} 
                              />
                            </div>
                          </>
                        );

                        if (isLive) {
                          return (
                            <li key={idx} id={`category-item-${category.id}-${idx}`}>
                              <Link 
                                href={`/blog/${issue.slug}`}
                                className="flex items-center justify-between p-1.5 hover:bg-slate-50 border-l border-blue-500 pl-2 bg-blue-50/20 rounded-r transition-colors group cursor-pointer"
                              >
                                {itemContent}
                              </Link>
                            </li>
                          );
                        }

                        return (
                          <li 
                            key={idx} 
                            id={`category-item-${category.id}-${idx}`}
                            onClick={() => {
                              // Standard issues redirect to query on click for neat interactivity
                              setSearchQuery(issue.code);
                              // Smooth scroll to top search bar
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded transition-colors group cursor-pointer"
                          >
                            {itemContent}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Primary Ad Integration Placement directly beneath the 6-Category Grid Layout */}
        <div id="grid-bottom-ad-wrapper" className="mt-8">
          <AdSlot id="home-middle-responsive" type="horizontal" />
        </div>
      </section>

    </div>
  );
}
