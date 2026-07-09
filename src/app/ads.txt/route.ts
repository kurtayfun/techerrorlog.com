import { NextResponse } from 'next/server';
import { getSettingsData } from '@/lib/content';

export async function GET() {
  const settings = await getSettingsData();
  const publisherId = settings?.adsensePublisherId;

  if (!publisherId) {
    return new NextResponse('# Google AdSense is not configured yet. Set adsensePublisherId in Admin settings.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Standard AdSense ads.txt format
  // Strip "ca-pub-" prefix if present to format as pub-XXXXXXXXXXXXXXXX
  const pubNumber = publisherId.replace('ca-pub-', '');
  const content = `google.com, pub-${pubNumber}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
