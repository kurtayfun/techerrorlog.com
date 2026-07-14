import type { Metadata } from 'next';
import { getAllDocs, getCategoriesData, getArticlesData, getSettingsData } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

// Enable real-time dynamic rendering for newly generated articles
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'TechErrorLog.com | System Diagnostic Logs & Solutions',
  description: 'A clean, structured repository for logging and resolving technical errors and system diagnostics.',
  alternates: {
    canonical: '/',
  },
};

export default async function Page() {
  const docs = await getAllDocs();
  const categories = await getCategoriesData();
  const articlesList = await getArticlesData();
  const settings = await getSettingsData();
  
  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://techerrorlog.com/#website',
        'url': 'https://techerrorlog.com',
        'name': 'TechErrorLog',
        'description': 'A clean, structured repository for logging and resolving technical errors and system diagnostics.',
        'publisher': {
          '@id': 'https://techerrorlog.com/#organization'
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://techerrorlog.com/?search={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': 'https://techerrorlog.com/#organization',
        'name': 'TechErrorLog',
        'url': 'https://techerrorlog.com',
        'logo': 'https://techerrorlog.com/icon.png',
        'sameAs': []
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <HomeClient 
        initialDocs={docs} 
        categoriesDb={categories} 
        articlesDb={articlesList}
        settingsDb={settings}
      />
    </>
  );
}
