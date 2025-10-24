import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientLayout from '@/components/ClientLayout';
import { AppProvider } from '@/contexts/AppContext';
import { CacheBusterProvider } from '@/components/CacheBusterProvider';
import { CacheUpdateNotification } from '@/components/CacheUpdateNotification';

const inter = Inter({ subsets: ['latin'] });

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
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Cache-Buster': Date.now().toString(),
    'X-Request-Time': Date.now().toString()
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="cache-buster" content={Date.now().toString()} />
        <meta name="version" content={process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'} />
        <meta name="last-modified" content={new Date().toISOString()} />
      </head>
      <body className={inter.className}>
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
