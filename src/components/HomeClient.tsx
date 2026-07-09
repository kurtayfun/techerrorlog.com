"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  Activity,
  Award,
  ChevronRight,
  Monitor,
  Wrench,
  ShieldAlert,
  FileCode,
  Gamepad2,
  CheckCircle2,
  Cpu,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';

interface Guide {
  code: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  estTime: string;
  successRate: string;
  slug: string;
  description: string;
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
  badge: string;
  description: string;
  iconType: "windows" | "bsod" | "dll" | "gaming" | "activation" | "driver";
  guides: Guide[];
}

interface HomeClientProps {
  initialDocs: Array<{
    metadata: {
      slug: string;
      title: string;
      description: string;
      errorCode?: string;
      category?: string;
      difficulty?: string;
      estTime?: string;
      successRate?: string;
      date?: string;
      author?: string;
      tags?: string[];
    };
    content: string;
  }>;
  categoriesDb?: Category[];
  articlesDb?: any[];
  settingsDb?: any;
}

const baseCategories: Category[] = [
  {
    id: "windows-update",
    name: "Windows Update Errors",
    badge: "2 Guides",
    description: "Troubleshoot standard Windows features update, security patch, and CAB file installation failures.",
    iconType: "windows",
    guides: [
      {
        code: "0x80070002",
        title: "Windows Update Error 0x80070002: Missing Update Files",
        difficulty: "EASY",
        estTime: "5-10 min",
        successRate: "98%",
        slug: "windows-update-0x80070002",
        description: "This error code signifies that certain required security update files are missing or corrupted, preventing the Windows Update Service from finalizing the download session."
      },
      {
        code: "0x800f081f",
        title: "Windows Update Error 0x800f081f: Source Files Not Found",
        difficulty: "MEDIUM",
        estTime: "15 min",
        successRate: "95%",
        slug: "windows-update-0x800f081f",
        description: "Occurs when Windows Update cannot find critical files required to install security updates and net framework features."
      }
    ]
  },
  {
    id: "bsod",
    name: "BSOD (Blue Screen)",
    badge: "2 Guides",
    description: "Resolve Windows Kernel crashes, active memory dumps, and physical hardware check failures.",
    iconType: "bsod",
    guides: [
      {
        code: "0x000000EF",
        title: "Blue Screen Error 0x000000EF: Critical Process Died",
        difficulty: "MEDIUM",
        estTime: "10 min",
        successRate: "92%",
        slug: "bsod-0x000000ef",
        description: "A critical system process failed to maintain its execution cycle, resulting in an unrecoverable kernel watchdog bugcheck halt."
      },
      {
        code: "0x000000D1",
        title: "Blue Screen Error 0x000000D1: Driver IRQL Not Less Or Equal",
        difficulty: "ADVANCED",
        estTime: "15 min",
        successRate: "90%",
        slug: "bsod-0x000000d1",
        description: "Occurs when a physical device driver attempts to access an invalid paging memory address at an elevated interrupt level."
      }
    ]
  },
  {
    id: "dll",
    name: "DLL Errors",
    badge: "2 Guides",
    description: "Locate and register missing Shared Libraries and Dynamic Link Libraries for user programs.",
    iconType: "dll",
    guides: [
      {
        code: "vcruntime140",
        title: "DLL Error: vcruntime140.dll Was Not Found",
        difficulty: "EASY",
        estTime: "5 min",
        successRate: "99%",
        slug: "dll-vcruntime140",
        description: "Locate and register missing Shared Libraries and Dynamic Link Libraries for Microsoft Visual C++ redistributable packages."
      },
      {
        code: "msvcp140",
        title: "DLL Error: msvcp140.dll Was Not Found",
        difficulty: "EASY",
        estTime: "5 min",
        successRate: "99%",
        slug: "dll-msvcp140",
        description: "Resolve runtime initialization issues occurring in applications requiring Microsoft Visual Studio C++ library directories."
      }
    ]
  },
  {
    id: "gaming",
    name: "Gaming Errors",
    badge: "2 Guides",
    description: "Resolve DirectX diagnostic errors, graphics driver compatibility, and multiplayer network drop states.",
    iconType: "gaming",
    guides: [
      {
        code: "dxdiag",
        title: "DirectX Diagnostic Tool: Troubleshooting Graphics & Sound",
        difficulty: "EASY",
        estTime: "5 min",
        successRate: "99%",
        slug: "tools-dxdiag",
        description: "Open the official administrative diagnostic utility to troubleshoot complex hardware performance, graphics drivers, and sound interfaces."
      },
      {
        code: "cleanmgr",
        title: "Disk Cleanup Utility: Clearing Windows Temporary Shadows",
        difficulty: "EASY",
        estTime: "5 min",
        successRate: "98%",
        slug: "tools-cleanmgr",
        description: "Remove temporary caching, previous installation backups and download repositories from drive sectors dynamically."
      }
    ]
  },
  {
    id: "activation",
    name: "Activation Issues",
    badge: "2 Guides",
    description: "Troubleshoot Windows server KMS licensing, digital product authentication, and product key errors.",
    iconType: "activation",
    guides: [
      {
        code: "0x803fa0675",
        title: "Windows digital activation error 0x803fa0675 troubleshooting guide",
        difficulty: "MEDIUM",
        estTime: "8 min",
        successRate: "94%",
        slug: "activation-0x803fa0675",
        description: "An unaligned activation token key was detected during Windows Server/Pro license synchronization routines."
      },
      {
        code: "0xC004C003",
        title: "KMS Server activation failure code 0xC004C003 repair tutorial",
        difficulty: "ADVANCED",
        estTime: "12 min",
        successRate: "90%",
        slug: "activation-0xc004c003",
        description: "Resolve blocked or misaligned enterprise network product key allocations inside native KMS managers."
      }
    ]
  },
  {
    id: "driver",
    name: "Driver Problems",
    badge: "2 Guides",
    description: "Resolve display watchdog timeouts, peripheral device driver conflicts, and chipset load failures.",
    iconType: "driver",
    guides: [
      {
        code: "nvlddmkm",
        title: "Fix NVIDIA Display Driver watchdog timeout (nvlddmkm.sys)",
        difficulty: "ADVANCED",
        estTime: "12 min",
        successRate: "94%",
        slug: "driver-nvlddmkm",
        description: "Complete technical playbook addressing system registry watchdog metrics (TdrDelay) and clean driver builds to resolve direct nvlddmkm.sys GPU timeouts."
      },
      {
        code: "sfc-scan",
        title: "System File Checker Guide: Running sfc /scannow",
        difficulty: "EASY",
        estTime: "10 min",
        successRate: "95%",
        slug: "guides-sfc-scannow",
        description: "Step-by-step diagnostic workflows to verify protected catalog system file integrity and recover broken OS system structures."
      }
    ]
  }
];

const matchDocCategoryToId = (categoryName: string): string => {
  const cleaned = categoryName.toLowerCase();
  if (cleaned.includes("update")) return "windows-update";
  if (cleaned.includes("bsod") || cleaned.includes("blue screen")) return "bsod";
  if (cleaned.includes("dll") || cleaned.includes("library")) return "dll";
  if (cleaned.includes("gaming") || cleaned.includes("game")) return "gaming";
  if (cleaned.includes("activation") || cleaned.includes("license")) return "activation";
  if (cleaned.includes("driver") || cleaned.includes("conflict")) return "driver";
  if (cleaned.includes("performance") || cleaned.includes("slow") || cleaned.includes("cpu") || cleaned.includes("ram") || cleaned.includes("disk")) return "performance";
  if (cleaned.includes("troubleshoot") || cleaned.includes("guide") || cleaned.includes("safe mode")) return "troubleshooting";
  return "windows-update"; // fallback
};

export default function HomeClient({ initialDocs, categoriesDb, articlesDb, settingsDb }: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Local state for hydration of real-time Firebase data
  const [liveDocs, setLiveDocs] = useState(initialDocs || []);
  const [liveCategories, setLiveCategories] = useState(categoriesDb || []);
  const [liveArticles, setLiveArticles] = useState(articlesDb || []);
  const [liveSettings, setLiveSettings] = useState(settingsDb || {});

  // Fetch real-time data on client mount to bypass server-side/build caches and CDN stale states
  useEffect(() => {
    async function hydrate() {
      try {
        const timestamp = Date.now();
        const [articlesRes, categoriesRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/db?type=articles&_t=${timestamp}`, { cache: "no-store" }).then(res => res.json()),
          fetch(`/api/admin/db?type=categories&_t=${timestamp}`, { cache: "no-store" }).then(res => res.json()),
          fetch(`/api/admin/db?type=settings&_t=${timestamp}`, { cache: "no-store" }).then(res => res.json()),
        ]);

        if (articlesRes.success && Array.isArray(articlesRes.data)) {
          setLiveArticles(articlesRes.data);
          
          // Construct liveDocs from the live articles data
          const mappedDocs = articlesRes.data.map((art: any) => ({
            metadata: {
              slug: art.slug,
              title: art.title || 'Untitled',
              description: art.seo?.meta_description || art.description || '',
              errorCode: art.errorCode || 'General',
              category: art.category || 'Other',
              difficulty: art.difficulty || 'Medium',
              estTime: art.estTime || '5 min',
              successRate: art.successRate || '100%',
              date: art.updated || art.date || '',
              author: art.author || 'TechErrorLog Team',
              tags: art.tags || [],
            },
            content: art.content || '',
          }));
          setLiveDocs(mappedDocs);
        }
        
        if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
          setLiveCategories(categoriesRes.data);
        }
        
        if (settingsRes.success && settingsRes.data) {
          setLiveSettings(settingsRes.data);
        }
      } catch (err) {
        console.error("Failed to hydrate client with real-time database data:", err);
      }
    }
    
    hydrate();
  }, []);

  // Dynamically map and merge liveDocs into category list
  const allCategories = useMemo(() => {
    // 1. Get raw categories from database or fallback to static defaults
    const sourceCategories = (liveCategories && liveCategories.length > 0) ? liveCategories : baseCategories;
    
    // 2. Clone them, initializing guides to empty arrays
    const categoriesCopy = sourceCategories.map(cat => ({
      ...cat,
      guides: [] as Guide[]
    }));

    // 3. Populate guides from liveArticles (the master JSON database) for entries with status === "published"
    const activeArticles = liveArticles || [];
    activeArticles.forEach((art) => {
      // Only include published articles on the user interface
      if (art.status !== "published") return;
      
      const targetCatId = art.category; // e.g. "windows-update"
      const targetCatIndex = categoriesCopy.findIndex(c => c.id === targetCatId);
      if (targetCatIndex !== -1) {
        const cat = categoriesCopy[targetCatIndex];
        if (!cat.guides.some(g => g.slug === art.slug)) {
          cat.guides.push({
            code: art.errorCode || "General",
            title: art.title,
            difficulty: (art.difficulty || "Medium").toUpperCase() as any,
            estTime: art.estTime || "10 min",
            successRate: art.successRate || "95%",
            slug: art.slug,
            description: art.seo?.meta_description || art.title,
            tags: art.tags || []
          });
        }
      }
    });

    const staticSlugs = [
      'bsod-0x000000d1',
      'bsod-0x000000ef',
      'dll-msvcp140',
      'dll-vcruntime140',
      'fix-nvidia-display-driver-watchdog-timeout-nvlddmkmsys',
      'guides-sfc-scannow',
      'tools-dxdiag',
      'windows-update-0x80070002',
      'windows-update-0x800f081f'
    ];

    // 4. Fallback/merge any dynamic directories/files directly in liveDocs in case we loaded an MDX file unregistered in the JSON database
    liveDocs.forEach((doc) => {
      const meta = doc.metadata;
      
      // Determine if this is a registered active published article
      const dbMatch = activeArticles.find((a: any) => a.slug === meta.slug);
      const isStaticDefault = staticSlugs.includes(meta.slug);

      // If it has a DB entry, we only show it if its status is "published"
      if (dbMatch) {
         if (dbMatch.status !== 'published') {
           return; // Skip drafts/inactive
         }
      } else {
        // If it does NOT have a DB entry, it is only allowed if it is a default static template file
        if (!isStaticDefault) {
          return; // Skip deleted or unregistered custom dynamic articles
        }
      }

      const targetCatId = matchDocCategoryToId(meta.category || "Windows Update");
      const targetCatIndex = categoriesCopy.findIndex(c => c.id === targetCatId);

      if (targetCatIndex !== -1) {
        const cat = categoriesCopy[targetCatIndex];
        const alreadyExists = cat.guides.some(g => g.slug === meta.slug);
        if (!alreadyExists) {
          cat.guides.push({
            code: meta.errorCode || "General",
            title: meta.title,
            difficulty: (meta.difficulty || "Medium").toUpperCase() as any,
            estTime: meta.estTime || "5 min",
            successRate: meta.successRate || "100%",
            slug: meta.slug,
            description: meta.description,
            tags: meta.tags || []
          });
        }
      }
    });

    // 5. If we have 0 guides in total across categories, load static defaults
    const totalGuides = categoriesCopy.reduce((sum, c) => sum + c.guides.length, 0);
    if (totalGuides === 0) {
      return baseCategories;
    }

    // 6. Recalculate badges representing dynamic guides volume
    return categoriesCopy.map(cat => ({
      ...cat,
      badge: `${cat.guides.length} Guide${cat.guides.length === 1 ? '' : 's'}`
    }));
  }, [liveDocs, liveCategories, liveArticles]);

  // Extract all unique tags dynamically
  const allTags = useMemo(() => {
    const list = new Set<string>();
    allCategories.forEach((category) => {
      category.guides.forEach((guide) => {
        if (guide.tags && Array.isArray(guide.tags)) {
          guide.tags.forEach(t => list.add(t));
        }
      });
    });
    return Array.from(list);
  }, [allCategories]);

  // Sychronize with header actions client-side
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveCategory(params.get('category') || '');
      setSelectedTag(params.get('tag') || '');
    };
    
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Listen to global custom events for header triggers
  useEffect(() => {
    const handleCategoryChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setActiveCategory(customEvent.detail || '');
      setFilterQuery(''); // clear secondary category filter
    };

    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchQuery(customEvent.detail || '');
    };

    window.addEventListener('categoryChange', handleCategoryChange);
    window.addEventListener('globalSearch', handleGlobalSearch);
    
    return () => {
      window.removeEventListener('categoryChange', handleCategoryChange);
      window.removeEventListener('globalSearch', handleGlobalSearch);
    };
  }, []);

  // Scroll to top of the page smoothly when activeCategory changes to avoid getting stuck at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const handleGlobalSearchChange = (val: string) => {
    setSearchQuery(val);
    const event = new CustomEvent('globalSearch', { detail: val });
    window.dispatchEvent(event);
  };

  // Switch category selection
  const selectCategory = (key: string) => {
    setActiveCategory(key);
    setFilterQuery('');
    
    const catEvent = new CustomEvent('categoryChange', { detail: key });
    window.dispatchEvent(catEvent);
    
    const isHome = window.location.pathname === '/';
    if (isHome) {
      const newUrl = key ? `/?category=${key}` : '/';
      window.history.pushState({}, '', newUrl);
    }
  };

  // Map CSS-based custom micro-logos exactly
  const renderCategoryIcon = (type: string, sizeClass = "w-11 h-11") => {
    switch (type) {
      case "windows":
        return (
          <div className={`${sizeClass} rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <Wrench className="w-5.5 h-5.5 text-blue-600" />
          </div>
        );
      case "bsod":
        return (
          <div className={`${sizeClass} rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <ShieldAlert className="w-5.5 h-5.5 text-rose-600" />
          </div>
        );
      case "dll":
        return (
          <div className={`${sizeClass} rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <FileCode className="w-5.5 h-5.5 text-violet-600" />
          </div>
        );
      case "gaming":
        return (
          <div className={`${sizeClass} rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <Gamepad2 className="w-5.5 h-5.5 text-amber-600" />
          </div>
        );
      case "activation":
        return (
          <div className={`${sizeClass} rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600" />
          </div>
        );
      case "driver":
        return (
          <div className={`${sizeClass} rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <Cpu className="w-5.5 h-5.5 text-indigo-600" />
          </div>
        );
      case "performance":
        return (
          <div className={`${sizeClass} rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <Activity className="w-5.5 h-5.5 text-amber-600" />
          </div>
        );
      case "troubleshooting":
        return (
          <div className={`${sizeClass} rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <BookOpen className="w-5.5 h-5.5 text-cyan-600" />
          </div>
        );
      default:
        return (
          <div className={`${sizeClass} rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100/70 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
            <Monitor className="w-5.5 h-5.5 text-slate-600" />
          </div>
        );
    }
  };

  // Collect all matching guides directly across ALL categories
  const searchMatchedGuides = useMemo(() => {
    const rawLocalQuery = searchQuery.trim().toLowerCase();

    const matched: Array<Guide & { categoryId: string; categoryName: string }> = [];
    allCategories.forEach((category) => {
      category.guides.forEach((guide) => {
        const matchesSearch = !rawLocalQuery || 
          guide.code.toLowerCase().includes(rawLocalQuery) ||
          guide.title.toLowerCase().includes(rawLocalQuery) ||
          guide.description.toLowerCase().includes(rawLocalQuery);
        
        const matchesTag = !selectedTag || (guide.tags && guide.tags.includes(selectedTag));

        if (matchesSearch && matchesTag) {
          if (!matched.some(m => m.slug === guide.slug)) {
            matched.push({
              ...guide,
              categoryId: category.id,
              categoryName: category.name
            });
          }
        }
      });
    });
    return matched;
  }, [searchQuery, selectedTag, allCategories]);

  // Filter categories and guides for global query scan list
  const filteredCategories = useMemo(() => {
    const rawLocalQuery = searchQuery.trim().toLowerCase();
    
    // If no active filter, return categories as is (or filter by tag if tag selected)
    if (!rawLocalQuery && !selectedTag) return allCategories;

    return allCategories.map((category) => {
      const matchCatText = rawLocalQuery && (
        category.name.toLowerCase().includes(rawLocalQuery) || 
        category.description.toLowerCase().includes(rawLocalQuery)
      );

      const matchedGuides = category.guides.filter((guide) => {
        const matchesSearch = !rawLocalQuery || (
          guide.code.toLowerCase().includes(rawLocalQuery) ||
          guide.title.toLowerCase().includes(rawLocalQuery) ||
          guide.description.toLowerCase().includes(rawLocalQuery)
        );
        const matchesTag = !selectedTag || (guide.tags && guide.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
      });

      return {
        ...category,
        guides: matchedGuides,
        isMatched: !!(matchCatText || matchedGuides.length > 0)
      };
    }).filter(c => c.isMatched || c.guides.length > 0);
  }, [searchQuery, selectedTag, allCategories]);

  // Find selected category object
  const activeCategoryData = useMemo(() => {
    return allCategories.find((cat) => cat.id === activeCategory);
  }, [activeCategory, allCategories]);

  // Guides inside selected category, filtered by search and tags
  const activeCategoryGuides = useMemo(() => {
    if (!activeCategoryData) return [];
    const query = filterQuery.trim().toLowerCase();
    
    return activeCategoryData.guides.filter((guide) => {
      const matchesSearch = !query || (
        guide.code.toLowerCase().includes(query) ||
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query)
      );
      const matchesTag = !selectedTag || (guide.tags && guide.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [activeCategoryData, filterQuery, selectedTag]);

  // Difficulty badge styling
  const getDifficultyStyles = (level: "EASY" | "MEDIUM" | "ADVANCED") => {
    switch (level) {
      case "EASY":
        return "text-emerald-700 bg-emerald-50 border-emerald-100/50";
      case "MEDIUM":
        return "text-amber-700 bg-amber-50 border-amber-100/50";
      case "ADVANCED":
        return "text-rose-700 bg-rose-50 border-rose-100/50";
      default:
        return "text-slate-700 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div id="app-viewport" className="min-h-screen flex flex-col bg-slate-50/60 font-sans">
      <Header />

      <main id="app-content-body" className="flex-grow py-10 px-6 max-w-7xl mx-auto w-full">
        {activeCategoryData ? (
          /* ==================== VIEW 2: CATEGORY DEEP-DIVE ==================== */
          <div id="category-deepdive-layout" className="space-y-6">
            
            {/* Category Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6.5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                {renderCategoryIcon(activeCategoryData.iconType, "w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl")}
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight">
                      {activeCategoryData.name}
                    </h1>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase border border-slate-200/50">
                      {activeCategoryData.badge}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                    {activeCategoryData.description}
                  </p>
                </div>
              </div>

              {/* Filtering Search Bar inside Category card */}
              <div className="relative w-full md:w-80 shrink-0">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={`Filter in ${activeCategoryData.name}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-850 placeholder-slate-400/90 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>

            </div>

            {/* Grid of playbooks belonging to active category */}
            {activeCategoryGuides.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-4xl text-slate-350">📝</span>
                <h3 className="text-slate-800 font-bold text-sm mt-3">No matching guidelines yet</h3>
                <p className="text-slate-455 text-[11px] max-w-xs mx-auto mt-1 leading-relaxed">
                  We system files index cannot locate references for &quot;{filterQuery}&quot; under this directory channel.
                </p>
                <button
                  onClick={() => setFilterQuery('')}
                  className="mt-4 px-3.5 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg bg-blue-50/20 hover:bg-blue-50 transition-colors"
                >
                  Clear local filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCategoryGuides.map((guide) => (
                  <div 
                    key={guide.slug}
                    className="bg-white border border-slate-100/90 hover:border-blue-500/35 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Metric Tag parameters */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[11px] font-extrabold bg-slate-100 border border-slate-200/50 text-slate-600 px-2.5 py-1 rounded shadow-sm tracking-wide">
                          {guide.code}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getDifficultyStyles(guide.difficulty)}`}>
                          {guide.difficulty}
                        </span>
                      </div>

                      {/* Heading */}
                      <h3 className="text-slate-900 font-extrabold text-base tracking-tight leading-snug">
                        {guide.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal opacity-95">
                        {guide.description}
                      </p>

                      {/* Article Card Tags */}
                      {guide.tags && guide.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {guide.tags.map((t) => {
                            const isCurActive = selectedTag === t;
                            return (
                              <button
                                key={t}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTag(isCurActive ? "" : t);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                  isCurActive
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border-slate-200/60 hover:border-blue-200"
                                }`}
                              >
                                #{t}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Parameters */}
                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-semibold font-mono">Fix Time: {guide.estTime}</span>
                      </div>

                      <Link 
                        href={`/blog/${guide.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors group"
                      >
                        <span>Read Resolution Guide</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        ) : (
          /* ==================== VIEW 1: DYNAMICAL DIRECTORIES DIRECTORY ==================== */
          <div id="full-directory-landing" className="space-y-12">
            
            {/* Majestic Hero Banner */}
            <section id="hero-banner" className="text-center py-10 max-w-4xl mx-auto">
              {/* Pill Header Badge */}
              <div className="bg-blue-50 border border-blue-100 text-blue-600 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest block w-max mx-auto mb-6">
                ✓ Professional Corporate Resolution Directory
              </div>

              {/* Title */}
              <h1 className="text-slate-900 font-extrabold text-4xl sm:text-5xl tracking-tight mb-4 leading-[1.12]">
                Find the solution to your <span className="text-blue-600 block sm:inline">Windows error</span>
              </h1>

              {/* Subtitle description */}
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed mx-auto mb-8 font-sans">
                Search over certified step-by-step diagnostic workflows. Instantly copy verified administrative Commands (DISM, SFC, SLMGR) to repair DLL mismatches, driver freezes, and system Blue Screen stops.
              </p>

              {/* Central Search Box */}
              <div className="max-w-2xl mx-auto relative shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] rounded-2xl">
                <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  placeholder="Search by error code, DLL name or error message (e.g., 0x80070002, vcruntime140)..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-13 pr-5 py-4 text-sm text-slate-850 placeholder-slate-400/90 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>

              {/* Dynamic Tag Filter Cloud */}
              {allTags.length > 0 && (
                <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-1.5 mt-5 text-xs select-none">
                  <span className="text-slate-400 font-bold text-[11px] mr-1 uppercase tracking-wider">Browse by Tags:</span>
                  {allTags.map((tag) => {
                    const isCurActive = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isCurActive ? "" : tag)}
                        className={`px-3 py-1.5 rounded-full transition-all duration-155 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer border ${
                          isCurActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700 hover:border-blue-700"
                            : "bg-white hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 border-slate-200/90 hover:border-blue-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:-translate-y-0.5"
                        }`}
                      >
                        <span className={isCurActive ? "text-blue-100" : "text-slate-400"}>#</span>
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active tag filtering summary panel */}
              {selectedTag && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center justify-between gap-4 max-w-lg mx-auto mt-4 animate-fade-in shadow-sm">
                  <span className="text-xs text-blue-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Filtering playbooks by tag:</span>
                    <span className="bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded text-[10px] font-mono">#{selectedTag}</span>
                  </span>
                  <button
                    onClick={() => setSelectedTag('')}
                    className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </section>

            {/* Categorization Directory Sections */}
            <section id="browse-channels-grid" className="space-y-6">
              
              <div className="border-b border-slate-200/50 pb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-slate-900 font-extrabold text-xl tracking-tight mb-1">
                  {searchQuery || selectedTag ? `Search & Filter Results` : "Browse Resolution Channels"}
                </h2>
                <p className="text-slate-550 text-xs font-normal">
                  {searchQuery || selectedTag
                    ? `Found ${searchMatchedGuides.length} matching guidelines across our directory database.`
                    : "Select an error category to view our complete diagnostic index database."}
                </p>
              </div>
              {(searchQuery || selectedTag) && (
                <button
                  onClick={() => { handleGlobalSearchChange(''); setSelectedTag(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-150/80 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-xl transition-colors border border-slate-250/35 cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
              </div>

              {searchQuery || selectedTag ? (
                /* Dynamic Search Mode */
                searchMatchedGuides.length === 0 && filteredCategories.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl max-w-2xl mx-auto shadow-sm">
                    <span className="text-4xl">🔍</span>
                    <h3 className="text-slate-800 font-bold text-sm mt-3">No diagnostic records matched</h3>
                    <p className="text-slate-450 text-[11px] max-w-xs mx-auto mt-1 leading-relaxed">
                      No results for &quot;{searchQuery || selectedTag}&quot; were found in our diagnostic databases. Try selecting different tags or keywords.
                    </p>
                    <button
                      onClick={() => { handleGlobalSearchChange(''); setSelectedTag(''); }}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Matching Guides Section */}
                    {searchMatchedGuides.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-slate-420 font-extrabold uppercase tracking-widest text-[10px]">
                          Matched Playbooks
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {searchMatchedGuides.map((guide) => (
                            <div 
                              key={guide.slug}
                              className="bg-white border border-slate-100/90 hover:border-blue-500/35 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[11px] font-extrabold bg-slate-100 border border-slate-200/50 text-slate-600 px-2.5 py-1 rounded shadow-sm tracking-wide">
                                      {guide.code}
                                    </span>
                                    <span className="text-[10px] text-slate-450 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                      {guide.categoryName}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getDifficultyStyles(guide.difficulty)}`}>
                                    {guide.difficulty}
                                  </span>
                                </div>

                                <h3 className="text-slate-900 font-extrabold text-base tracking-tight leading-snug">
                                  {guide.title}
                                </h3>

                                <p className="text-slate-500 text-xs leading-relaxed font-sans font-normal opacity-95">
                                  {guide.description}
                                </p>

                                {/* Article Card Tags */}
                                {guide.tags && guide.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {guide.tags.map((t) => {
                                      const isCurActive = selectedTag === t;
                                      return (
                                        <button
                                          key={t}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedTag(isCurActive ? "" : t);
                                          }}
                                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                            isCurActive
                                              ? "bg-blue-600 border-blue-600 text-white"
                                              : "bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border-slate-200/60 hover:border-blue-200"
                                          }`}
                                        >
                                          #{t}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[11px] font-semibold font-mono">Fix Time: {guide.estTime}</span>
                                </div>

                                <Link 
                                  href={`/blog/${guide.slug}`}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors group"
                                >
                                  <span>Read Resolution Guide</span>
                                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Categories Section */}
                    {filteredCategories.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-slate-420 font-extrabold uppercase tracking-widest text-[10px]">
                          Matching Error Directories
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredCategories.map((cat) => (
                            <div
                              key={cat.id}
                              onClick={() => selectCategory(cat.id)}
                              className="group bg-white border border-slate-100/95 shadow-[0_1px_2px_rgba(0,0,0,0.015)] rounded-2xl p-6.5 hover:border-blue-500/35 hover:ring-1 hover:ring-blue-500/5 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  {renderCategoryIcon(cat.iconType)}
                                  <span className="text-[10px] font-bold text-slate-450 bg-slate-50 px-2.5 py-1 rounded-full uppercase border border-slate-100">
                                    {cat.badge}
                                  </span>
                                </div>

                                <h3 className="text-slate-900 font-extrabold text-base tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                                  {cat.name}
                                </h3>

                                <p className="text-slate-455 text-xs leading-relaxed font-sans line-clamp-2 font-normal">
                                  {cat.description}
                                </p>
                              </div>

                              <div className="mt-5 pt-4.5 border-t border-slate-50 flex items-center justify-between text-blue-600 text-xs font-bold">
                                <span className="group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                                  Explore codes →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Original Categories Grid Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => selectCategory(cat.id)}
                      className="group bg-white border border-slate-100/95 shadow-[0_1px_2px_rgba(0,0,0,0.015)] rounded-2xl p-6.5 hover:border-blue-500/35 hover:ring-1 hover:ring-blue-500/5 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Header card icon & badge */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          {renderCategoryIcon(cat.iconType)}
                          <span className="text-[10px] font-bold text-slate-450 bg-slate-50 px-2.5 py-1 rounded-full uppercase border border-slate-100">
                            {cat.badge}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-slate-900 font-extrabold text-base tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-455 text-xs leading-relaxed font-sans line-clamp-2 font-normal">
                          {cat.description}
                        </p>
                      </div>

                      {/* Footer links */}
                      <div className="mt-5 pt-4.5 border-t border-slate-50 flex items-center justify-between text-blue-600 text-xs font-bold">
                        <span className="group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Explore codes →
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </section>

          </div>
        )}
      </main>

      {/* Admin Quick Entry Link Pill */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link 
          href="/admin-generator" 
          className="bg-slate-950 text-white font-extrabold text-xs px-4 py-2.5 rounded-full shadow-lg border border-slate-800 flex items-center gap-2 hover:bg-slate-900 hover:scale-105 transition-all select-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Admin Generator</span>
        </Link>
      </div>

      <footer id="app-footer" className="bg-white border-t border-slate-100/90 py-6 text-center text-xs text-slate-400 font-mono mt-12 select-none">
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
