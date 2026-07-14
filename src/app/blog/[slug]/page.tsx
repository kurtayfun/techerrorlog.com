import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import AdSlot from '@/components/AdSlot';
import { getDocBySlug, extractHeadings, getAllDocs, getArticlesData } from '@/lib/content';
import { ArrowLeft } from 'lucide-react';
import LazyBlogTOC from '@/components/LazyBlogTOC';
import LazyBlogMarkdown from '@/components/LazyBlogMarkdown';
import FeedbackPanel from '@/components/FeedbackPanel';

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const registeredArticles = await getArticlesData();
  const publishedSlugs = registeredArticles
    .filter((a: any) => a.status === 'published')
    .map((a: any) => a.slug);

  const docs = await getAllDocs();
  const existingSlugs = new Set(docs.map((doc) => doc.metadata.slug));

  return publishedSlugs
    .filter((slug: string) => existingSlugs.has(slug))
    .map((slug: string) => ({
      slug,
    }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  // Cross-reference with the master dynamic registry to prevent metadata indexing of deleted/draft items
  const registeredArticles = await getArticlesData();
  const isActive = registeredArticles.some((a: any) => a.slug === slug && a.status === 'published');
  if (!isActive) return {};

  const doc = await getDocBySlug(slug);
  if (!doc) return {};
  const url = `https://techerrorlog.com/blog/${slug}`;
  return {
    title: `${doc.metadata.title} | TechErrorLog`,
    description: doc.metadata.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: doc.metadata.title,
      description: doc.metadata.description,
      url: url,
      siteName: 'TechErrorLog',
      type: 'article',
      publishedTime: doc.metadata.date,
      authors: [doc.metadata.author || 'TechErrorLog Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.metadata.title,
      description: doc.metadata.description,
    },
  };
}

function stripFirstHeading(markdown: string): string {
  if (!markdown) return '';
  const trimmed = markdown.trim();
  const lines = trimmed.split('\n');
  if (lines.length > 0 && lines[0].startsWith('###')) {
    return lines.slice(1).join('\n');
  }
  return markdown;
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Cross-reference with the master dynamic registry to prevent direct URLs or indexing of draft/deleted items
  const registeredArticles = await getArticlesData();
  const isActive = registeredArticles.some((a: any) => a.slug === slug && a.status === 'published');
  
  if (!isActive) {
    // Elegant SEO redirection back to the home page to bypass 404/broken page experiences
    redirect('/');
  }

  const doc = await getDocBySlug(slug);

  if (!doc) {
    redirect('/');
  }

  const { metadata, content = '' } = doc;

  // Extract raw headings from original markdown
  const rawHeadings = extractHeadings(content || '');

  // Detect existing headings in rawHeadings list purely
  const hasMdxAltMethods = rawHeadings.some(h => {
    const textLower = h.text.toLowerCase();
    return textLower.includes('alternative methods') || textLower.includes('advanced fixes');
  });

  const hasMdxFaq = rawHeadings.some(h => {
    const textLower = h.text.toLowerCase();
    return textLower.includes('faq') || textLower.includes('frequently asked');
  });

  // Normalize headings for Table of Contents consistency and active scrolling
  const headings = rawHeadings.map(h => {
    const textLower = h.text.toLowerCase();
    if (textLower.includes('alternative methods') || textLower.includes('advanced fixes')) {
      return { ...h, id: 'alternative-methods', text: 'Alternative Methods' };
    }
    if (textLower.includes('faq') || textLower.includes('frequently asked')) {
      return { ...h, id: 'faq-assistance', text: 'FAQ Assistance' };
    }
    return h;
  });

  if (!hasMdxAltMethods) {
    headings.push({ id: 'alternative-methods', text: 'Alternative Methods', level: 3 });
  }
  if (!hasMdxFaq) {
    headings.push({ id: 'faq-assistance', text: 'FAQ Assistance', level: 3 });
  }

  // Segment-by-Segment parsing logic
  const normalized = content || '';
  
  // 1. Split at Deep Resolution Methods
  const deepResRegex = /(###\s+Deep\s+Resolution\s+Methods)/i;
  const deepResMatch = normalized.match(deepResRegex);
  
  let diagnosisMarkdown = normalized;
  let remaining = '';
  
  if (deepResMatch && deepResMatch.index !== undefined) {
    diagnosisMarkdown = normalized.substring(0, deepResMatch.index);
    remaining = normalized.substring(deepResMatch.index);
  }
  
  // 2. Identify the Alternative Methods section and FAQ section in the remaining text
  const altMethodsRegex = /(###\s+(?:Advanced\s+Fixes\s*&\s*)?Alternative\s+Methods|###\s+Advanced\s+Fixes)/i;
  const altMethodsMatch = remaining.match(altMethodsRegex);
  
  const faqRegex = /(###\s+FAQ\s+Assistance|###\s+FAQ|###\s+Frequently\s+Asked\s+Questions)/i;
  const faqMatch = remaining.match(faqRegex);
  
  let resolutionMarkdown = remaining;
  let alternativeMethodsMarkdown = '';
  let faqMarkdown = '';
  
  if (altMethodsMatch && altMethodsMatch.index !== undefined) {
    resolutionMarkdown = remaining.substring(0, altMethodsMatch.index);
    
    const altContent = remaining.substring(altMethodsMatch.index);
    const innerFaqMatch = altContent.match(faqRegex);
    if (innerFaqMatch && innerFaqMatch.index !== undefined) {
      alternativeMethodsMarkdown = altContent.substring(0, innerFaqMatch.index);
      faqMarkdown = altContent.substring(innerFaqMatch.index);
    } else {
      alternativeMethodsMarkdown = altContent;
    }
  } else if (faqMatch && faqMatch.index !== undefined) {
    resolutionMarkdown = remaining.substring(0, faqMatch.index);
    faqMarkdown = remaining.substring(faqMatch.index);
  }

  // Curated Alternative Methods fallback data
  let resolvedAltMethods = [];
  if (metadata.category.toLowerCase().includes('windows update')) {
    resolvedAltMethods = [
      {
        title: "Execute Windows Update Troubleshooter",
        desc: "Windows contains dedicated diagnostic engines to test local cryptographic containers, pending configurations, and repair background services.",
        steps: [
          "Open Settings by pressing Win + I key.",
          "Navigate to System > Troubleshoot > Other troubleshooters.",
          "Find Windows Update and click Run to automatically detect and repair issues."
        ]
      },
      {
        title: "Manually Clear Deployment Cache Directories",
        desc: "Incomplete update installation files cached in system directories can prevent newer builds from finishing download processes.",
        steps: [
          "Launch Command Prompt (Admin) and run: 'net stop wuauserv'.",
          "Open File Explorer and delete everything inside: 'C:\\Windows\\SoftwareDistribution\\Download'.",
          "Restart the services with: 'net start wuauserv' and try updating again."
        ]
      },
      {
        title: "Download Cumulative Updates Directly from Catalog",
        desc: "If the native Windows Update service fails to resolve connection handshakes, manually fetch the standalone patch installation files.",
        steps: [
          "Identify the KB number of the failing update (e.g., KB5022845).",
          "Visit the official Microsoft Update Catalog website.",
          "Search for the KB number, download the matching package, and install manually."
        ]
      }
    ];
  } else if (metadata.category.toLowerCase().includes('bsod')) {
    resolvedAltMethods = [
      {
        title: "Execute Windows Memory Diagnostic Tool",
        desc: "Corrupt memory sectors can trigger sudden driver page faults and kernel exception halts under load.",
        steps: [
          "Press Win + R, key in 'mdsched.exe' and press Enter.",
          "Select 'Restart now and check for problems (recommended)'.",
          "The system will restart, perform the test, and log any memory faults in event records."
        ]
      },
      {
        title: "Perform System File Integrity Verification",
        desc: "Ensure driver catalog signatures and core operating files are verified against official Microsoft assembly manifests.",
        steps: [
          "Open an elevated Command Prompt window.",
          "Run: 'DISM.exe /Online /Cleanup-image /Restorehealth' to download healthy component files.",
          "Run: 'sfc /scannow' to inspect and repair invalid system files on the disk."
        ]
      },
      {
        title: "Inspect Device Driver Profile Registries",
        desc: "Outdated graphics card drivers or conflicting network controller modules are the leading cause of IRQL failures.",
        steps: [
          "Right-click the Start Menu icon and select Device Manager.",
          "Locate flagged hardware categories, or graphics controllers marked with a warning symbol.",
          "Right-click and select 'Update driver' or 'Uninstall device' to prepare a fresh installation."
        ]
      }
    ];
  } else if (metadata.category.toLowerCase().includes('dll') || metadata.category.toLowerCase().includes('gaming')) {
    resolvedAltMethods = [
      {
        title: "Repair Visual C++ Redistributable Installations",
        desc: "Missing DLL files like vcruntime140 are typically resolved by repairing or deploying the corresponding C++ runtime package.",
        steps: [
          "Navigate to Control Panel > Programs > Programs and Features.",
          "Select the 'Microsoft Visual C++ Redistributable' entry (both x86 and x64 if applicable).",
          "Click Change, then select Repair. Alternatively, download a fresh bundle from Microsoft."
        ]
      },
      {
        title: "Re-register the Missing Assembly File",
        desc: "Tell the Windows dynamic link register about the newly repaired library file so software clients can bind calls correctly.",
        steps: [
          "Open Command Prompt as Administrator.",
          "Type 'regsvr32 vcruntime140.dll' (or your target DLL name) and hit Enter.",
          "Restart the active application to verify module hook registration."
        ]
      }
    ];
  } else {
    resolvedAltMethods = [
      {
        title: "Run System Diagnostics Scan",
        desc: "Perform a system diagnostics scan to inspect the integrity of local files, active driver states, and device registers.",
        steps: [
          "Open Command Prompt as Administrator.",
          "Type 'sfc /scannow' and press Enter.",
          "Wait for the scan to finish and restart your computer to apply files."
        ]
      },
      {
        title: "Utilize Built-in Troubleshooting Utility",
        desc: "Run Windows built-in troubleshooting steps to automatically isolate service failures, network issues, or corrupted software repositories.",
        steps: [
          "Navigate to Settings > Update & Security > Troubleshoot.",
          "Select the recommended troubleshooter for your system component.",
          "Apply the suggested automated fixes instantly."
        ]
      },
      {
        title: "Perform a Clean System Restart",
        desc: "Temporarily stop third-party startup applications or non-essential background processes which may conflict with active software configurations.",
        steps: [
          "Press Win + R, type 'msconfig' and hit Enter.",
          "Under the Services tab, check 'Hide all Microsoft services' and click Disable All.",
          "Reboot your computer in a simplified operating state."
        ]
      }
    ];
  }

  // Curated FAQs fallback data
  let resolvedFaqs = [];
  if (metadata.category.toLowerCase().includes('windows update')) {
    resolvedFaqs = [
      {
        q: "Why does Windows Update get stuck at a specific percentage screen?",
        a: "When Windows cannot unpack a corrupted package or loses connection to delivery servers, it halts the operation in the background. Running DISM or flushing the SoftwareDistribution folder restarts the queue securely."
      },
      {
        q: "Will clearing my SoftwareDistribution folder erase my update history logs?",
        a: "Yes, flushing the folder resets the local pending list and updates history logs view. This is highly beneficial because it forces Windows Update to run a clean query and rebuild a valid baseline queue."
      },
      {
        q: "How can I prevent Windows Update from triggering this error again?",
        a: "Keep at least 20GB of free space on your system partition and ensure background services like Cryptographic Services (cryptsvc) and Background Intelligent Transfer Service (BITS) are set to run automatically."
      }
    ];
  } else if (metadata.category.toLowerCase().includes('bsod')) {
    resolvedFaqs = [
      {
        q: "How can I find out exactly which driver triggered the Blue Screen?",
        a: "You can download Microsoft's free 'BlueScreenView' utility or 'WinDbg'. These tools automatically parse the .dmp crash dump files saved inside 'C:\\Windows\\Minidump' to pin-point the offending library."
      },
      {
        q: "Does a blue screen mean my physical hard drive or RAM is failing?",
        a: "Most BSODs (around 85%) are related to software drivers mismatching memory allocations. Only a small fraction is caused by physical hardware wearing down. Run checking tools like Windows Memory Diagnostic to be sure."
      },
      {
        q: "What is 'IRQL' and why does it cause crash shutdowns?",
        a: "IRQL (Interrupt Request Level) defines the priority of processor threads. If a lower-priority driver attempts to access system-level memory address spaces reserved for high-priority processes, Windows halts the CPU to prevent file corruption."
      }
    ];
  } else {
    resolvedFaqs = [
      {
        q: "Is this error critical enough to cause personal data loss?",
        a: "No, these faults typically represent local software system mismatches, driver halts, or missing runtime assemblies. They do not corrupt user database libraries directly. However, keeping backups of important files is standard safe technical practice."
      },
      {
        q: "What causes these errors to suddenly appear out of nowhere?",
        a: "Sudden system updates, installation of new drivers, third-party optimizer programs, or sudden power shutdowns can leave file directories in a partially configured or mismatched stage."
      },
      {
        q: "What should I do if the recommended fix yields another error code?",
        a: "If the first line of defense fails, it means deep registry keys or network driver stacks require cleaner initialization. Proceed to Alternative Method 2 or 3, and ensure you run all commands in elevated Mode."
      }
    ];
  }

  const richSchemas = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `https://techerrorlog.com/blog/${slug}#article`,
        'isPartOf': {
          '@id': `https://techerrorlog.com/blog/${slug}#webpage`,
        },
        'headline': metadata.title,
        'description': metadata.description,
        'datePublished': metadata.date,
        'author': {
          '@type': 'Organization',
          'name': 'TechErrorLog Team',
          'url': 'https://techerrorlog.com',
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://techerrorlog.com/blog/${slug}`,
        },
        'about': {
          '@type': 'Thing',
          'name': metadata.errorCode || 'System Diagnostic',
          'alternateName': metadata.category,
        },
      },
      {
        '@type': 'HowTo',
        '@id': `https://techerrorlog.com/blog/${slug}#howto`,
        'name': `How to Fix ${metadata.errorCode !== 'General' ? metadata.errorCode + ': ' : ''}${metadata.title}`,
        'description': metadata.description,
        'estimatedCost': {
          '@type': 'MonetaryAmount',
          'currency': 'USD',
          'value': '0',
        },
        'totalTime': metadata.estTime.toLowerCase().includes('10') ? 'PT10M' : 'PT5M',
        'step': resolvedAltMethods.map((method, index) => ({
          '@type': 'HowToStep',
          'url': `https://techerrorlog.com/blog/${slug}#step-${index + 1}`,
          'name': method.title,
          'itemListElement': method.steps.map((stepText) => ({
            '@type': 'HowToDirection',
            'text': stepText,
          })),
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `https://techerrorlog.com/blog/${slug}#faq`,
        'mainEntity': resolvedFaqs.map((faq) => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a,
          },
        })),
      }
    ]
  };

  return (
    <div id="blog-viewport" className="min-h-screen flex flex-col bg-slate-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(richSchemas) }}
      />
      <Header />

      <main id="blog-container" className="flex-grow bg-white">
        {/* Container Scaffold: grid grid-cols-12 gap-8 px-6 py-10 max-w-7xl mx-auto bg-white text-slate-700 */}
        <div className="grid grid-cols-12 gap-8 px-6 py-10 max-w-7xl mx-auto bg-white text-slate-700">
          
          {/* LEFT COLUMN: Dynamic Table of Contents Sidebar [col-span-3 hidden md:block] */}
          <aside className="col-span-3 hidden md:block border-r border-slate-100 pr-4">
            <LazyBlogTOC headings={headings} />
          </aside>

          {/* RIGHT COLUMN: Technical Document Execution Panel [col-span-12 md:col-span-9] */}
          <section className="col-span-12 md:col-span-9 flex flex-col">
            
            {/* Breadcrumb Header to match Screenshot 3 */}
            <div id="blog-breadcrumbs" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse"></span>
              <span>{metadata.category}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-slate-900 font-extrabold text-3xl md:text-3.5xl tracking-tight mb-4 leading-tight">
              {metadata.title}
            </h1>

            {/* Subtelling description */}
            <p className="text-slate-500 text-sm italic mb-4 pl-4 border-l-2 border-slate-300 leading-relaxed font-sans font-normal">
              {metadata.description}
            </p>

            {/* Tag Pills */}
            {metadata.tags && metadata.tags.length > 0 && (
              <div id="blog-tags" className="flex flex-wrap gap-1.5 mb-6">
                {metadata.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/?tag=${t}`}
                    className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200 text-slate-500 hover:text-blue-600 font-mono font-extrabold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* Quad-cell Metric Grid - Beautifully bordered and divided to match Screenshot 3 */}
            <div id="blog-metadata-metrics-grid" className="border border-slate-200 bg-white rounded-xl divide-y divide-slate-100 md:divide-y-0 md:divide-x md:grid md:grid-cols-4 select-none mb-8">
              <div className="p-4 flex flex-col gap-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400">DIFFICULTY</span>
                <span className={`text-xs font-extrabold ${
                  metadata.difficulty.toLowerCase().includes('easy') ? 'text-emerald-600' :
                  metadata.difficulty.toLowerCase().includes('medium') ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {metadata.difficulty}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400">ESTIMATED TIME</span>
                <span className="text-xs font-extrabold text-slate-750">{metadata.estTime}</span>
              </div>
              <div className="p-4 flex flex-col gap-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400">WINDOWS OS</span>
                <span className="text-xs font-extrabold text-slate-750">10 / 11</span>
              </div>
              <div className="p-4 flex flex-col gap-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400">SUCCESS RATE</span>
                <span className="text-xs font-extrabold text-blue-600">{metadata.successRate}</span>
              </div>
            </div>

            {/* Mobile Table of Contents - Rendered immediately below the general info card on mobile viewport */}
            <div id="blog-toc-mobile-wrapper" className="block md:hidden">
              <LazyBlogTOC headings={headings} variant="mobile" />
            </div>

            {/* Diagnosis Segment Layout */}
            <div id="blog-diagnosis-segment" className="markdown-body">
              <LazyBlogMarkdown content={diagnosisMarkdown} />
            </div>

            {/* Followed immediately by AdSlot */}
            <div id="blog-ad-slot-quickfix">
              <AdSlot id="article-post-quickfix" type="horizontal" />
            </div>

            {/* Solution Callout Box */}
            <div id="blog-solution-callout" className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-800 rounded-r-lg my-6 shadow-sm">
              <div className="flex gap-2.5 items-start">
                <span className="text-lg">✅</span>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 mb-1">High-Priority Troubleshooting Summary</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Resetting active system update component stores and forcing service process re-registrations allows the Windows packaging catalog to align correctly, bypassing standard 0x80070002 deployment errors permanently.
                  </p>
                </div>
              </div>
            </div>

            {/* Deep Resolution Methods Markdown (Code Execution Snippets) */}
            <div id="blog-resolution-segment" className="markdown-body">
              <LazyBlogMarkdown content={resolutionMarkdown} />
            </div>

            {/* Alternative Methods Section */}
            {alternativeMethodsMarkdown ? (
              <section id="alternative-methods" className="scroll-mt-24 mt-10 mb-8 border-t border-slate-100 pt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2 pb-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
                  Alternative Methods
                </h3>
                <div className="markdown-body">
                  <LazyBlogMarkdown content={stripFirstHeading(alternativeMethodsMarkdown)} />
                </div>
              </section>
            ) : (
              <section id="alternative-methods" className="scroll-mt-24 mt-10 mb-8 border-t border-slate-100 pt-8 select-none">
                <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2 pb-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
                  Alternative Methods
                </h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed font-sans font-normal">
                  If the primary solutions above do not restore your system configuration, try these alternative diagnostic paths to isolate other possible issues:
                </p>
                
                <div className="space-y-4">
                  {resolvedAltMethods.map((method, index) => (
                    <div key={index} className="border border-slate-200/90 rounded-xl p-5 hover:bg-slate-50/40 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        {method.title}
                      </h4>
                      <p className="text-slate-500 text-[11px] mb-4 sm:pl-7 pl-0 leading-relaxed font-sans font-normal">
                        {method.desc}
                      </p>
                      <ul className="space-y-1.5 sm:pl-7 pl-0 list-none">
                        {method.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-xs text-slate-600 flex items-start gap-1.5 font-medium">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ Assistance Section */}
            {faqMarkdown ? (
              <section id="faq-assistance" className="scroll-mt-24 mt-10 mb-8 border-t border-slate-100 pt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2 pb-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
                  FAQ Assistance
                </h3>
                <div className="markdown-body">
                  <LazyBlogMarkdown content={stripFirstHeading(faqMarkdown)} />
                </div>
              </section>
            ) : (
              <section id="faq-assistance" className="scroll-mt-24 mt-10 mb-8 border-t border-slate-100 pt-8 select-none">
                <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2 pb-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
                  FAQ Assistance
                </h3>
                
                <div className="space-y-4">
                  {resolvedFaqs.map((faq, index) => (
                    <div key={index} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 hover:border-slate-300/80 transition-all">
                      <h4 className="font-bold text-xs text-slate-800 mb-2.5 flex items-start gap-2">
                        <span className="text-blue-600 font-extrabold shrink-0">Q:</span>
                        <span>{faq.q}</span>
                      </h4>
                      <div className="text-xs text-slate-500 leading-relaxed font-sans sm:pl-5 pl-0 sm:border-l border-none border-slate-200 font-normal">
                        <strong className="text-emerald-700 font-bold mr-1">Answer:</strong>
                        {faq.a}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <FeedbackPanel slug={slug} />

            {/* Dynamic Related Error Codes Section */}
            {await (async () => {
              const allDocs = await getAllDocs();
              const relatedDocs = allDocs
                .filter((d) => d.metadata.slug !== slug && d.metadata.category === metadata.category)
                .slice(0, 2);
              
              if (relatedDocs.length < 2) {
                const extraDocs = allDocs
                  .filter((d) => d.metadata.slug !== slug && d.metadata.category !== metadata.category)
                  .slice(0, 2 - relatedDocs.length);
                relatedDocs.push(...extraDocs);
              }

              return (
                <section id="related-error-codes" className="scroll-mt-24 mt-10 mb-4 border-t border-slate-100 pt-8 select-none">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2 pb-2">
                    <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
                    Related Error Codes
                  </h3>
                  <p className="text-slate-500 text-xs mb-6 leading-relaxed font-sans font-normal">
                    If the symptoms or code matches are still unaligned on your desktop layout, check out these related reference guides:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedDocs.map((rDoc) => (
                      <Link 
                        key={rDoc.metadata.slug}
                        href={`/blog/${rDoc.metadata.slug}`}
                        className="group border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                              {rDoc.metadata.category}
                            </span>
                            {rDoc.metadata.errorCode && (
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold tracking-tight">
                                {rDoc.metadata.errorCode}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-relaxed">
                            {rDoc.metadata.title}
                          </h4>
                        </div>
                        <div className="text-[10px] font-mono font-extrabold text-blue-600 flex items-center gap-1 mt-3.5 uppercase tracking-wide">
                          <span>View Solutions</span>
                          <ArrowLeft className="w-3 h-3 rotate-180 transform transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Secondary Ad Block nested cleanly beneath resolution logs */}
            <div id="blog-ad-slot-methods">
              <AdSlot id="article-mid-methods" type="horizontal" />
            </div>

          </section>

        </div>
      </main>

      {/* Footer */}
      <footer id="blog-footer" className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-mono">
        <div id="footer-inner" className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
          <span className="flex items-center gap-1.5 flex-row justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            System Health: Baseline Stable
          </span>
        </div>
      </footer>
    </div>
  );
}
