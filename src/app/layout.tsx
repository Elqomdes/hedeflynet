import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientLayout from '@/components/ClientLayout';
import { AppProvider } from '@/contexts/AppContext';
import { CacheBusterProvider } from '@/components/CacheBusterProvider';
import { CacheUpdateNotification } from '@/components/CacheUpdateNotification';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

// Safe metadata base URL
const getMetadataBase = (): URL | undefined => {
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://hedefly.com';
    return new URL(url);
  } catch {
    return undefined;
  }
};

export const metadata: Metadata = {
  title: 'Hedefly - Öğrenci Koçluk Platformu',
  description: 'Modern öğrenci koçluk platformu ile öğrencilerinizin hedeflerine ulaşmasına yardımcı olun',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' }
    ],
  },
  ...(getMetadataBase() && { metadataBase: getMetadataBase() }),
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Hedefly',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="version" content={process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <AppProvider>
          <CacheBusterProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <CacheUpdateNotification />
          </CacheBusterProvider>
        </AppProvider>
      </body>
    </html>
  );
}
