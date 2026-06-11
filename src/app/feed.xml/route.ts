import { NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/content';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET() {
  const docs = await getAllDocs();
  const siteUrl = 'https://techerrorlog.com';

  const feedItemsXml = docs
    .map((doc) => {
      const url = `${siteUrl}/blog/${doc.metadata.slug}`;
      const pubDate = doc.metadata.date
        ? new Date(doc.metadata.date).toUTCString()
        : new Date().toUTCString();

      return `    <item>
      <title>${escapeXml(doc.metadata.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(doc.metadata.description)}</description>
      <category>${escapeXml(doc.metadata.category)}</category>
    </item>`;
    })
    .join('\n');

  const rssFeedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechErrorLog Diagnostic Directory</title>
    <link>${siteUrl}</link>
    <description>Precise, verified, and clutter-free diagnostic workflows for Windows error codes.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${feedItemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssFeedXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
    },
  });
}
