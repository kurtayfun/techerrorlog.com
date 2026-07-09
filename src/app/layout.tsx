import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSettingsData } from '@/lib/content';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TechErrorLog.com',
  description: 'A clean, structured repository for logging and resolving technical errors.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettingsData();
  const adsenseEnabled = !!settings?.adsenseEnabled;
  const adsensePublisherId = settings?.adsensePublisherId || '';

  return (
    <html lang="en" className={`${inter.variable} min-h-screen`} suppressHydrationWarning>
      <head>
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        {/* Inject AdSense Configuration for Client-side AdSlot Components */}
        <script
          id="adsense-config"
          dangerouslySetInnerHTML={{
            __html: `
              window.__adsenseConfig = {
                enabled: ${adsenseEnabled},
                publisherId: ${JSON.stringify(adsensePublisherId)}
              };
            `,
          }}
        />
        {/* Google AdSense Script Tag */}
        {adsenseEnabled && adsensePublisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body id="root-body" className="bg-slate-50 text-slate-700 font-sans min-h-screen transition-colors duration-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
