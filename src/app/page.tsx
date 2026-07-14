import type { Metadata } from 'next';
import { getAllDocs, getCategoriesData, getArticlesData, getSettingsData } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

// Enable real-time dynamic rendering for newly generated articles
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'TechErrorLog.com | Technical Error Logging & Solutions',
  description: 'A clean, structured repository for logging and resolving technical errors.',
  alternates: {
    canonical: 'https://techerrorlog.com/',
  },
};

export default async function Page() {
  const docs = await getAllDocs();
  const categories = await getCategoriesData();
  const articlesList = await getArticlesData();
  const settings = await getSettingsData();
  
  return (
    <HomeClient 
      initialDocs={docs} 
      categoriesDb={categories} 
      articlesDb={articlesList}
      settingsDb={settings}
    />
  );
}
