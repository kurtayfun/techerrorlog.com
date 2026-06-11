import { getAllDocs, getCategoriesData, getArticlesData, getSettingsData } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

// Force dynamic execution so new generated dynamic documents appear in real time on refresh
export const dynamic = "force-dynamic";

export default async function Page() {
  const docs = await getAllDocs();
  const categories = getCategoriesData();
  const articlesList = getArticlesData();
  const settings = getSettingsData();
  
  return (
    <HomeClient 
      initialDocs={docs} 
      categoriesDb={categories} 
      articlesDb={articlesList}
      settingsDb={settings}
    />
  );
}
