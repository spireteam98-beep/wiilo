import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mohamed Royal',
  description: 'Watch premium videos and read exclusive articles',
  openGraph: {
    title: 'Royal Notes',
    description: 'Watch premium videos and read exclusive articles',
    url: 'https://mohamedroyal.com',
    siteName: 'Royal',
    images: [
      {
        url: '/api/og?title=Dhuux&description=Watch premium videos and read exclusive articles',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhuux',
    description: 'Watch premium videos and read exclusive articles',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8069025169541750"
          crossOrigin="anonymous"
        />

        <AuthProvider>
          <PlayerProvider>
            {children}
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
