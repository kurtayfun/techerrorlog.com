import type { MetadataRoute } from 'next';
import { getAllDocs, getArticlesData } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await getAllDocs();
  const registeredArticles = getArticlesData();
  
  // Create a filter set of active registered slugs with published status
  const activeSlugs = new Set(
    registeredArticles
      .filter((a: any) => a.status === 'published')
      .map((a: any) => a.slug)
  );

  const blogUrls: MetadataRoute.Sitemap = docs
    .filter((doc) => activeSlugs.has(doc.metadata.slug))
    .map((doc) => ({
      url: `https://techerrorlog.com/blog/${doc.metadata.slug}`,
      lastModified: new Date(doc.metadata.date || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    {
      url: 'https://techerrorlog.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...blogUrls,
  ];
}
