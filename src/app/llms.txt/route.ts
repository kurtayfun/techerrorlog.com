import { NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const docs = await getAllDocs();

    // Build the llms.txt markdown content
    let markdown = `# TechErrorLog.com\n\n`;
    markdown += `> A clean, structured repository for logging and resolving technical errors and system diagnostics.\n\n`;

    markdown += `## Main Pages\n`;
    markdown += `- [/](https://techerrorlog.com/): Home page containing all diagnostic resources and search capabilities.\n`;
    markdown += `- [/about](https://techerrorlog.com/about): Learn about our mission to curate precise, verified, and clutter-free diagnostic workflows.\n`;
    markdown += `- [/privacy](https://techerrorlog.com/privacy): TechErrorLog privacy policy and administrative details.\n`;
    markdown += `- [/terms](https://techerrorlog.com/terms): TechErrorLog terms of use and professional liability disclaimers.\n\n`;

    if (docs && docs.length > 0) {
      markdown += `## Diagnostic Guides\n`;
      markdown += `An index of verified step-by-step diagnostic workflows for Windows errors, BSOD events, and system anomalies:\n\n`;

      docs.forEach((doc) => {
        const { title, description, slug, errorCode } = doc.metadata;
        const codePrefix = errorCode && errorCode !== 'General' ? `[${errorCode}] ` : '';
        markdown += `- [/blog/${slug}](https://techerrorlog.com/blog/${slug}): ${codePrefix}${title} - ${description}\n`;
      });
    }

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=18000',
      },
    });
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    return new NextResponse('Error generating diagnostic index.', { status: 500 });
  }
}
