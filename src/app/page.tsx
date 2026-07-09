import { getAllDocs, getCategoriesData, getArticlesData, getSettingsData } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

// Enable real-time dynamic rendering for newly generated articles
export const dynamic = "force-dynamic";

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
