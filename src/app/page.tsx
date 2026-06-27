import { getAllDocs, getCategoriesData, getArticlesData, getSettingsData } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

// For static export, the main landing page is pre-compiled at build time.
export const dynamic = "force-static";

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
